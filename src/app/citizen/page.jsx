"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getContractSigner, getEcoBalance } from "@/lib/web3"
import { SCHEDULE_DATA, getNextPickup } from "@/lib/schedule"
import {
  ClipboardList,
  CheckCircle2,
  Zap,
  CalendarDays,
  ArrowRight,
  TrendingUp,
  MapPin,
  Plus,
  Clock,
  AlertCircle,
  Loader2,
  Truck,
  Navigation,
} from "lucide-react"

const WASTE_TYPE_COLOR = {
  Organic: "text-emerald-700 bg-emerald-50 border-emerald-200",
  Recyclable: "text-blue-700 bg-blue-50 border-blue-200",
  "E-Waste": "text-amber-700 bg-amber-50 border-amber-200",
}

function StatusBadge({ status }) {
  const config = {
    Pending: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="w-3 h-3" />,
    },
    "In Progress": {
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    Resolved: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
  }
  const c = config[status] ?? config.Pending
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${c.cls}`}
    >
      {c.icon}
      {status ?? "Pending"}
    </span>
  )
}

function KPICard({ label, value, sub, icon: Icon, loading, variant = "default" }) {
  const variantMap = {
    default: {
      iconBg: "bg-slate-100",
      iconColor: "text-slate-500",
      valColor: "text-slate-800",
      border: "border-slate-200",
    },
    green: {
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valColor: "text-slate-800",
      border: "border-slate-200",
      indicator: "bg-emerald-500",
    },
    blue: {
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valColor: "text-slate-800",
      border: "border-slate-200",
      indicator: "bg-blue-500",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valColor: "text-slate-800",
      border: "border-slate-200",
      indicator: "bg-amber-500",
    },
  }
  const v = variantMap[variant] ?? variantMap.default

  return (
    <div
      className={`bg-white border ${v.border} rounded-xl p-4 flex items-start gap-3.5 shadow-sm transition-shadow duration-150 hover:shadow-md`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.iconBg}`}
      >
        <Icon className={`w-4.5 h-4.5 ${v.iconColor}`} strokeWidth={2.5} style={{ width: 18, height: 18 }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-none mb-1">
          {label}
        </p>
        <p className={`text-2xl font-bold leading-none ${v.valColor}`}>
          {loading ? (
            <span className="inline-block w-14 h-6 rounded-md bg-slate-100 animate-pulse" />
          ) : (
            value
          )}
        </p>
        {sub && (
          <p className="text-xs text-slate-400 mt-1.5 font-medium leading-snug">{sub}</p>
        )}
      </div>
    </div>
  )
}

