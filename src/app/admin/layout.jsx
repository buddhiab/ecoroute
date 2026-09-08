"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  FlaskConical,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Menu,
} from "lucide-react"

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/fleet", label: "Fleet Monitor", icon: Truck },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList },
  { href: "/admin/sqa", label: "SQA Telemetry", icon: FlaskConical },
  { href: "/admin/payouts", label: "Payouts", icon: Landmark },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [lastRefresh, setLastRefresh] = useState(null)

  // Supabase realtime heartbeat
  useEffect(() => {
    const channel = supabase
      .channel("admin-layout-heartbeat")
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
          setLastRefresh(new Date())
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("error")
        } else {
          setConnectionStatus("connecting")
        }
      })
    return () => supabase.removeChannel(channel)
  }, [])

  const isActive = (link) => {
    if (link.exact) return pathname === link.href
    return pathname.startsWith(link.href)
  }

  const dot = {
    connected: { color: "bg-emerald-400", label: "Live" },
    connecting: { color: "bg-amber-400", label: "Connecting" },
    error: { color: "bg-red-500", label: "Disconnected" },
  }[connectionStatus]

  const currentPageLabel = NAV_LINKS.find((l) => isActive(l))?.label ?? "Dashboard"

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30 flex flex-col
          w-60 bg-white border-r border-slate-200 shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm leading-none tracking-tight">EcoRoute</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Command Center</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] px-3 mb-2.5">
            Admin Panels
          </p>
          <ul className="space-y-0.5">
            {NAV_LINKS.map((link) => {
              const active = isActive(link)
              const Icon = link.icon
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                      transition-all duration-150 group relative
                      ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }
                    `}
                  >
                    {/* Active left accent bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#2563EB] rounded-r-full" />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span className="flex-1">{link.label}</span>
                    {active && (
                      <ChevronRight className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-3.5 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${dot.color} ${
                connectionStatus !== "error" ? "animate-pulse" : ""
              } shrink-0`}
            />
            <span className="text-[11px] text-slate-400 font-medium">
              Realtime · {dot.label}
            </span>
          </div>
          {lastRefresh && (
            <p className="text-[10px] text-slate-300 pl-3.5">
              Last sync {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── HEADER ── */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-5 py-0 flex items-center justify-between gap-4 z-10 h-14">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-slate-400 font-medium hidden sm:block">Admin</span>
            <ChevronRight className="w-3 h-3 text-slate-300 hidden sm:block" />
            <span className="text-sm font-semibold text-slate-800 truncate">{currentPageLabel}</span>
          </div>

          {/* Right — connection + admin badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${dot.color} ${
                  connectionStatus !== "error" ? "animate-pulse" : ""
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-500">{dot.label}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] font-bold text-blue-700">Admin</span>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  )
}
