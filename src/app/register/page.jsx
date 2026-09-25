import Link from "next/link"
import { ShieldCheck, Truck, Home, ArrowRight, Zap, UserPlus } from "lucide-react"
import EcoRouteLogo from "@/components/EcoRouteLogo"

export const metadata = {
  title: "Register — EcoRoute",
  description: "Create your EcoRoute account. Choose your role to get started.",
}

const ROLES = [
  {
    href: "/register/citizen",
    loginHref: "/login/citizen",
    label: "Citizen",
    sublabel: "Public Service Portal",
    description:
      "Register to track your zone's pickup schedule, report issues, and earn ECO token rewards.",
    cta: "Register as Citizen",
    icon: Home,
    iconBg: "bg-[#00A878]",
    accentBar: "bg-[#00A878]",
    labelColor: "text-[#00A878]",
    border: "border-emerald-100",
    btnClass:
      "w-full h-11 font-semibold bg-[#00A878] hover:bg-[#009468] text-white shadow-sm transition-all duration-150",
  },
  {
    href: "/register/driver",
    loginHref: "/login/driver",
    label: "Driver",
    sublabel: "Field Operations",
    description:
      "Register your vehicle and license to access assigned routes, offline collections, and dispatch.",
    cta: "Register as Driver",
    icon: Truck,
    iconBg: "bg-emerald-700",
    accentBar: "bg-emerald-700",
    labelColor: "text-emerald-700",
    border: "border-emerald-100",
    btnClass:
      "w-full h-11 font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all duration-150",
    badge: "PWA",
  },
  {
    href: "/register/admin",
    loginHref: "/login/admin",
    label: "Admin",
    sublabel: "Command Center",
    description:
      "Register with an admin access code to manage routes, drivers, reports, and payouts.",
    cta: "Register as Admin",
    icon: ShieldCheck,
    iconBg: "bg-blue-600",
    accentBar: "bg-blue-600",
    labelColor: "text-blue-600",
    border: "border-blue-100",
    btnClass:
      "w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-150",
  },
]

export default function RegisterHub() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Top bar */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <EcoRouteLogo size={32} className="rounded-lg shadow-sm shrink-0" />
          <span className="font-bold text-slate-800 text-sm tracking-tight">EcoRoute</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Back to portal
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 mb-5">
            <UserPlus className="w-3.5 h-3.5 text-[#00A878]" />
            <span className="text-xs font-semibold text-emerald-700">Create Account</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3 leading-tight">
            Who are you registering as?
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Select your role below. Each role has its own registration flow tailored to your access needs.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {ROLES.map((role) => {
            const Icon = role.icon
            return (
              <div
                key={role.href}
                className={`bg-white border ${role.border} rounded-2xl shadow-sm overflow-hidden flex flex-col relative transition-shadow duration-150 hover:shadow-md`}
              >
                {/* Accent top bar */}
                <div className={`h-1 w-full ${role.accentBar}`} />

                {/* PWA badge */}
                {role.badge && (
                  <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {role.badge}
                  </span>
                )}

                <div className="pt-5 pb-6 px-5 flex flex-col gap-5 flex-1">
                  {/* Icon + title */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl ${role.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{role.label}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${role.labelColor}`}>
                        {role.sublabel}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{role.description}</p>

                  {/* CTA */}
                  <Link href={role.href} className="block">
                    <button
                      className={`${role.btnClass} rounded-xl flex items-center justify-center gap-2 cursor-pointer w-full`}
                    >
                      {role.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>

                  {/* Login link — only shown for roles that have a login page */}
                  {role.loginHref && (
                    <p className="text-center text-xs text-slate-400 mt-1">
                      Already registered?{" "}
                      <Link href={role.loginHref} className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
                        Log in →
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Sign in link */}
        <p className="text-sm text-slate-400 mt-10">
          Already have an account?{" "}
          <Link href="/" className="font-semibold text-[#00A878] hover:text-[#009468] transition-colors">
            Go to your portal →
          </Link>
        </p>
      </main>

      {/* Footer */}
      <footer className="shrink-0 py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        EcoRoute · Smart Waste Management · Built with Next.js &amp; Supabase
      </footer>
    </div>
  )
}
