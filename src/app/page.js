import Link from "next/link"
import {
  ShieldCheck,
  Truck,
  Home,
  ArrowRight,
  MapPin,
  Cpu,
  Globe,
  Activity,
  CheckCircle2,
  Coins,
} from "lucide-react"
import EcoRouteLogo from "@/components/EcoRouteLogo"

export const metadata = {
  title: "EcoRoute — Smart Waste Management Platform",
  description:
    "EcoRoute is a blockchain-verified, AI-optimised smart waste management and routing platform. Real-time fleet tracking, citizen reporting, and Web3 incentives.",
}

// ── Live stats fetched server-side with ISR ───────────────────────────────────
async function getLiveStats() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes("placeholder")) {
    return { routeCount: 0, pickupCount: 0, driverCount: 0 }
  }

  try {
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    }

    const [routeRes, pickupRes, driverRes] = await Promise.all([
      fetch(`${url}/rest/v1/Routes?select=id&status=eq.In Progress`, {
        headers,
        next: { revalidate: 60 },
      }),
      fetch(`${url}/rest/v1/CitizenReports?select=id&status=eq.Resolved`, {
        headers,
        next: { revalidate: 60 },
      }),
      fetch(`${url}/rest/v1/Drivers?select=id`, {
        headers,
        next: { revalidate: 300 },
      }),
    ])

    const parseCount = (res) => {
      const range = res.headers.get("content-range") // e.g. "0-0/42"
      if (!range) return 0
      const total = parseInt(range.split("/")[1], 10)
      return isNaN(total) ? 0 : total
    }

    return {
      routeCount: parseCount(routeRes),
      pickupCount: parseCount(pickupRes),
      driverCount: parseCount(driverRes),
    }
  } catch {
    return { routeCount: 0, pickupCount: 0, driverCount: 0 }
  }
}

// ── Portal cards ──────────────────────────────────────────────────────────────
const PORTALS = [
  {
    href: "/admin",
    label: "Admin",
    sublabel: "Command Center",
    description:
      "Assign daily routes, monitor driver progress in real-time, review SQA telemetry, and manage the entire fleet from one dashboard.",
    cta: "Enter Dashboard",
    icon: ShieldCheck,
    gradient: "from-blue-600 to-blue-700",
    glow: "hover:shadow-blue-500/25",
    border: "border-blue-500/20",
    badge: null,
    iconRing: "ring-blue-400/30",
    ctaClass: "bg-blue-600 hover:bg-blue-500 text-white",
    accentClass: "text-blue-400",
  },
  {
    href: "/driver",
    label: "Driver",
    sublabel: "Field Operations",
    description:
      "View assigned streets, log offline waste collections, and report blocked roads — all via a PWA optimised for on-the-go use.",
    cta: "Open Driver App",
    icon: Truck,
    gradient: "from-emerald-600 to-teal-600",
    glow: "hover:shadow-emerald-500/25",
    border: "border-emerald-500/20",
    badge: "PWA",
    iconRing: "ring-emerald-400/30",
    ctaClass: "bg-emerald-600 hover:bg-emerald-500 text-white",
    accentClass: "text-emerald-400",
  },
  {
    href: "/citizen",
    label: "Citizen",
    sublabel: "Public Service Portal",
    description:
      "Check neighbourhood schedules, earn ECO tokens for verified reports, and view blockchain-backed proof of every pickup.",
    cta: "Access Portal",
    icon: Home,
    gradient: "from-violet-600 to-purple-700",
    glow: "hover:shadow-violet-500/25",
    border: "border-violet-500/20",
    badge: "Web3",
    iconRing: "ring-violet-400/30",
    ctaClass: "bg-violet-600 hover:bg-violet-500 text-white",
    accentClass: "text-violet-400",
  },
]

