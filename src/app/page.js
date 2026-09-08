import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, Truck, Home, ArrowRight, Zap } from "lucide-react"

export const metadata = {
  title: "EcoRoute — Smart Waste Management Platform",
  description:
    "EcoRoute is a smart, blockchain-verified waste management and routing platform. Select your portal to get started.",
}

const PORTALS = [
  {
    href: "/admin",
    label: "Admin",
    sublabel: "Command Center",
    description:
      "Assign daily routes, monitor driver progress in real-time, and analyze SQA usability metrics.",
    cta: "Enter Dashboard",
    icon: ShieldCheck,
    iconBg: "bg-blue-600",
    iconShadow: "shadow-blue-200",
    btnClass:
      "w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-150",
    border: "border-blue-100",
    accentBar: "bg-blue-600",
    labelColor: "text-blue-600",
  },
  {
    href: "/driver",
    label: "Driver",
    sublabel: "Field Operations",
    description:
      "View assigned streets, log offline waste collections, and report blocked roads via large card layouts.",
    cta: "Open Driver App",
    icon: Truck,
    iconBg: "bg-emerald-600",
    iconShadow: "shadow-emerald-200",
    btnClass:
      "w-full h-11 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-150",
    border: "border-emerald-100",
    accentBar: "bg-emerald-500",
    labelColor: "text-emerald-600",
    badge: "PWA",
  },
  {
    href: "/citizen",
    label: "Citizen",
    sublabel: "Public Service Portal",
    description:
      "Check neighborhood schedules, view Web3 verifiable proofs, and report missing pickups.",
    cta: "Access Portal",
    icon: Home,
    iconBg: "bg-slate-700",
    iconShadow: "shadow-slate-200",
    btnClass:
      "w-full h-11 font-semibold border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all duration-150",
    border: "border-slate-100",
    accentBar: "bg-slate-400",
    labelColor: "text-slate-600",
  },
]

export default function EcoRouteHub() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* ── Top bar ── */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00A878] flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-tight">EcoRoute</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">Smart Waste Management Platform</span>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">System Online</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 leading-tight">
            <span className="text-[#00A878]">Eco</span>Route
          </h1>
          <p className="text-base text-slate-500 leading-relaxed">
            Smart, blockchain-verified waste management and routing. Select your role to access the platform.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-800">24</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Active Routes Today</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#00A878]">1,204</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Completed Pickups</p>
          </div>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {PORTALS.map((portal) => {
            const Icon = portal.icon
            return (
              <Card
                key={portal.href}
                className={`bg-white border ${portal.border} shadow-sm overflow-hidden flex flex-col relative transition-shadow duration-150 hover:shadow-md`}
              >
                {/* Accent top bar */}
                <div className={`h-1 w-full ${portal.accentBar}`} />

                {/* PWA badge */}
                {portal.badge && (
                  <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {portal.badge}
                  </span>
                )}

                <CardContent className="pt-5 pb-6 px-5 flex flex-col gap-5 flex-1">
                  {/* Icon + title */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl ${portal.iconBg} flex items-center justify-center shrink-0 shadow-md ${portal.iconShadow}`}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{portal.label}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${portal.labelColor}`}>
                        {portal.sublabel}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{portal.description}</p>

                  {/* CTA */}
                  <Link href={portal.href} className="block">
                    <button
                      className={`${portal.btnClass} rounded-xl flex items-center justify-center gap-2 cursor-pointer`}
                    >
                      {portal.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* ── New user link ── */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            New to EcoRoute?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#00A878] hover:text-[#009468] transition-colors"
            >
              Create an account →
            </Link>
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        EcoRoute · Smart Waste Management · Built with Next.js &amp; Supabase
      </footer>
    </div>
  )
}