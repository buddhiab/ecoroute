"use client";

import { use, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleMap, useJsApiLoader, Marker, OverlayView } from "@react-google-maps/api";

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#14532d" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1a36" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Next.js 16 App Router: params is a Promise in Client Components, use `use()` to unwrap
export default function CitizenTrackPage({ params }) {
  const { reportId } = use(params);

  const [report, setReport] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifyStatus, setNotifyStatus] = useState(null); // "granted"|"denied"|"pending"|null
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    id: "google-map-script-track",
  });

  // --- Load report + driver ---
  useEffect(() => {
    async function loadData() {
      if (!reportId) return;

      const { data: rep, error: repErr } = await supabase
        .from("CitizenReports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (repErr || !rep) {
        setError("Report not found. The link may be invalid or expired.");
        setLoading(false);
        return;
      }

      setReport(rep);

      if (!rep.assigned_driver_id) {
        setLoading(false);
        return;
      }

      const { data: drv } = await supabase
        .from("driver_profiles")
        .select("id, full_name, vehicle_number, assigned_zone, latitude, longitude, is_tracking")
        .eq("id", rep.assigned_driver_id)
        .single();

      setDriver(drv);
      setLoading(false);

      // Subscribe to live driver location updates
      const channel = supabase
        .channel(`track-driver-${rep.assigned_driver_id}-${Math.random()}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "driver_profiles",
            filter: `id=eq.${rep.assigned_driver_id}`,
          },
          (payload) => {
            setDriver((prev) => ({ ...prev, ...payload.new }));
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }

    loadData();
  }, [reportId]);

  // --- Web Push subscription ---
  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setNotifyStatus("unsupported");
      return;
    }

    setNotifyStatus("pending");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotifyStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });

      await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, subscription: sub.toJSON() }),
      });

      setNotifyStatus("granted");
    } catch (err) {
      console.error("Push subscribe error:", err);
      setNotifyStatus("denied");
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  // Derived values
  const citizenLat = report?.latitude ?? null;
  const citizenLng = report?.longitude ?? null;
  const driverLat = driver?.latitude ?? null;
  const driverLng = driver?.longitude ?? null;
  const hasDriverLocation = driverLat && driverLng;
  const hasCitizenLocation = citizenLat && citizenLng;

  const distanceKm =
    hasDriverLocation && hasCitizenLocation
      ? haversineKm(citizenLat, citizenLng, driverLat, driverLng)
      : null;

  const mapCenter =
    hasDriverLocation
      ? { lat: driverLat, lng: driverLng }
      : hasCitizenLocation
      ? { lat: citizenLat, lng: citizenLng }
      : { lat: 6.9271, lng: 79.8612 };

  const taskStatus = report?.status || "Pending";
  const isArrived = distanceKm !== null && distanceKm < 0.15;
  const statusLabel = isArrived
    ? "Arrived 🎉"
    : driver?.is_tracking
    ? "On the way 🚛"
    : taskStatus === "Resolved"
    ? "Task Completed ✅"
    : taskStatus;

  // --- UI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-600 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading your tracking page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center px-8">
        <div>
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-xl font-bold text-white mb-2">Report Not Found</h1>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 bg-slate-900 border-b border-slate-800">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
              ♻️
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">EcoRoute</span>
          </div>
          <h1 className="text-lg font-black text-white">Track Your Pickup</h1>
          <p className="text-slate-400 text-xs mt-0.5">Report #{reportId} · {report?.issue_type}</p>
        </div>
      </div>

      {/* Status banner */}
      <div className="max-w-lg mx-auto w-full px-5 pt-5">
        <div
          className={`rounded-2xl px-5 py-4 flex items-center justify-between border ${
            isArrived
              ? "bg-emerald-500/10 border-emerald-500/30"
              : driver?.is_tracking
              ? "bg-blue-500/10 border-blue-500/30"
              : taskStatus === "Resolved"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-slate-800 border-slate-700"
          }`}
        >
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Status</p>
            <p className="text-white font-bold text-sm">{statusLabel}</p>
          </div>
          {distanceKm !== null && (
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium mb-0.5">Distance</p>
              <p className="text-white font-bold text-sm">
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)} m`
                  : `${distanceKm.toFixed(1)} km`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="max-w-lg mx-auto w-full px-5 mt-4">
        <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl" style={{ height: 320 }}>
          {loadError ? (
            <div className="h-full flex items-center justify-center bg-slate-900 text-slate-400 text-sm text-center p-4">
              Map failed to load. Check your Google Maps API key.
            </div>
          ) : isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={hasDriverLocation && hasCitizenLocation ? 14 : 15}
              options={MAP_OPTIONS}
              onLoad={(map) => { mapRef.current = map; }}
            >
              {/* Citizen pin */}
              {hasCitizenLocation && (
                <OverlayView
                  position={{ lat: citizenLat, lng: citizenLng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div style={{ transform: "translate(-50%, -100%)" }} className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-lg">
                      <span className="text-base leading-none">📍</span>
                    </div>
                    <div className="w-0 h-0 -mt-px" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid #f59e0b" }} />
                    <div className="mt-1 text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-full border border-slate-700 whitespace-nowrap">Your Location</div>
                  </div>
                </OverlayView>
              )}

              {/* Driver pin */}
              {hasDriverLocation && driver?.is_tracking && (
                <OverlayView
                  position={{ lat: driverLat, lng: driverLng }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div style={{ transform: "translate(-50%, -100%)" }} className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-lg">
                      <span className="text-base leading-none">🚛</span>
                    </div>
                    <div className="w-0 h-0 -mt-px" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid #2563eb" }} />
                    <div className="mt-1 text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-full border border-slate-700 whitespace-nowrap">
                      {driver?.full_name?.split(" ")[0] || "Driver"}
                    </div>
                  </div>
                </OverlayView>
              )}
            </GoogleMap>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-900">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Driver card */}
      {driver ? (
        <div className="max-w-lg mx-auto w-full px-5 mt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl">
              🚛
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">{driver.full_name || "Assigned Driver"}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {driver.vehicle_number || "Vehicle unassigned"} · Zone: {driver.assigned_zone}
              </p>
            </div>
            {driver.is_tracking && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto w-full px-5 mt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
            <p className="text-slate-400 text-sm">No driver assigned yet. You'll be notified when one is dispatched.</p>
          </div>
        </div>
      )}

      {/* Push notification opt-in */}
      {driver && notifyStatus !== "granted" && (
        <div className="max-w-lg mx-auto w-full px-5 mt-4">
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-2xl">🔔</span>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">Get notified about updates</p>
              <p className="text-slate-400 text-xs mt-0.5">Allow notifications to be alerted when your driver arrives.</p>
            </div>
            {notifyStatus === "denied" ? (
              <span className="text-xs text-red-400 font-medium whitespace-nowrap">Blocked</span>
            ) : (
              <button
                onClick={subscribeToPush}
                disabled={notifyStatus === "pending"}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-60 whitespace-nowrap"
              >
                {notifyStatus === "pending" ? "..." : "Allow"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Report details */}
      <div className="max-w-lg mx-auto w-full px-5 mt-4 pb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-sm">
          <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Report Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-slate-500 text-xs">Issue Type</p>
              <p className="text-white font-medium">{report?.issue_type || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Zone</p>
              <p className="text-white font-medium">📍 {report?.zone || "—"}</p>
            </div>
          </div>
          {report?.description && (
            <div>
              <p className="text-slate-500 text-xs mb-0.5">Description</p>
              <p className="text-slate-300 text-xs leading-relaxed">{report.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
