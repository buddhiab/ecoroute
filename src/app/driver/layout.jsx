"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  Truck,
  ClipboardList,
  WifiOff,
  Radio,
  Zap,
  ChevronRight,
  Signal,
  AlertTriangle,
  User,
  Menu,
  LogOut,
  Clock,
  Sun,
  Moon,
} from "lucide-react"

const NAV_LINKS = [
  { href: "/driver", label: "Live Route Board", icon: Radio, exact: true },
  { href: "/driver/tasks", label: "Active Tasks", icon: ClipboardList },
  { href: "/driver/sync", label: "Offline Sync Status", icon: WifiOff },
  { href: "/driver/dispatch", label: "Fleet Dispatch", icon: Truck },
]


export default function DriverLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [pendingQueueCount, setPendingQueueCount] = useState(0)
  const [driverProfile, setDriverProfile] = useState(null)
  const [isApproved, setIsApproved] = useState(null) // null = loading, true/false = known
  const [activeTaskCount, setActiveTaskCount] = useState(0)
  const [theme, setTheme] = useState("dark")

  useEffect(() => {
    try {
      const saved = localStorage.getItem("driver_theme")
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "light" || saved === "dark") setTheme(saved)
    } catch {}
  }, [])

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    try {
      localStorage.setItem("driver_theme", next)
    } catch {}
  }

  // Badge: number of unresolved tasks assigned to this driver
  useEffect(() => {
    const driverId = driverProfile?.id
    if (!driverId) return
    const loadCount = async () => {
      const { count } = await supabase
        .from("CitizenReports")
        .select("*", { count: "exact", head: true })
        .eq("assigned_driver_id", driverId)
        .neq("status", "Resolved")
      setActiveTaskCount(count ?? 0)
    }
    loadCount()
    const channel = supabase
      .channel(`driver-task-count-${driverId}-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "CitizenReports", filter: `assigned_driver_id=eq.${driverId}` },
        loadCount
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [driverProfile?.id])

  useEffect(() => {
    let channel;
    async function loadDriverData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        // No active session — middleware should have redirected, but guard here too
        if (!user) return;

        const { data: driverData } = await supabase
          .from("driver_profiles")
          .select("id, full_name, vehicle_number, assigned_zone, is_approved, is_tracking")
          .eq("user_id", user.id)
          .single()

        if (!driverData) { setIsApproved(false); return; }

        // Guard: unapproved drivers see a friendly waiting screen
        if (!driverData.is_approved) { setIsApproved(false); return; }

        setIsApproved(true);
        setDriverProfile(driverData);

        if (driverData.id) {
          channel = supabase
            .channel(`driver-layout-updates-${driverData.id}-${Math.random()}`)
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
      } catch (err) {
        console.warn("Driver layout load error:", err);
      }
    }
    loadDriverData()

    return () => {
      if (channel) supabase.removeChannel(channel);
    }
  }, [])

  // Network status listeners
  useEffect(() => {
    if (typeof window === "undefined") return
    setIsOffline(!navigator.onLine)
    const onOffline = () => setIsOffline(true)
    const onOnline = () => setIsOffline(false)
    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)
    return () => {
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [])

  // Register service worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) =>
        console.error("SW registration failed:", err)
      )
    }
  }, [])

  // Supabase realtime heartbeat
  useEffect(() => {
    const channel = supabase
      .channel("driver-layout-heartbeat")
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setConnectionStatus("connected")
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setConnectionStatus("error")
        else setConnectionStatus("connecting")
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Read offline queue count from IndexedDB
  useEffect(() => {
    const readQueueCount = async () => {
      if (typeof window === "undefined" || !("indexedDB" in window)) return
      try {
        const req = indexedDB.open("EcoRouteDB", 1)
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains("syncQueue")) return
          const tx = db.transaction("syncQueue", "readonly")
          const countReq = tx.objectStore("syncQueue").count()
          countReq.onsuccess = () => setPendingQueueCount(countReq.result)
        }
        req.onupgradeneeded = (e) => {
          e.target.result.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          })
        }
      } catch {
        // IndexedDB unavailable (SSR, private mode, etc.)
      }
    }
    readQueueCount()
    const interval = setInterval(readQueueCount, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login/driver")
  }

  const isActive = (link) => {
    if (link.exact) return pathname === link.href
    return pathname.startsWith(link.href)
  }

  const connectionDot = {
    connected: { color: "bg-emerald-400", label: "Live" },
    connecting: { color: "bg-amber-400", label: "Connecting" },
    error: { color: "bg-red-500", label: "Offline" },
  }[connectionStatus]

  const currentPageLabel = NAV_LINKS.find((l) => isActive(l))?.label ?? "Dashboard"

  // ── Pending approval screen
  if (isApproved === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center max-w-sm px-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-white font-bold text-xl mb-2">Account Pending Approval</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your driver account has been registered and is awaiting admin approval.
            You'll be able to access the terminal once approved.
          </p>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-500 hover:text-red-400 flex items-center gap-2 mx-auto transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div data-driver-theme={theme} className="flex h-screen bg-slate-950 font-sans overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 flex flex-col
          w-60 bg-slate-900 border-r border-slate-800 shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-[#00A878] flex items-center justify-center shadow-md shadow-emerald-900/40 shrink-0">
            <Truck className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-none tracking-tight">EcoRoute</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Driver Terminal</p>
          </div>
        </div>

        {/* Offline banner in sidebar */}
        {isOffline && (
          <div className="mx-3 mt-3 flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-lg px-3 py-2">
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" strokeWidth={2.5} />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Offline Mode</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.12em] px-3 mb-2.5">
            Terminal
          </p>
          <ul className="space-y-0.5">
            {NAV_LINKS.map((link) => {
              const active = isActive(link)
              const Icon = link.icon
              const isSyncBadge = link.href === "/driver/sync" && pendingQueueCount > 0
              const isTaskBadge = link.href === "/driver/tasks" && activeTaskCount > 0
              const showBadge = isSyncBadge || isTaskBadge
              const badgeCount = isSyncBadge ? pendingQueueCount : activeTaskCount
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-150 group relative
                      ${
                        active
                          ? "bg-[#00A878]/15 text-[#00A878]"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }
                    `}
                  >
                    {/* Active left accent bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00A878] rounded-r-full" />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? "text-[#00A878]" : "text-slate-600 group-hover:text-slate-300"
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span className="flex-1">{link.label}</span>
                    {showBadge && (
                      <span className={`flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 ${isTaskBadge ? "bg-[#00A878]" : "bg-amber-500"}`}>
                        {badgeCount}
                      </span>
                    )}
                    {active && !showBadge && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#00A878]" strokeWidth={2.5} />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Left Profile Widget */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-500 font-bold shrink-0">
              {driverProfile?.full_name?.charAt(0) || "D"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {driverProfile?.full_name || "Driver"}
              </p>
              <p className="text-xs text-slate-500 truncate">Zone: {driverProfile?.assigned_zone || "Pending"}</p>
            </div>
          </div>
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full mt-3 flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── TOP HEADER ── */}
        <header className="shrink-0 bg-slate-900 border-b border-slate-800 px-5 py-0 flex items-center justify-between gap-4 z-10 h-14">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-slate-600 font-medium hidden sm:block">Driver Terminal</span>
            <ChevronRight className="w-3 h-3 text-slate-700 hidden sm:block" />
            <span className="text-sm font-semibold text-slate-300 truncate">{currentPageLabel}</span>
          </div>

          {/* Right — operator badge + network status */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sunlight / dark theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to sunlight mode"}
              title={theme === "light" ? "Dark mode" : "Sunlight mode"}
              className="p-2 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {/* Network indicator */}
            {isOffline ? (
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full px-2.5 py-1">
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">OFFLINE</span>
                {pendingQueueCount > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingQueueCount}
                  </span>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full px-2.5 py-1">
                <Signal className="w-3.5 h-3.5 text-[#00A878]" />
                <span className="text-xs font-semibold text-slate-400">{connectionDot.label}</span>
              </div>
            )}

            {/* Operator status badge */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-1">
              <div className="w-5 h-5 rounded-full bg-[#00A878]/20 flex items-center justify-center shrink-0">
                <User className="w-3 h-3 text-[#00A878]" />
              </div>
              <span className="text-xs font-semibold text-slate-300 hidden sm:block max-w-[100px] truncate">
                {driverProfile?.vehicle_number || "Awaiting Fleet"}
              </span>
              <span className="text-xs text-slate-500 hidden md:block">
                {driverProfile?.assigned_zone || "No Zone"}
              </span>
              <Zap className={`w-3 h-3 ${driverProfile?.is_tracking ? "text-[#00A878]" : "text-slate-500"}`} />
              <span className={`text-xs font-bold ${driverProfile?.is_tracking ? "text-[#00A878]" : "text-slate-500"}`}>
                {driverProfile?.is_tracking ? "ON ROUTE" : "STANDBY"}
              </span>
            </div>
          </div>
        </header>

        {/* Offline full-width banner */}
        {isOffline && (
          <div className="shrink-0 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Offline Mode Active — Actions will sync automatically when connection is restored
          </div>
        )}

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  )
}
