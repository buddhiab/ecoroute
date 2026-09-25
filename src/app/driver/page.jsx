"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import React from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Truck,
  CheckCircle2,
  RefreshCw,
  Loader2,
  MapPin,
  Timer,
  User,
  Zap,
  TriangleAlert,
  AlertCircle,
  Clock,
} from "lucide-react"

// IndexedDB helpers (co-located for dashboard use)
const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open("EcoRouteDB", 1)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("syncQueue", {
        keyPath: "id",
        autoIncrement: true,
      })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const saveToOfflineQueue = async (payload) => {
  const db = await openDB()
  const tx = db.transaction("syncQueue", "readwrite")
  tx.objectStore("syncQueue").add(payload)
}



function StatusPill({ status }) {
  const map = {
    Pending: "bg-amber-900/40 text-amber-300 border-amber-700/40",
    "In Progress": "bg-blue-900/40 text-blue-300 border-blue-700/40",
    Completed: "bg-[#00A878]/20 text-emerald-300 border-[#00A878]/30",
    Resolved: "bg-[#00A878]/20 text-emerald-300 border-[#00A878]/30",
  }
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${map[status] ?? map.Pending}`}>
      {status ?? "Pending"}
    </span>
  )
}

function ElapsedTimer({ startTs }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTs) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startTs])
  const m = String(Math.floor(elapsed / 60)).padStart(2, "0")
  const s = String(elapsed % 60).padStart(2, "0")
  return <span className="font-mono text-[#00A878] font-bold text-sm">{m}:{s}</span>
}

// ── Status message config — icons instead of emoji ───────────────────────────
function StatusMessage({ message }) {
  if (!message) return null

  let Icon = CheckCircle2
  let cls = "bg-[#00A878]/15 text-emerald-300 border-[#00A878]/30"

  if (message.startsWith("❌") || message.includes("Failed")) {
    Icon = AlertCircle
    cls = "bg-red-900/30 text-red-300 border-red-700/40"
  } else if (message.startsWith("⚡") || message.includes("offline")) {
    Icon = Zap
    cls = "bg-amber-900/30 text-amber-300 border-amber-700/40"
  } else if (message.includes("Syncing")) {
    Icon = Loader2
    cls = "bg-blue-900/30 text-blue-300 border-blue-700/40"
  }

  // Strip emoji prefix for clean display
  const cleanMessage = message.replace(/^[^\w\s]*/, "").trim()

  return (
    <div
      className={`flex items-center gap-2.5 p-3 rounded-xl text-sm font-medium border ${cls}`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${message.includes("Syncing") ? "animate-spin" : ""}`} />
      <span>{cleanMessage}</span>
    </div>
  )
}