export default function CitizenDashboard() {
  const [zone, setZone] = useState(() => {
    // Pre-fill from the citizen's registered zone stored on login/register
    if (typeof window !== "undefined") {
      return localStorage.getItem("citizen_zone") || "Colombo 05"
    }
    return "Colombo 05"
  })
  const [citizenName, setCitizenName] = useState("")
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [ecoBalance, setEcoBalance] = useState("0")
  const [walletAddress, setWalletAddress] = useState(null)
  const [zoneDrivers, setZoneDrivers] = useState([])

  // Approved drivers assigned to the selected zone (first names only)
  useEffect(() => {
    let cancelled = false
    supabase
      .from("driver_profiles")
      .select("full_name")
      .eq("assigned_zone", zone)
      .eq("is_approved", true)
      .then(({ data }) => {
        if (!cancelled) setZoneDrivers((data ?? []).map((d) => d.full_name?.split(" ")[0]).filter(Boolean))
      })
    return () => { cancelled = true }
  }, [zone])

  // Load citizen name from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("citizen_name")
      if (name) setCitizenName(name)
    }
  }, [])

  // Fetch wallet balance silently
  useEffect(() => {
    const tryWallet = async () => {
      if (typeof window === "undefined" || !window.ethereum) return
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts && accounts.length > 0) {
          const { signer } = await getContractSigner()
          const addr = await signer.getAddress()
          setWalletAddress(addr)
          const bal = await getEcoBalance(addr)
          setEcoBalance(bal)
        }
      } catch {
        // Not connected
      }
    }
    tryWallet()
  }, [])

  // Fetch reports + real-time sync
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setReports([])
        setIsLoading(false)
        return
      }

      const { data } = await supabase
        .from("CitizenReports")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false })
        .limit(6)
        
      setReports(data ?? [])
      setIsLoading(false)
    }

    fetchReports()

    const channel = supabase
      .channel("dashboard-reports")
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        if (payload.table && payload.table !== "CitizenReports") return
        setReports((prev) => {
          if (payload.eventType === "INSERT") {
            const exists = prev.some((r) => r.id === payload.new.id)
            if (exists) return prev
            return [payload.new, ...prev].slice(0, 6)
          }
          if (payload.eventType === "UPDATE") {
            return prev.map((r) => (r.id === payload.new.id ? payload.new : r))
          }
          if (payload.eventType === "DELETE") {
            return prev.filter((r) => r.id !== payload.old.id)
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const totalReports = reports.length
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length
  const next = getNextPickup(SCHEDULE_DATA[zone])
  const schedule = {
    nextPickup: `${next.label}, ${next.time}`,
    type: next.type,
    driver: zoneDrivers.length ? zoneDrivers.join(", ") : "Not yet assigned",
  }
  const wasteTypeBadge = WASTE_TYPE_COLOR[schedule.type] ?? "text-slate-700 bg-slate-50 border-slate-200"

  return (
    <div className="p-5 md:p-7 space-y-7 max-w-5xl mx-auto w-full">

      {/* ── Page heading ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {citizenName ? `Welcome, ${citizenName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of your zone activity and recent reports.
          </p>
        </div>
        <Link
          href="/citizen/report"
          className="inline-flex items-center gap-1.5 bg-[#00A878] hover:bg-[#009468] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors duration-150 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Report
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          label="Your Reports"
          value={totalReports}
          sub="Submitted by you"
          icon={ClipboardList}
          variant="blue"
          loading={isLoading}
        />
        <KPICard
          label="Resolved Issues"
          value={resolvedCount}
          sub={`${totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0}% of your reports resolved`}
          icon={CheckCircle2}
          variant="green"
          loading={isLoading}
        />
        <KPICard
          label="ECO Tokens"
          value={walletAddress ? `${parseFloat(ecoBalance).toFixed(1)}` : "—"}
          sub={walletAddress ? "Earned from reports" : "Wallet not connected"}
          icon={Zap}
          variant="amber"
          loading={false}
        />
      </div>

      {/* ── Live Driver Tracking Card ── */}
      {(() => {
        const activeReport = reports.find(
          (r) => r.assigned_driver_id && r.status === "In Progress"
        );
        if (!activeReport) return null;
        return (
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-lg shadow-blue-500/20">
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-white/5 rounded-2xl" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-white font-black text-sm tracking-tight">Your Driver is On The Way!</p>
                  </div>
                  <p className="text-blue-200 text-xs">
                    Report #{activeReport.id} · {activeReport.issue_type} · {activeReport.zone}
                  </p>
                </div>
              </div>
              <Link
                href={`/track/${activeReport.id}`}
                className="shrink-0 flex items-center gap-2 bg-white text-blue-700 font-bold text-sm px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                <Navigation className="w-4 h-4" />
                Track Live
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ── Next Collection ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#00A878]" />
            <h2 className="text-base font-semibold text-slate-800">Next Collection</h2>
          </div>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="text-xs border border-slate-200 bg-white text-slate-700 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00A878]/40 transition-all cursor-pointer"
          >
            {Object.keys(SCHEDULE_DATA).map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header strip */}
          <div className="bg-[#00A878] px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                {zone}
              </span>
              <span className="text-emerald-200 text-xs">·</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${wasteTypeBadge}`}
              >
                {schedule.type} Pickup
              </span>
            </div>
            <Link
              href="/citizen/schedule"
              className="flex items-center gap-1 text-[11px] font-semibold text-white/80 hover:text-white transition-colors"
            >
              Full Schedule <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">{schedule.nextPickup}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Driver: <span className="font-semibold text-slate-700">{schedule.driver}</span></span>
              </div>
            </div>
            <Link
              href="/citizen/schedule"
              className="inline-flex items-center gap-1.5 bg-[#00A878] hover:bg-[#009468] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors duration-150 shadow-sm shrink-0"
            >
              View Schedule
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Recent Reports ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-semibold text-slate-800">Your Recent Reports</h2>
          </div>
          <Link
            href="/citizen/report"
            className="text-xs font-semibold text-[#00A878] hover:text-[#009468] flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No reports submitted yet</p>
            <p className="text-xs text-slate-400 mt-1">Help improve your neighborhood by reporting issues.</p>
            <Link
              href="/citizen/report"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-[#00A878] hover:text-[#009468] transition-colors"
            >
              Submit your first report <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {reports.map((report) => {
              const statusBorderMap = {
                Pending: "border-l-amber-400",
                "In Progress": "border-l-blue-400",
                Resolved: "border-l-emerald-400",
              };
              const border = statusBorderMap[report.status] ?? "border-l-amber-400";
              const hasDriver = !!report.assigned_driver_id;
              const CardWrapper = hasDriver ? Link : "div";
              const wrapperProps = hasDriver ? { href: `/track/${report.id}` } : {};
              return (
                <CardWrapper
                  key={report.id ?? report.created_at}
                  {...wrapperProps}
                  className={`bg-white border border-slate-200 border-l-4 ${border} rounded-xl p-4 flex flex-col gap-2.5 shadow-sm transition-shadow duration-150 hover:shadow-md ${hasDriver ? "cursor-pointer" : ""}`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                      {report.issue_type}
                    </p>
                    <StatusBadge status={report.status} />
                  </div>

                  {/* Zone */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{report.zone}</span>
                  </div>

                  {/* Description */}
                  {report.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  )}

                  {/* Track link indicator */}
                  {hasDriver && report.status === "In Progress" && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Driver assigned · Track live →
                    </div>
                  )}
                </CardWrapper>
              );
            })}
          </div>
        )}
      </section>
    </div>
  )
}