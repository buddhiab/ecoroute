"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const formatDistance = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

const buzz = () => {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(100);
};

export default function DriverTasks() {
  const [tasks, setTasks] = useState([]);
  const [myPos, setMyPos] = useState(null);
  const [toast, setToast] = useState(null);
  const [resolveTargetId, setResolveTargetId] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };
  const [isLoading, setIsLoading] = useState(true);
  const [driverId, setDriverId] = useState(null);
  const [trackingTaskId, setTrackingTaskId] = useState(null);
  const [pausedTaskId, setPausedTaskId] = useState(null); // task paused mid-journey
  const [startedTaskIds, setStartedTaskIds] = useState([]); // journeys started this session
  const [gpsError, setGpsError] = useState(null);
  const watcherRef = useRef(null);

  // ── FIX 4: Filter tab state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("active"); // "active" | "resolved"

  // ── FIX 6: Per-task photo expand state ──────────────────────────────────────
  const [expandedPhotos, setExpandedPhotos] = useState({});
  const togglePhoto = (taskId) =>
    setExpandedPhotos((prev) => ({ ...prev, [taskId]: !prev[taskId] }));

  useEffect(() => {
    let resolvedDriverId = null;
    let channel;

    async function loadAssignedTasks() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: driverData } = await supabase
          .from("driver_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (driverData) resolvedDriverId = driverData.id;
      } else {
        const sessionStr = localStorage.getItem("demo_driver_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          resolvedDriverId = session.id;
        }
      }

      if (!resolvedDriverId) {
        setIsLoading(false);
        return;
      }

      setDriverId(resolvedDriverId);

      const { data, error } = await supabase
        .from("CitizenReports")
        .select("*")
        .eq("assigned_driver_id", resolvedDriverId)
        .order("created_at", { ascending: false });

      if (!error) setTasks(data || []);
      setIsLoading(false);

      channel = supabase
        .channel(`driver-tasks-${resolvedDriverId}-${Math.random()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "CitizenReports",
            filter: `assigned_driver_id=eq.${resolvedDriverId}`,
          },
          (payload) => {
            setTasks((prev) => {
              if (payload.eventType === "INSERT") return [payload.new, ...prev];
              if (payload.eventType === "UPDATE")
                return prev.map((t) => (t.id === payload.new.id ? payload.new : t));
              if (payload.eventType === "DELETE")
                return prev.filter((t) => t.id !== payload.old.id);
              return prev;
            });
          }
        )
        .subscribe();
    }

    loadAssignedTasks();

    // One-off position fix so task cards can show distance before a journey starts
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearTimeout(toastTimerRef.current);
      stopGPS();
    };
  }, []);

  // stopGPS — full stop used only by markResolved (no pause state)
  const stopGPS = async () => {
    if (watcherRef.current !== null) {
      navigator.geolocation.clearWatch(watcherRef.current);
      watcherRef.current = null;
    }
    setTrackingTaskId(null);
    setPausedTaskId(null);
    setGpsError(null);
  };

  // pauseGPS — soft stop: keeps task "In Progress" in DB, shows Resume button
  const pauseGPS = async (taskId) => {
    if (watcherRef.current !== null) {
      navigator.geolocation.clearWatch(watcherRef.current);
      watcherRef.current = null;
    }
    setTrackingTaskId(null);
    setGpsError(null);
    setPausedTaskId(taskId); // remember which task is paused
    // Tell DB driver is no longer broadcasting (but task stays In Progress)
    if (driverId) {
      await supabase
        .from("driver_profiles")
        .update({ is_tracking: false })
        .eq("id", driverId);
      // Separate update so GPS still works if the tracking_task_id column is missing
      await supabase
        .from("driver_profiles")
        .update({ tracking_task_id: null })
        .eq("id", driverId);
    }
  };

  // resumeJourney — re-start GPS for a paused task
  const resumeJourney = async (task) => {
    setPausedTaskId(null);
    await startJourney(task); // re-starts watcher + opens Maps
  };

  // Build a Google Maps navigation URL from a task
  const buildMapsUrl = (task) => {
    if (task.latitude && task.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}&travelmode=driving`;
    }
    if (task.exact_address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.exact_address)}&travelmode=driving`;
    }
    return null;
  };

  const startJourney = async (task) => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported on this device.");
      return;
    }

    await supabase
      .from("CitizenReports")
      .update({ status: "In Progress" })
      .eq("id", task.id);

    buzz();
    setTrackingTaskId(task.id);
    setStartedTaskIds((prev) => (prev.includes(task.id) ? prev : [...prev, task.id]));
    setGpsError(null);

    if (driverId) {
      // Separate update so GPS still works if the tracking_task_id column is missing
      await supabase
        .from("driver_profiles")
        .update({ tracking_task_id: task.id })
        .eq("id", driverId);
    }

    if (watcherRef.current !== null) {
      navigator.geolocation.clearWatch(watcherRef.current);
    }

    watcherRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMyPos({ lat: latitude, lng: longitude });
        if (driverId) {
          await supabase
            .from("driver_profiles")
            .update({ latitude, longitude, is_tracking: true })
            .eq("id", driverId);
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setGpsError("Unable to get GPS location. Please allow location access.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    // Auto-open navigation after GPS starts
    const mapsUrl = buildMapsUrl(task);
    if (mapsUrl) window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  const markResolved = async (taskId) => {
    setResolveTargetId(null);
    buzz();

    stopGPS();
    if (driverId) {
      await supabase
        .from("driver_profiles")
        .update({ is_tracking: false, latitude: null, longitude: null })
        .eq("id", driverId);
      await supabase
        .from("driver_profiles")
        .update({ tracking_task_id: null })
        .eq("id", driverId);
    }
    const { error } = await supabase
      .from("CitizenReports")
      .update({ status: "Resolved" })
      .eq("id", taskId);

    if (error) {
      showToast("Could not mark the task resolved. Check your connection and try again.", "error");
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "Resolved" } : t))
    );
    showToast("Task marked resolved. The citizen has been notified.");
  };

  // ── FIX 5: Urgency config by issue_type ─────────────────────────────────────
  const URGENCY = {
    "Hazardous Waste": {
      border: "border-red-500/60",
      shadow: "shadow-md shadow-red-500/10",
      badge: "bg-red-500/15 text-red-400 border-red-500/30",
      dot: "🔴",
      label: "Urgent",
    },
    "Illegal Dumping": {
      border: "border-red-500/60",
      shadow: "shadow-md shadow-red-500/10",
      badge: "bg-red-500/15 text-red-400 border-red-500/30",
      dot: "🔴",
      label: "Urgent",
    },
    "Missed Pickup": {
      border: "border-amber-500/50",
      shadow: "shadow-md shadow-amber-500/10",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      dot: "🟡",
      label: "High",
    },
    "Overflowing Bin": {
      border: "border-orange-500/50",
      shadow: "shadow-md shadow-orange-500/10",
      badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      dot: "🟠",
      label: "High",
    },
    "General Waste": {
      border: "border-slate-700",
      shadow: "",
      badge: "bg-[#00A878]/10 text-[#00A878] border-[#00A878]/20",
      dot: "🟢",
      label: "Normal",
    },
    Scheduled: {
      border: "border-slate-700",
      shadow: "",
      badge: "bg-[#00A878]/10 text-[#00A878] border-[#00A878]/20",
      dot: "🟢",
      label: "Normal",
    },
  };
  const getUrgency = (issueType) =>
    URGENCY[issueType] ?? URGENCY["General Waste"];

  // Derived lists for tabs
  const activeTasks   = tasks.filter((t) => t.status !== "Resolved");
  const resolvedTasks = tasks.filter((t) => t.status === "Resolved");
  const displayedTasks = activeTab === "active" ? activeTasks : resolvedTasks;

  if (isLoading)
    return (
      <div className="p-6 text-slate-400 font-medium flex items-center gap-2">
        <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        Loading assigned tasks...
      </div>
    );

  return (
    <div className="p-6 md:p-8 text-white space-y-5 max-w-5xl mx-auto">

      {/* ── Toast ── */}
      {toast && (
        <div
          role="status"
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] px-4 py-3 rounded-xl text-sm font-semibold shadow-lg border ${
            toast.type === "error"
              ? "bg-red-900/90 border-red-500/40 text-red-100"
              : "bg-emerald-900/90 border-emerald-500/40 text-emerald-100"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Resolve confirmation modal ── */}
      {resolveTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-bold">Mark task as resolved?</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This will notify the citizen and stop GPS tracking.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setResolveTargetId(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl text-sm font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => markResolved(resolveTargetId)}
                className="flex-1 bg-[#00A878] hover:bg-[#009066] text-white py-3 rounded-xl text-sm font-bold transition"
              >
                Yes, resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        {trackingTaskId && (
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            GPS Active
          </span>
        )}
      </div>

      {/* ── FIX 4: Filter Tabs ── */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "active"
              ? "bg-[#00A878] text-white shadow-md shadow-[#00A878]/20"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Active
          <span
            className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "active" ? "bg-white/20" : "bg-slate-800"
            }`}
          >
            {activeTasks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("resolved")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "resolved"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Resolved
          <span
            className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "resolved" ? "bg-white/20" : "bg-slate-800"
            }`}
          >
            {resolvedTasks.length}
          </span>
        </button>
      </div>

      {/* ── GPS Error Banner — only shown for pre-journey errors (e.g. GPS not supported) */}
      {gpsError && !trackingTaskId && (
        <div className="bg-red-900/30 border border-red-500/40 text-red-400 text-sm rounded-xl p-4 flex items-center gap-2">
          <span>⚠️</span> {gpsError}
        </div>
      )}

      {/* ── Task Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedTasks.length === 0 ? (
          <p className="text-slate-500 col-span-2 text-sm py-8 text-center">
            {activeTab === "active"
              ? "No active tasks assigned by dispatch."
              : "No resolved tasks yet."}
          </p>
        ) : (
          displayedTasks.map((task) => {
            const isTracking = trackingTaskId === task.id;
            const isResolved = task.status === "Resolved";
            const urgency    = getUrgency(task.issue_type);
            const photoOpen  = expandedPhotos[task.id] ?? false;

            // ── FIX 5: Urgency-aware card border ────────────────────────────
            const cardBorder = isTracking
              ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
              : isResolved
              ? "border-slate-800 opacity-60"
              : `${urgency.border} ${urgency.shadow}`;

            return (
              <div
                key={task.id}
                className={`bg-slate-900 p-5 rounded-2xl border space-y-4 transition-all ${cardBorder}`}
              >
                {/* ── Top row: urgency badge + zone ── */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* FIX 5: Urgency-colored badge */}
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${urgency.badge}`}>
                      {urgency.dot} {task.issue_type}
                    </span>
                    {(urgency.label === "Urgent" || urgency.label === "High") && !isResolved && (
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${urgency.badge}`}>
                        {urgency.label}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1 shrink-0">
                    📍 {task.zone}
                  </span>
                </div>

                <p className="text-base text-slate-300 leading-relaxed">{task.description}</p>

                {/* Location info */}
                {task.exact_address && (
                  <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Exact Address / Landmark</p>
                    <p className="text-sm font-medium text-slate-200 leading-snug">{task.exact_address}</p>
                  </div>
                )}

                {/* ── FIX 6: Inline photo viewer (collapsible, stays in PWA) ── */}
                {task.image_url && (
                  <div>
                    <button
                      onClick={() => togglePhoto(task.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A878] hover:text-emerald-400 bg-[#00A878]/10 px-3 py-1.5 rounded-lg border border-[#00A878]/20 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                        <circle cx="9" cy="9" r="2"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                      </svg>
                      {photoOpen ? "Hide Photo" : "View Attached Photo"}
                    </button>
                    {photoOpen && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={task.image_url}
                          alt="Report photo"
                          className="w-full max-h-56 object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Maps deep link + distance */}
                {(task.latitude || task.longitude) && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <a
                      href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                    >
                      📍 View exact location on Maps
                    </a>
                    {myPos && !isResolved && task.latitude && task.longitude && (
                      <span className="text-sm font-bold text-emerald-400">
                        {formatDistance(haversineKm(myPos.lat, myPos.lng, task.latitude, task.longitude))}
                      </span>
                    )}
                  </div>
                )}

                {/* ── Footer: status + action buttons ── */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <span
                    className={`text-xs font-bold ${
                      isResolved
                        ? "text-emerald-500"
                        : task.status === "In Progress"
                        ? "text-blue-400"
                        : "text-amber-400"
                    }`}
                  >
                    Status: {task.status || "Pending"}
                  </span>

                  <div className="flex gap-2 flex-wrap">
                    {/* Start Journey — only for truly Pending tasks (not paused, not in progress) */}
                    {!isResolved && !isTracking && pausedTaskId !== task.id && (
                      <button
                        onClick={() => startJourney(task)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl text-sm font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                      >
                        🚛 Start Journey
                      </button>
                    )}

                    {/* Resume Journey — shown when this specific task was paused */}
                    {pausedTaskId === task.id && !isTracking && (
                      <button
                        onClick={() => resumeJourney(task)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                      >
                        ▶️ Resume Journey
                      </button>
                    )}

                    {/* Navigate button — shown on any active task with a location */}
                    {!isResolved && buildMapsUrl(task) && (
                      <a
                        href={buildMapsUrl(task)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                      >
                        🗺️ Navigate
                      </a>
                    )}

                    {/* Pause GPS — renamed for clarity, calls pauseGPS not stopGPS */}
                    {isTracking && (
                      <button
                        onClick={() => pauseGPS(task.id)}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        ⏸️ Pause GPS
                      </button>
                    )}

                    {/* Mark Resolved — only after journey started (In Progress) */}
                    {!isResolved && (isTracking || pausedTaskId === task.id || startedTaskIds.includes(task.id)) && (
                      <button
                        onClick={() => { buzz(); setResolveTargetId(task.id); }}
                        className="bg-[#00A878] hover:bg-[#009066] text-white px-5 py-3 rounded-xl text-sm font-bold transition shadow-md shadow-[#00A878]/20"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {isTracking && (
                  <div className={`flex items-center gap-1.5 pt-1 text-xs ${
                    gpsError ? "text-red-400" : "text-emerald-400/80"
                  }`}>
                    {gpsError ? (
                      // ── Inline GPS error on the active card ──
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="font-semibold">GPS Error: {gpsError}</span>
                        <button
                          onClick={() => startJourney(task)}
                          className="ml-auto text-[10px] font-bold text-red-300 hover:text-white bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 px-2 py-0.5 rounded-lg transition"
                        >
                          Retry GPS
                        </button>
                      </>
                    ) : (
                      // ── Healthy GPS indicator ──
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        Broadcasting your live location to admin &amp; citizen
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
