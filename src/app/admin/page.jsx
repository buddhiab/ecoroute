"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  ClipboardList,
  CheckCircle2,
  FlaskConical,
  Timer,
  ArrowRight,
  RefreshCw,
  Loader2,
  TrendingUp,
  MapPin,
  Truck,
  Landmark,
} from "lucide-react"

// ── KPI Card — semantic, not decorative colours ──────────────────────────────
function KPICard({ label, value, accent, icon: Icon, loading, sub }) {
  const variantMap = {
    // Blue: informational metrics (counts, data)
    blue: {
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      valColor: "text-slate-800",
    },
    // Green: success / resolution / positive outcomes
    green: {
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valColor: "text-slate-800",
    },
    // Slate: neutral telemetry / system data
    slate: {
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      valColor: "text-slate-800",
    },
  }
  const v = variantMap[accent] ?? variantMap.slate

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm transition-shadow duration-150 hover:shadow-md">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.iconBg}`}
      >
        <Icon className={`w-5 h-5 ${v.iconColor}`} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-none mb-1">
          {label}
        </p>
        <p className={`text-2xl font-bold leading-none ${v.valColor}`}>
          {loading ? (
            <span className="inline-block w-14 h-6 bg-slate-100 rounded-md animate-pulse" />
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

// ── Bar chart row ─────────────────────────────────────────────────────────────
function BarRow({ label, count, total, colorClass }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[13px] font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">{pct}%</span>
          <span className="text-[13px] font-bold text-slate-800">{count}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Quick Access definition — Lucide icons instead of emoji ──────────────────
const QUICK_ACCESS = [
  {
    href: "/admin/fleet",
    label: "Fleet Monitor",
    desc: "Live route statuses",
    icon: Truck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-300",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    desc: "All citizen submissions",
    icon: ClipboardList,
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    hoverBorder: "hover:border-slate-400",
  },
  {
    href: "/admin/sqa",
    label: "SQA Telemetry",
    desc: "HCI usability metrics",
    icon: FlaskConical,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-300",
  },
  {
    href: "/admin/payouts",
    label: "Payouts",
    desc: "Bank transfer requests",
    icon: Landmark,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-300",
  },
]

export default function AdminDashboard() {
  const [reports, setReports] = useState([])
  const [hciLogs, setHciLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: reportData }, { data: hciData }] = await Promise.all([
      supabase.from("CitizenReports").select("*").order("id", { ascending: false }),
      supabase.from("HCILogs").select("*").order("id", { ascending: false }),
    ])
    if (reportData) setReports(reportData)
    if (hciData) setHciLogs(hciData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchData])

  // Computed KPIs
  const totalReports = reports.length
  const resolvedReports = reports.filter((r) => r.status === "Resolved").length
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0
  const totalTime = hciLogs.reduce((acc, l) => acc + (l.time_taken || 0), 0)
  const avgTimeSeconds = hciLogs.length > 0 ? Math.round(totalTime / hciLogs.length / 1000) : 0

  // Breakdowns
  const issueTypes = reports.reduce((acc, r) => {
    acc[r.issue_type] = (acc[r.issue_type] || 0) + 1
    return acc
  }, {})
  const zoneBreakdown = reports.reduce((acc, r) => {
    acc[r.zone] = (acc[r.zone] || 0) + 1
    return acc
  }, {})
  const maxIssue = Math.max(...Object.values(issueTypes), 1)
  const maxZone = Math.max(...Object.values(zoneBreakdown), 1)

  // Semantic bar colours: blue for issue categories, green for zone activity
  const ISSUE_COLORS = ["bg-blue-500", "bg-blue-400", "bg-blue-600", "bg-sky-500"]
  const ZONE_COLORS = ["bg-emerald-500", "bg-emerald-400", "bg-teal-500", "bg-emerald-600"]

  return (
    <div className="p-5 md:p-7 space-y-7 max-w-6xl mx-auto w-full">

      {/* ── Heading ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Command Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            System-wide overview — live data from all portals.
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={loading}
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold h-9 px-4 text-sm shadow-sm transition-all duration-150"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </span>
          )}
        </Button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Reports"
          value={totalReports}
          accent="blue"
          icon={ClipboardList}
          loading={loading}
          sub="All citizen submissions"
        />
        <KPICard
          label="Resolution Rate"
          value={`${resolutionRate}%`}
          accent="green"
          icon={CheckCircle2}
          loading={loading}
          sub={`${resolvedReports} of ${totalReports} resolved`}
        />
        <KPICard
          label="HCI Logged Actions"
          value={hciLogs.length}
          accent="slate"
          icon={FlaskConical}
          loading={loading}
          sub="Total telemetry events"
        />
        <KPICard
          label="Avg Task Completion"
          value={`${avgTimeSeconds}s`}
          accent="blue"
          icon={Timer}
          loading={loading}
          sub="Across all HCI logs"
        />
      </div>

      {/* ── Breakdown charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Issues by category */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-800">Issues by Category</h2>
              </div>
              <p className="text-xs text-slate-400">Breakdown of reported civic problems</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-5 py-4 space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
              ))
            ) : Object.keys(issueTypes).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400 font-medium">No data available yet.</p>
              </div>
            ) : (
              Object.entries(issueTypes).map(([type, count], i) => (
                <BarRow
                  key={type}
                  label={type}
                  count={count}
                  total={maxIssue}
                  colorClass={ISSUE_COLORS[i % ISSUE_COLORS.length]}
                />
              ))
            )}
          </div>
        </div>

        {/* Reports by zone */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-800">Reports by Zone</h2>
              </div>
              <p className="text-xs text-slate-400">Geographic concentration of active issues</p>
            </div>
            <Link
              href="/admin/fleet"
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              Fleet view <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-5 py-4 space-y-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
              ))
            ) : Object.keys(zoneBreakdown).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400 font-medium">No zone data available yet.</p>
              </div>
            ) : (
              Object.entries(zoneBreakdown).map(([zone, count], i) => (
                <BarRow
                  key={zone}
                  label={zone}
                  count={count}
                  total={maxZone}
                  colorClass={ZONE_COLORS[i % ZONE_COLORS.length]}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Access ── */}
      <section>
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_ACCESS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group bg-white border border-slate-200 ${item.hoverBorder} rounded-xl p-4 transition-all duration-150 hover:shadow-md flex flex-col gap-3`}
              >
                <div
                  className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center`}
                >
                  <Icon className={`w-4.5 h-4.5 ${item.iconColor}`} style={{ width: 18, height: 18 }} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors leading-tight">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}