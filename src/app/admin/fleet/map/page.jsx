"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleMap, useJsApiLoader, OverlayView, DirectionsRenderer } from "@react-google-maps/api";

const LIBRARIES = ["places"];

const MAP_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo default
const MAP_OPTIONS = {
  disableDefaultUI: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d3748" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1b4332" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f3460" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b5563" }] },
  ],
};

function DriverMarker({ driver, onClick, selected }) {
  return (
    <OverlayView
      position={{ lat: driver.latitude, lng: driver.longitude }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        onClick={() => onClick(driver)}
        style={{ transform: "translate(-50%, -100%)", cursor: "pointer" }}
        className="flex flex-col items-center"
      >
        {/* Truck icon bubble */}
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-lg transition-transform hover:scale-110 ${
            selected
              ? "bg-emerald-400 border-white scale-110"
              : "bg-blue-600 border-white"
          }`}
          style={{ boxShadow: selected ? "0 0 0 4px rgba(52,211,153,0.4)" : "0 4px 12px rgba(0,0,0,0.5)" }}
        >
          <span className="text-xl leading-none">🚛</span>
        </div>
        {/* Tail */}
        <div
          className={`w-0 h-0 -mt-px`}
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: selected ? "8px solid #34d399" : "8px solid #2563eb",
          }}
        />
        {/* Driver name label */}
        <div className="mt-1 bg-slate-900/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700 whitespace-nowrap shadow-md">
          {driver.full_name?.split(" ")[0] || "Driver"}
        </div>
      </div>
    </OverlayView>
  );
}

export default function FleetMapPage() {
  const [drivers, setDrivers] = useState([]);
  const [reports, setReports] = useState([]);  // active garbage reports
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [directions, setDirections] = useState([]);  // route lines to reports
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    id: "google-map-script",
    libraries: LIBRARIES,
  });

  // Fetch active drivers on mount
  const fetchActiveDrivers = useCallback(async () => {
    const { data } = await supabase
      .from("driver_profiles")
      .select("id, full_name, vehicle_number, assigned_zone, latitude, longitude, is_tracking")
      .eq("is_tracking", true);
    setDrivers(data || []);
  }, []);

  useEffect(() => {
    fetchActiveDrivers();

    // Fetch active (unresolved) garbage reports with lat/lng
    const fetchReports = async () => {
      const { data } = await supabase
        .from("CitizenReports")
        .select("id, issue_type, zone, latitude, longitude, status")
        .neq("status", "Resolved")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      setReports(data || []);
    };
    fetchReports();

    // Supabase Realtime — watch driver_profiles for location updates
    const channel = supabase
      .channel("fleet-map-drivers")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "driver_profiles",
        },
        (payload) => {
          const updated = payload.new;
          if (updated.is_tracking) {
            setDrivers((prev) => {
              const exists = prev.find((d) => d.id === updated.id);
              if (exists) {
                return prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d));
              }
              return [...prev, updated];
            });
          } else {
            // Driver stopped tracking — remove from map
            setDrivers((prev) => prev.filter((d) => d.id !== updated.id));
            setSelectedDriver((sel) => (sel?.id === updated.id ? null : sel));
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchActiveDrivers]);

  const onMapLoad = (map) => {
    mapRef.current = map;
    setMapLoaded(true);
  };

  const handleMarkerClick = (driver) => {
    setSelectedDriver((prev) => (prev?.id === driver.id ? null : driver));
    mapRef.current?.panTo({ lat: driver.latitude, lng: driver.longitude });
    // Compute routes from driver to all reports in their zone
    setDirections([]);
  };

  // Compute route whenever selectedDriver changes
  useEffect(() => {
    if (!isLoaded || !selectedDriver?.latitude || !selectedDriver?.longitude) {
      setDirections([]);
      return;
    }
    const zoneReports = reports.filter(
      (r) => r.latitude && r.longitude && r.zone === selectedDriver.assigned_zone
    );
    if (zoneReports.length === 0) { setDirections([]); return; }

    const svc = new window.google.maps.DirectionsService();
    const promises = zoneReports.map(
      (rep) =>
        new Promise((resolve) =>
          svc.route(
            {
              origin: { lat: selectedDriver.latitude, lng: selectedDriver.longitude },
              destination: { lat: rep.latitude, lng: rep.longitude },
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => resolve(status === "OK" ? result : null)
          )
        )
    );
    Promise.all(promises).then((results) => setDirections(results.filter(Boolean)));
  }, [isLoaded, selectedDriver, reports]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-red-400 text-center p-8">
        <div>
          <p className="text-2xl font-bold mb-2">🗺 Maps failed to load</p>
          <p className="text-sm text-slate-400">Check your Google Maps API key in <code className="bg-slate-800 px-1 rounded">.env.local</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col">
      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-white text-xl font-black tracking-tight flex items-center gap-2">
            <span className="text-emerald-400">●</span> Live Fleet Map
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {drivers.length} active driver{drivers.length !== 1 ? "s" : ""} on duty
          </p>
        </div>

        {/* Legend */}
        <div className="pointer-events-auto flex gap-3 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" /> GPS Active
          </span>
          <span className="flex items-center gap-1.5">
            🚛 Driver
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Garbage Report
          </span>
          <span className="text-slate-500">{reports.length} open report{reports.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Map */}
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={MAP_CENTER}
          zoom={12}
          options={MAP_OPTIONS}
          onLoad={onMapLoad}
        >
          {/* Route lines from selected driver to reports */}
          {directions.map((dir, i) => (
            <DirectionsRenderer
              key={i}
              directions={dir}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#34d399",
                  strokeOpacity: 0,
                  strokeWeight: 0,
                  icons: [{
                    icon: {
                      path: "M 0,-1 0,1",
                      strokeOpacity: 1,
                      strokeColor: "#34d399",
                      strokeWeight: 3,
                      scale: 3,
                    },
                    offset: "0",
                    repeat: "14px",
                  }],
                },
              }}
            />
          ))}

          {/* Garbage report pins */}
          {reports
            .filter((r) => r.latitude && r.longitude)
            .map((rep) => (
              <OverlayView
                key={rep.id}
                position={{ lat: rep.latitude, lng: rep.longitude }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div style={{ transform: "translate(-50%, -100%)" }} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-lg"
                    style={{ boxShadow: "0 0 0 3px rgba(239,68,68,0.35)" }}
                  >
                    <span className="text-sm leading-none">🗑️</span>
                  </div>
                  <div className="w-0 h-0 -mt-px" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "6px solid #ef4444" }} />
                  <div className="mt-0.5 text-[9px] font-bold bg-red-900/90 text-white px-1.5 py-0.5 rounded-full border border-red-700 whitespace-nowrap">
                    {rep.zone}
                  </div>
                </div>
              </OverlayView>
            ))}

          {/* Driver markers */}
          {drivers
            .filter((d) => d.latitude && d.longitude)
            .map((driver) => (
              <DriverMarker
                key={driver.id}
                driver={driver}
                onClick={handleMarkerClick}
                selected={selectedDriver?.id === driver.id}
              />
            ))}
        </GoogleMap>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <div className="w-10 h-10 border-2 border-slate-500 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium">Loading map...</p>
          </div>
        </div>
      )}

      {/* Selected Driver Info Panel */}
      {selectedDriver && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 p-5 min-w-[320px] max-w-sm animate-slide-up"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-lg">
                🚛
              </div>
              <div>
                <p className="text-white font-bold text-sm">{selectedDriver.full_name || "Unknown Driver"}</p>
                <p className="text-slate-400 text-xs">{selectedDriver.vehicle_number || "No vehicle"}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDriver(null)}
              className="text-slate-500 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-800 rounded-xl p-3">
              <p className="text-slate-500 mb-0.5">Zone</p>
              <p className="text-white font-semibold">📍 {selectedDriver.assigned_zone || "—"}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3">
              <p className="text-slate-500 mb-0.5">Status</p>
              <p className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                On Duty
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 col-span-2">
              <p className="text-slate-500 mb-0.5">GPS Coordinates</p>
              <p className="text-slate-300 font-mono text-[11px]">
                {selectedDriver.latitude?.toFixed(6)}, {selectedDriver.longitude?.toFixed(6)}
              </p>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps?q=${selectedDriver.latitude},${selectedDriver.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl py-2.5 transition"
          >
            🗺 Open in Google Maps
          </a>
        </div>
      )}

      {/* No active drivers overlay */}
      {mapLoaded && drivers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center max-w-xs">
            <p className="text-4xl mb-3">🚛</p>
            <p className="text-white font-bold mb-1">No Active Drivers</p>
            <p className="text-slate-400 text-sm">Drivers will appear here once they tap &quot;Start Journey&quot; on their device.</p>
          </div>
        </div>
      )}


    </div>
  );
}