// ── Feature highlights ────────────────────────────────────────────────────────
const FEATURES = [
  { icon: MapPin,       label: "Live Route Tracking",  desc: "Google Maps real-time GPS" },
  { icon: Coins,        label: "ECO Token Rewards",     desc: "ERC-20 on Sepolia testnet" },
  { icon: Activity,     label: "SQA Telemetry",         desc: "HCI usability metrics" },
  { icon: Globe,        label: "Offline-First PWA",     desc: "IndexedDB sync when back online" },
  { icon: Cpu,          label: "Blockchain Verified",   desc: "Immutable pickup proofs" },
  { icon: CheckCircle2, label: "Web Push Alerts",       desc: "VAPID-powered notifications" },
]

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, color = "text-emerald-400" }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm min-w-[130px]">
      <span className={`text-3xl font-extrabold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs font-medium text-slate-400 text-center leading-tight">{label}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function EcoRouteHub() {
  const { routeCount, pickupCount, driverCount } = await getLiveStats()

  return (
    <div className="min-h-screen bg-[#080E17] text-white font-sans flex flex-col">

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-[#080E17]/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <EcoRouteLogo size={32} className="rounded-xl shadow-lg shadow-emerald-500/30" />
            <span className="font-bold text-white text-sm tracking-tight">EcoRoute</span>
          </div>
          <span className="hidden md:block text-xs text-slate-600 font-medium">v1.0 · Sepolia Testnet</span>
          <Link
            href="/register"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors border border-emerald-500/30 hover:border-emerald-400/50 px-3.5 py-1.5 rounded-full"
          >
            Register →
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden pt-24 pb-20 px-6">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl" />
            <div className="absolute top-20 right-0 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wide">System Online · Live</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Smart Waste
              </span>
              <br />
              <span className="text-white">Management</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-12">
              Blockchain-verified routing, real-time fleet tracking, and Web3 citizen incentives —
              all in one unified platform built for modern municipalities.
            </p>

            {/* Live stats */}
            <div className="flex flex-wrap justify-center gap-4 mb-14">
              <StatCard
                value={routeCount > 0 ? routeCount : "—"}
                label="Active Routes Today"
                color="text-emerald-400"
              />
              <StatCard
                value={pickupCount > 0 ? pickupCount.toLocaleString() : "—"}
                label="Completed Pickups"
                color="text-teal-400"
              />
              <StatCard
                value={driverCount > 0 ? driverCount : "—"}
                label="Registered Drivers"
                color="text-cyan-400"
              />
            </div>

            {/* Tech badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {["Next.js 16", "Supabase", "Ethers.js v6", "Sepolia", "Google Maps", "PWA"].map((t) => (
                <span
                  key={t}
                  className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── PORTAL CARDS ── */}
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-8">
              Choose Your Portal
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PORTALS.map((portal) => {
                const Icon = portal.icon
                return (
                  <div
                    key={portal.href}
                    className={`group relative rounded-2xl bg-white/[0.03] border ${portal.border} p-6 flex flex-col gap-5 hover:bg-white/[0.06] transition-all duration-300 hover:shadow-xl ${portal.glow}`}
                  >
                    {portal.badge && (
                      <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-300">
                        {portal.badge}
                      </span>
                    )}

                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${portal.gradient} flex items-center justify-center shadow-lg ring-4 ${portal.iconRing}`}
                    >
                      <Icon className="w-6 h-6 text-white" strokeWidth={1.75} />
                    </div>

                    <div>
                      <p className="font-bold text-white text-lg leading-tight">{portal.label}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${portal.accentClass}`}>
                        {portal.sublabel}
                      </p>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed flex-1">
                      {portal.description}
                    </p>

                    <Link
                      href={portal.href}
                      className={`flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold transition-all duration-200 ${portal.ctaClass}`}
                    >
                      {portal.cta}
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-slate-500 mt-8">
              New to EcoRoute?{" "}
              <Link
                href="/register"
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Create an account →
              </Link>
            </p>
          </div>
        </section>

        {/* ── FEATURE GRID ── */}
        <section className="px-6 pb-24 border-t border-white/[0.05] pt-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-10">
              Platform Capabilities
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <EcoRouteLogo size={20} className="rounded-md" />
            <span className="text-xs font-medium text-slate-500">EcoRoute · Smart Waste Management</span>
          </div>
          <span className="text-xs text-slate-600">Built with Next.js 16 · Supabase · Sepolia Blockchain</span>
        </div>
      </footer>

    </div>
  )
}