export default function DriverDashboard() {
  const [route, setRoute] = useState(null)
  const [routeLoading, setRouteLoading] = useState(true)
  const [routeStartTs, setRouteStartTs] = useState(null)
  const [statusMessage, setStatusMessage] = useState(null)
  const [isOffline, setIsOffline] = useState(false)
  const [isMarkingDone, setIsMarkingDone] = useState(false)
  const [driverProfile, setDriverProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [otherDrivers, setOtherDrivers] = useState([])
  const [driverStats, setDriverStats] = useState({ today: 0, week: 0, allTime: 0 })
  // Use a ref so fetchActiveRoute can always read the latest driver name
  const driverNameRef = React.useRef(null)
  const fetchActiveRouteRef = useRef(null)
  const [cachedRoute, setCachedRoute] = useState(null)

  useEffect(() => {
    let channel;
    async function loadDriverData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        let driverData = null;

        if (authError || !user) {
          // Fallback for UI demo: check if they just registered a mock session
          const demoSessionStr = localStorage.getItem("demo_driver_session");
          if (demoSessionStr) {
            const demoSession = JSON.parse(demoSessionStr);
            
            // Try fetching real DB state using the demo session ID
            if (demoSession.id) {
               const { data: dbData } = await supabase
                  .from("driver_profiles")
                  .select("id, full_name, vehicle_number, assigned_zone, recent_alert")
                  .eq("id", demoSession.id)
                  .single();
               
               if (dbData) {
                  driverData = dbData;
               } else {
                  driverData = demoSession; // fallback to purely local if DB deleted
               }
            } else {
               driverData = demoSession;
            }
          } else {
            console.warn("No active session found");
            setProfileLoading(false);
            return;
          }
        } else {
          // Real authenticated user fetch
          const { data: dbData, error: dbError } = await supabase
            .from("driver_profiles")
            .select("id, full_name, vehicle_number, assigned_zone, recent_alert")
            .eq("user_id", user.id)
            .single();

          if (dbError) throw dbError;
          driverData = dbData;
        }

        setDriverProfile(driverData);
        driverNameRef.current = driverData?.full_name ?? null;
        // Profile is loaded — now safe to load the route filtered by this driver
        fetchActiveRouteRef.current?.();

        // Fetch other drivers — only public-safe fields, no vehicle plates or full zone
        const { data: allDrivers } = await supabase
          .from("driver_profiles")
          .select("id, full_name, is_tracking")
          .neq("id", driverData?.id ?? "00000000-0000-0000-0000-000000000000");
        setOtherDrivers(allDrivers ?? []);

        // ── Driver performance stats from CitizenReports ──────────────────────
        if (driverData?.id) {
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          const weekStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();

          const [{ count: todayCount }, { count: weekCount }, { count: allCount }] = await Promise.all([
            supabase.from("CitizenReports")
              .select("*", { count: "exact", head: true })
              .eq("assigned_driver_id", driverData.id)
              .eq("status", "Resolved")
              .gte("updated_at", todayStart),
            supabase.from("CitizenReports")
              .select("*", { count: "exact", head: true })
              .eq("assigned_driver_id", driverData.id)
              .eq("status", "Resolved")
              .gte("updated_at", weekStart),
            supabase.from("CitizenReports")
              .select("*", { count: "exact", head: true })
              .eq("assigned_driver_id", driverData.id)
              .eq("status", "Resolved"),
          ]);

          setDriverStats({
            today:   todayCount ?? 0,
            week:    weekCount  ?? 0,
            allTime: allCount   ?? 0,
          });
        }

        // SET UP SUPABASE REALTIME if we have an ID
        if (driverData && driverData.id) {
          channel = supabase
            .channel(`driver-updates-${driverData.id}-${Math.random()}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'driver_profiles',
                filter: `id=eq.${driverData.id}` 
              },
              (payload) => {
                setDriverProfile(prev => ({ ...prev, ...payload.new }));
              }
            )
            .subscribe();
        }

      } catch (error) {
        console.error("Error fetching driver profile:", error.message);
      } finally {
        setProfileLoading(false);
      }
    }

    loadDriverData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // ── Fetch active route assigned to THIS driver only
  const fetchActiveRoute = useCallback(async () => {
    const driverName = driverNameRef.current
    // Never fall back to an unfiltered query — that would show another driver's route
    if (!driverName) {
      setRoute(null)
      setRouteLoading(false)
      return
    }
    setRouteLoading(true)
    const { data } = await supabase
      .from("Routes")
      .select("*")
      .eq("status", "In Progress")
      .eq("driver_name", driverName)
      .limit(1)
      .maybeSingle()
    if (data) {
      setRoute(data)
      setRouteStartTs((prev) => prev ?? Date.now())
      try {
        localStorage.setItem("driver_cached_route", JSON.stringify({ ...data, cachedAt: Date.now() }))
      } catch {}
    } else {
      setRoute(null)
      try {
        localStorage.removeItem("driver_cached_route")
      } catch {}
    }
    setRouteLoading(false)
  }, [])

  useEffect(() => {
    fetchActiveRouteRef.current = fetchActiveRoute
  }, [fetchActiveRoute])

  // ── Boot: SW + network listeners + route fetch
  useEffect(() => {
    if (typeof window === "undefined") return
    setIsOffline(!navigator.onLine)

    try {
      const raw = localStorage.getItem("driver_cached_route")
      if (raw) setCachedRoute(JSON.parse(raw))
    } catch {}

    const onOffline = () => {
      setIsOffline(true)
      try {
        const raw = localStorage.getItem("driver_cached_route")
        if (raw) setCachedRoute(JSON.parse(raw))
      } catch {}
    }
    const onOnline = async () => {
      setIsOffline(false)
      // Auto-sync offline queue on reconnection
      try {
        const db = await openDB()
        const tx = db.transaction("syncQueue", "readonly")
        const req = tx.objectStore("syncQueue").getAll()
        req.onsuccess = async () => {
          const tasks = req.result
          if (!tasks.length) return
          setStatusMessage("🔄 Syncing offline data…")
          for (const task of tasks) {
            await supabase
              .from("Routes")
              .update({ status: "Completed" })
              .eq("id", task.routeId)
            await supabase.from("HCILogs").insert([
              {
                task_name: "Mark Route Completed",
                clicks: 1,
                time_taken: task.timeTakenMs,
              },
            ])
          }
          const clearTx = db.transaction("syncQueue", "readwrite")
          clearTx.objectStore("syncQueue").clear()
          setStatusMessage("✅ Offline data synced to server!")
          setTimeout(() => setStatusMessage(null), 5000)
        }
      } catch {
        // IndexedDB unavailable
      }
      fetchActiveRoute()
    }

    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)

    // Online: the route is fetched once the driver profile has loaded (see loadDriverData)
    if (!navigator.onLine) setRouteLoading(false)

    return () => {
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [fetchActiveRoute])

  // ── Mark route as complete
  const handleJobDone = async () => {
    if (!route) return
    setIsMarkingDone(true)
    const timeTakenMs = routeStartTs ? Date.now() - routeStartTs : 0

    if (isOffline) {
      await saveToOfflineQueue({ routeId: route.id, timeTakenMs })
      setStatusMessage("⚡ Saved offline — will sync when connection returns.")
      setRoute({ ...route, status: "Completed" })
      setIsMarkingDone(false)
      return
    }

    try {
      await supabase.from("Routes").update({ status: "Completed" }).eq("id", route.id)
      await supabase.from("HCILogs").insert([
        {
          task_name: "Mark Route Completed",
          clicks: 1,
          time_taken: timeTakenMs,
        },
      ])
      setRoute({ ...route, status: "Completed" })
      setStatusMessage("✅ Route marked complete. HCI metrics logged.")
      setTimeout(() => setStatusMessage(null), 8000)
    } catch (err) {
      console.error("Error updating route:", err)
      setStatusMessage("❌ Failed to update route. Try again.")
    } finally {
      setIsMarkingDone(false)
    }
  }

  // Function for the driver to clear the alert
  const dismissAlert = async () => {
    setDriverProfile(prev => ({ ...prev, recent_alert: null })); // Optimistic UI update
    
    if (driverProfile?.id) {
      await supabase
        .from("driver_profiles")
        .update({ recent_alert: null })
        .eq("id", driverProfile.id);
    }
  };

  const isCompleted = route?.status === "Completed"

  if (profileLoading) {
    return <div className="p-6 text-white text-sm text-gray-400">Loading terminal data...</div>;
  }

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-5xl mx-auto w-full">

      {/* ── Page heading ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Live Route Board</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Real-time dispatch terminal ·{" "}
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <button
          onClick={fetchActiveRoute}
          disabled={routeLoading}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-xl transition-all duration-150 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#00A878]/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${routeLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── REAL-TIME RED ALERT BANNER ── */}
      {driverProfile?.recent_alert && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">🚨</span>
            <div>
              <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider">Urgent Dispatch Update</h4>
              <p className="text-red-200 text-sm">{driverProfile.recent_alert}</p>
            </div>
          </div>
          <button
            onClick={dismissAlert}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shrink-0 ml-4"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* ── PERFORMANCE STATS ── */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.12em] mb-3">
          My Performance
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Today",
              value: driverStats.today,
              icon: "✅",
              color: driverStats.today > 0 ? "text-emerald-400" : "text-slate-500",
              bg:    driverStats.today > 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-900 border-slate-800",
            },
            {
              label: "This Week",
              value: driverStats.week,
              icon: "📅",
              color: "text-blue-400",
              bg:    "bg-slate-900 border-slate-800",
            },
            {
              label: "All Time",
              value: driverStats.allTime,
              icon: "🏆",
              color: "text-amber-400",
              bg:    "bg-slate-900 border-slate-800",
            },
          ].map(({ label, value, icon, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 text-center ${bg}`}>
              <p className="text-lg mb-1">{icon}</p>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">{label}</p>
            </div>
          ))}
        </div>
        {/* ECO Reward note */}
        <p className="text-[11px] text-slate-600 mt-2 flex items-center gap-1.5">
          <span className="text-emerald-500">🌿</span>
          Each resolved task triggers an ECO token reward to the citizen — keep going!
        </p>
      </section>

      {/* ── ACTIVE ASSIGNED ROUTE ── */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.12em] mb-3">
          Active Assigned Route
        </h2>

        {routeLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex items-center justify-center gap-3 text-slate-500 font-medium text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Syncing routes from dispatch…
          </div>
        ) : isOffline && !route ? (
          <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-5 h-5 text-amber-400" strokeWidth={2} />
            </div>
            <div>
              <p className="font-semibold text-amber-300 text-sm">Offline — Cached Route</p>
              <p className="text-xs text-amber-400/70 mt-1 leading-relaxed">
                {cachedRoute
                  ? `${cachedRoute.zone ?? "Unknown zone"} · Route #${cachedRoute.id} (cached ${new Date(cachedRoute.cachedAt).toLocaleTimeString()}) — displaying last known route. Actions will queue locally.`
                  : "No cached route available. Connect to the internet to load your assignment."}
              </p>
            </div>
          </div>
        ) : route ? (
          <div
            className={`rounded-xl border overflow-hidden ${
              isCompleted
                ? "bg-[#00A878]/10 border-[#00A878]/25"
                : "bg-slate-900 border-[#00A878]/40"
            }`}
          >
            {/* Route header bar */}
            <div
              className={`px-5 py-3.5 border-b flex items-center justify-between gap-4 ${
                isCompleted
                  ? "bg-[#00A878]/15 border-[#00A878]/20"
                  : "bg-[#00A878]/10 border-[#00A878]/25"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00A878]/20 flex items-center justify-center shrink-0">
                  <Truck className="w-4.5 h-4.5 text-[#00A878]" style={{ width: 18, height: 18 }} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#00A878]/70 uppercase tracking-wider">
                    Assigned Zone
                  </p>
                  <p className="text-lg font-bold text-white leading-tight">{route.zone ?? "—"}</p>
                </div>
              </div>
              <StatusPill status={route.status ?? "In Progress"} />
            </div>

            {/* Route body */}
            <div className="px-5 py-5 space-y-4">
              {/* Driver info row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Driver", value: route.driver_name ?? driverProfile?.full_name ?? "Active Driver", mono: false },
                  { label: "Route ID", value: `#${route.id}`, mono: true },
                  {
                    label: "Elapsed",
                    value: isCompleted ? "Done" : routeStartTs ? "timer" : "—",
                    mono: false,
                  },
                ].map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3"
                  >
                    <p className="text-[11px] text-slate-500 font-medium mb-1.5">{label}</p>
                    {label === "Elapsed" ? (
                      isCompleted ? (
                        <span className="text-sm font-bold text-[#00A878]">Done</span>
                      ) : routeStartTs ? (
                        <ElapsedTimer startTs={routeStartTs} />
                      ) : (
                        <span className="text-sm font-bold text-slate-500">—</span>
                      )
                    ) : (
                      <p
                        className={`text-sm font-semibold text-slate-200 ${
                          mono ? "font-mono" : ""
                        }`}
                      >
                        {value}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Status message */}
              <StatusMessage message={statusMessage} />

              {/* Action button */}
              {isCompleted ? (
                <div className="w-full py-4 bg-[#00A878]/15 border border-[#00A878]/25 text-emerald-300 font-semibold text-sm text-center rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00A878]" />
                  Route Finished — Great work!
                </div>
              ) : (
                <Button
                  onClick={handleJobDone}
                  disabled={isMarkingDone}
                  className="w-full h-12 text-base font-bold bg-[#00A878] hover:bg-[#009468] text-white rounded-xl shadow-lg shadow-[#00A878]/20 transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                >
                  {isMarkingDone ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing…
                    </span>
                  ) : isOffline ? (
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Save Offline &amp; Mark Done
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Mark Route Done
                    </span>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Empty state — intentional and informative
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-7 h-7 text-slate-600" />
            </div>
            <p className="text-slate-300 font-semibold text-sm">No Active Route Assigned</p>
            <p className="text-slate-600 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
              You don&apos;t have an active route right now. Check with Fleet Dispatch for your next assignment.
            </p>
          </div>
        )}
      </section>

      {/* ── DRIVER ROSTER ── */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.12em] mb-3">
          Driver Roster — Active Shift
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
             <div className="flex items-center gap-2 mb-4">
                <span className="text-emerald-500">⚡</span>
                <h3 className="text-white font-bold text-lg">
                   {driverProfile?.full_name || "Active Driver"}
                </h3>
             </div>
             <div className="text-sm text-slate-300 space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-center">
                   <span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Current Zone</span>
                   <span className="font-medium text-emerald-400">{driverProfile?.assigned_zone}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Assigned Vehicle</span>
                   <span className="font-medium text-white">{driverProfile?.vehicle_number}</span>
                </div>
             </div>
          </div>

          {otherDrivers.map((driver) => {
            const firstName = driver.full_name?.split(" ")[0] ?? "Driver";
            const isOnRoute = !!driver.is_tracking;
            return (
              <div
                key={driver.id}
                className="bg-slate-900 border rounded-xl p-4 flex items-center justify-between gap-3 transition-colors duration-150 border-slate-800 hover:border-slate-700"
              >
                {/* Avatar + first name only */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border font-bold text-sm ${
                    isOnRoute
                      ? "bg-[#00A878]/20 border-[#00A878]/40 text-[#00A878]"
                      : "bg-slate-800 border-slate-700 text-slate-500"
                  }`}>
                    {firstName.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-white">{firstName}</p>
                </div>

                {/* Status badge only — no vehicle plate or zone */}
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                  isOnRoute
                    ? "bg-[#00A878]/15 text-emerald-300 border-[#00A878]/25"
                    : "bg-slate-800 text-slate-500 border-slate-700"
                }`}>
                  {isOnRoute ? "🟢 On Route" : "⚪ Standby"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  )
}