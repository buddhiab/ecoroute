"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getContractSigner, getEcoBalance } from "@/lib/web3"
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Coins,
  BookOpen,
  MapPin,
  Zap,
  Wallet,
  ChevronRight,
  Menu,
  Truck,
} from "lucide-react"

const NAV_LINKS = [
  { href: "/citizen", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/citizen/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/citizen/report", label: "Report Issue", icon: ClipboardList },
  { href: "/citizen/track", label: "Track Driver", icon: Truck },
  { href: "/rewards", label: "Rewards", icon: Coins },
  { href: "/citizen/guide", label: "Waste Guide", icon: BookOpen },
  { href: "/citizen/zones", label: "Zones", icon: MapPin },
]

export default function CitizenLayout({ children }) {
  const pathname = usePathname()

  // Supabase realtime connection indicator
  const [connectionStatus, setConnectionStatus] = useState("connecting")

  // Wallet state
  const [userAddress, setUserAddress] = useState(null)
  const [ecoBalance, setEcoBalance] = useState("0")
  const [walletLoading, setWalletLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Monitor Supabase realtime connection
  useEffect(() => {
    const channel = supabase
      .channel("citizen-layout-heartbeat")
      .on("system", {}, (payload) => {
        if (payload.extension === "presence" || payload.event === "phx_reply") {
          setConnectionStatus("connected")
        }
      })
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

  // Auto-connect wallet if previously connected
  useEffect(() => {
    const tryAutoConnect = async () => {
      if (typeof window === "undefined" || !window.ethereum) return
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts && accounts.length > 0) {
          const { signer } = await getContractSigner()
          const address = await signer.getAddress()
          setUserAddress(address)
          const balance = await getEcoBalance(address)
          setEcoBalance(balance)
        }
      } catch {
        // Silent fail — user hasn't connected yet
      }
    }
    tryAutoConnect()
  }, [])

  const connectWallet = async () => {
    setWalletLoading(true)
    try {
      const { signer } = await getContractSigner()
      const address = await signer.getAddress()
      setUserAddress(address)
      const balance = await getEcoBalance(address)
      setEcoBalance(balance)
    } catch (err) {
      console.error("Wallet connection failed:", err)
      alert("Failed to connect wallet. Please ensure MetaMask is unlocked.")
    } finally {
      setWalletLoading(false)
    }
  }

  const isActive = (link) => {
    if (link.exact) return pathname === link.href
    return pathname.startsWith(link.href)
  }

  const connectionIndicator = {
    connected: { color: "bg-emerald-400", label: "Live", pulse: true },
    connecting: { color: "bg-amber-400", label: "Connecting", pulse: true },
    error: { color: "bg-red-500", label: "Offline", pulse: false },
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
          w-60 bg-slate-900 text-white shrink-0
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/50">
          <div className="w-8 h-8 rounded-lg bg-[#00A878] flex items-center justify-center shadow-md shadow-emerald-900/30 shrink-0">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm leading-none tracking-tight">EcoRoute</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Citizen Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] px-3 mb-2.5">
            Navigation
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
                          ? "bg-[#00A878]/15 text-[#00A878]"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }
                    `}
                  >
                    {/* Active left bar */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#00A878] rounded-r-full" />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? "text-[#00A878]" : "text-slate-500 group-hover:text-slate-300"
                      }`}
                      strokeWidth={active ? 2.5 : 2}
                    />
                    <span className="flex-1">{link.label}</span>
                    {active && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#00A878]" strokeWidth={2.5} />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar footer — connection status */}
        <div className="px-4 py-3.5 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${connectionIndicator.color} ${
                connectionIndicator.pulse ? "animate-pulse" : ""
              } shrink-0`}
            />
            <span className="text-[11px] text-slate-500 font-medium">
              Realtime · {connectionIndicator.label}
            </span>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── TOP HEADER ── */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-5 py-0 flex items-center justify-between gap-4 z-10 h-14">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page breadcrumb */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-slate-400 font-medium hidden sm:block">Citizen Portal</span>
            <ChevronRight className="w-3 h-3 text-slate-300 hidden sm:block" />
            <span className="text-sm font-semibold text-slate-800 truncate">{currentPageLabel}</span>
          </div>

          {/* Right — connection dot + wallet */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${connectionIndicator.color} ${
                  connectionIndicator.pulse ? "animate-pulse" : ""
                }`}
              />
              <span className="text-[11px] font-semibold text-slate-500">
                {connectionIndicator.label}
              </span>
            </div>

            {/* Wallet widget */}
            {userAddress ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                  {`${userAddress.slice(0, 5)}…${userAddress.slice(-3)}`}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 border-l border-emerald-200 pl-1.5">
                  <Zap className="w-3 h-3" />
                  {parseFloat(ecoBalance).toFixed(1)} ECO
                </span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={walletLoading}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold rounded-full px-3 py-1.5 transition-colors duration-150 disabled:opacity-60"
              >
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                {walletLoading ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
