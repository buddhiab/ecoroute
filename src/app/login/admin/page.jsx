"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  Zap,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react"
import EcoRouteLogo from "@/components/EcoRouteLogo"

function PasswordInput({ value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder="Your admin password"
        required
        className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function Banner({ message, type }) {
  if (!message) return null
  const cfg = {
    error: { cls: "bg-red-50 border-red-200 text-red-700", Icon: AlertCircle },
    success: { cls: "bg-emerald-50 border-emerald-200 text-emerald-700", Icon: CheckCircle2 },
    info: { cls: "bg-blue-50 border-blue-200 text-blue-700", Icon: Loader2 },
  }
  const { cls, Icon } = cfg[type] ?? cfg.info
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm font-medium ${cls}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${type === "info" ? "animate-spin" : ""}`} />
      <span>{message}</span>
    </div>
  )
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus(null)

    try {
      // 1. Sign in via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) throw authError

      // 2. Check that this user has role='admin' or role='super_admin' in their metadata
      const role = authData.user?.user_metadata?.role
      if (role !== "admin" && role !== "super_admin") {
        await supabase.auth.signOut()
        throw new Error(
          "Access denied. This account does not have admin privileges."
        )
      }

      const isSuperAdmin = role === "super_admin"
      setStatus({ message: `Signed in successfully as ${isSuperAdmin ? "Super Admin" : "Admin"}. Redirecting…`, type: "success" })
      setIsLoading(false)
      router.push("/admin")
    } catch (err) {
      let msg = err.message || "Login failed. Please try again."
      if (msg.includes("Invalid login credentials"))
        msg = "Incorrect email or password. Please try again."
      setStatus({ message: msg, type: "error" })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <EcoRouteLogo size={32} className="rounded-lg shadow-sm shrink-0" />
          <span className="font-bold text-slate-800 text-sm tracking-tight">EcoRoute</span>
        </Link>
        <Link href="/register/admin" className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
          ← Register instead
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 px-7 py-6">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">
                  Admin Command Center
                </span>
              </div>
              <h1 className="text-xl font-bold text-white">Admin Sign In</h1>
              <p className="text-blue-100 text-sm mt-1">
                Enter your administrator credentials to access the Command Center.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="px-7 py-7 space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@municipality.lk"
                    required
                    className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {status && <Banner {...status} />}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
                ) : (
                  <>Sign In to Command Center <ArrowRight className="w-4 h-4" /></>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">
                  Need an admin account?
                </div>
              </div>

              <Link
                href="/register/admin"
                className="w-full h-11 border border-slate-200 text-slate-600 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm"
              >
                Register as Admin <ArrowRight className="w-4 h-4" />
              </Link>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
