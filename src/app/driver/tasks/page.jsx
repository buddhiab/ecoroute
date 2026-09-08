"use client";

import { useEffect, useState, useRef, use } from "react";
import { supabase } from "@/lib/supabase";

export default function DriverTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [driverId, setDriverId] = useState(null);
  const [trackingTaskId, setTrackingTaskId] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const watcherRef = useRef(null);

  useEffect(() => {
    let resolvedDriverId = null;
    let channel;

    async function loadAssignedTasks() {
      // 1. Get current driver's profile id from auth or localStorage fallback
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

      // 2. Fetch all tasks assigned to this specific driver
      const { data, error } = await supabase
        .from("CitizenReports")
        .select("*")
        .eq("assigned_driver_id", resolvedDriverId)
        .order("created_at", { ascending: false });

      if (!error) setTasks(data || []);
      setIsLoading(false);

      // 3. Setup realtime subscription for tasks assigned to this driver
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

    return () => {
      if (channel) supabase.removeChannel(channel);
      stopGPS();
    };
  }, []);

  // --- GPS helpers ---
  const stopGPS = async () => {
    if (watcherRef.current !== null) {
      navigator.geolocation.clearWatch(watcherRef.current);
      watcherRef.current = null;
    }
    setTrackingTaskId(null);
    setGpsError(null);
  };

  const startJourney = async (task) => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported on this device.");
      return;
    }

    // First update task status to In Progress
    await supabase
      .from("CitizenReports")
      .update({ status: "In Progress" })
      .eq("id", task.id);

    setTrackingTaskId(task.id);
    setGpsError(null);

    // Clear any previous watcher
    if (watcherRef.current !== null) {
      navigator.geolocation.clearWatch(watcherRef.current);
    }

    watcherRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
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
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  const markResolved = async (taskId) => {
    // Stop GPS and mark driver as not tracking
    stopGPS();
    if (driverId) {
      await supabase
        .from("driver_profiles")
        .update({ is_tracking: false, latitude: null, longitude: null })
        .eq("id", driverId);
    }
    // Update task status
    await supabase
      .from("CitizenReports")
      .update({ status: "Resolved" })
      .eq("id", taskId);

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "Resolved" } : t))
    );
  };

  if (isLoading)
    return (
      <div className="p-6 text-slate-400 font-medium flex items-center gap-2">
        <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        Loading assigned tasks...
      </div>
    );

  return (
    <div className="p-6 md:p-8 text-white space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Active Operational Tasks ({tasks.filter((t) => t.status !== "Resolved").length})
        </h1>
        {trackingTaskId && (
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            GPS Active
          </span>
        )}
      </div>

      {gpsError && (
        <div className="bg-red-900/30 border border-red-500/40 text-red-400 text-sm rounded-xl p-4">
          ⚠️ {gpsError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.length === 0 ? (
          <p className="text-slate-400 col-span-2">No active tasks assigned by dispatch.</p>
        ) : (
          tasks.map((task) => {
            const isTracking = trackingTaskId === task.id;
            const isResolved = task.status === "Resolved";

            return (
              <div
                key={task.id}
                className={`bg-slate-900 p-6 rounded-2xl border space-y-4 transition-colors ${
                  isTracking
                    ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold px-3 py-1 bg-[#00A878]/10 text-[#00A878] rounded-full border border-[#00A878]/20">
                    {task.issue_type}
                  </span>
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    📍 {task.zone}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">{task.description}</p>

                {/* Location info */}
                {task.exact_address && (
                  <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 mt-2">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Exact Address / Landmark</p>
                    <p className="text-sm font-medium text-slate-200 leading-snug">{task.exact_address}</p>
                  </div>
                )}

                {(task.latitude || task.longitude) && (
                  <a
                    href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 underline flex items-center gap-1 mt-2"
                  >
                    📍 View exact location on Maps
                  </a>
                )}

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

                  <div className="flex gap-2">
                    {/* Start Journey button — show for non-resolved tasks that aren't being tracked */}
                    {!isResolved && !isTracking && task.status !== "Resolved" && (
                      <button
                        onClick={() => startJourney(task)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                      >
                        🚛 Start Journey
                      </button>
                    )}

                    {/* Stop tracking button if this task is being tracked */}
                    {isTracking && (
                      <button
                        onClick={stopGPS}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        ⏸ Pause GPS
                      </button>
                    )}

                    {/* Mark Resolved */}
                    {!isResolved && (
                      <button
                        onClick={() => markResolved(task.id)}
                        className="bg-[#00A878] hover:bg-[#009066] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-[#00A878]/20"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {isTracking && (
                  <div className="text-xs text-emerald-400/80 flex items-center gap-1.5 pt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Broadcasting your live location to admin &amp; citizen
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
