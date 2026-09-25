"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  Zap,
  Home,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  KeyRound,
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
        placeholder="Your password"
        required
        className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function Banner({ message, type }) {
  if (!message) return null
  const cfg = {
    error:   { cls: "bg-red-50 border-red-200 text-red-700",           Icon: AlertCircle },
    success: { cls: "bg-emerald-50 border-emerald-200 text-emerald-700", Icon: CheckCircle2 },
    info:    { cls: "bg-blue-50 border-blue-200 text-blue-700",         Icon: Loader2 },
  }
  const { cls, Icon } = cfg[type] ?? cfg.info
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm font-medium ${cls}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${type === "info" ? "animate-spin" : ""}`} />
      <span>{message}</span>
    </div>
  )
}

export default function CitizenLoginPage() {
  return (
    <Suspense fallback={null}>
      <CitizenLoginForm />
    </Suspense>
  )
}

function CitizenLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState("login") // "login" | "forgot" | "reset"

  // Login state
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus]     = useState(null)

  // Forgot password state
  const [resetEmail, setResetEmail]   = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetStatus, setResetStatus] = useState(null)

  // New password state (after clicking email link)
  const [newPassword, setNewPassword]         = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newPwLoading, setNewPwLoading]       = useState(false)
  const [newPwStatus, setNewPwStatus]         = useState(null)

  // ── Detect Supabase recovery code in URL ─────────────────────────────────
  useEffect(() => {
    const code = searchParams.get("code")
    if (!code) return

    // Exchange the one-time code for a session so updateUser() will work
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setNewPwStatus({ message: "Reset link is invalid or has expired. Please request a new one.", type: "error" })
      }
      // Whether or not it errored, show the reset form
      setMode("reset")
    })
  }, [searchParams])

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

      // 2. Look up their citizen profile (use maybeSingle — RLS may hide the row
      //    if user_id isn't set, but we should not block a valid auth session)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, wallet_address, zone")
        .eq("email", authData.user.email)
        .eq("role", "citizen")
        .maybeSingle()

      // 3. Store profile info for dashboard use (best-effort)
      if (typeof window !== "undefined") {
        if (profile?.zone)      localStorage.setItem("citizen_zone", profile.zone)
        if (profile?.full_name) localStorage.setItem("citizen_name", profile.full_name)
      }

      router.push("/citizen")

    } catch (err) {
      console.error("Login error:", err)
      let msg = err.message || "Login failed. Please try again."
      if (msg.includes("Invalid login credentials")) msg = "Incorrect email or password. Please try again."
      setStatus({ message: msg, type: "error" })
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setResetLoading(true)
    setResetStatus(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/login/citizen`,
      })
      if (error) throw error
      setResetStatus({
        message: "Password reset email sent! Check your inbox and follow the link to reset your password.",
        type: "success",
      })
    } catch (err) {
      setResetStatus({ message: err.message || "Failed to send reset email. Please try again.", type: "error" })
    } finally {
      setResetLoading(false)
    }
  }

  const handleNewPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setNewPwStatus({ message: "Passwords do not match. Please try again.", type: "error" })
      return
    }
    if (newPassword.length < 6) {
      setNewPwStatus({ message: "Password must be at least 6 characters.", type: "error" })
      return
    }
    setNewPwLoading(true)
    setNewPwStatus(null)
    try {
      const { data: updateData, error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      // Re-apply role metadata — updateUser can strip user_metadata on some Supabase versions
      await supabase.auth.updateUser({
        data: { role: "citizen", full_name: updateData.user?.user_metadata?.full_name },
      })

      setNewPwStatus({ message: "Password updated successfully! Redirecting to dashboard…", type: "success" })
      setTimeout(() => router.push("/citizen"), 2000)
    } catch (err) {
      setNewPwStatus({ message: err.message || "Failed to update password. Please try again.", type: "error" })
    } finally {
      setNewPwLoading(false)
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
        <Link href="/register/citizen" className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
          ← Register instead
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 px-7 py-6">
              <div className="flex items-center gap-2 mb-1">
                {mode === "login"
                  ? <Home className="w-4 h-4 text-orange-100" />
                  : <KeyRound className="w-4 h-4 text-orange-100" />
                }
                <span className="text-xs font-bold text-orange-100 uppercase tracking-widest">Citizen Portal</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                {mode === "login" ? "Sign In to Your Account" : mode === "forgot" ? "Reset Your Password" : "Set New Password"}
              </h1>
              <p className="text-orange-100 text-sm mt-1">
                {mode === "login"
                  ? "Enter your email and password to access the Citizen Dashboard."
                  : mode === "forgot"
                  ? "We'll send a password reset link to your email address."
                  : "Enter and confirm your new password below."
                }
              </p>
            </div>

            {/* ── Login Form ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="px-7 py-7 space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setMode("forgot"); setStatus(null) }}
                      className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                {status && <Banner {...status} />}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
                    : <>Sign In <ArrowRight className="w-4 h-4" /></>
                  }
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">
                    New citizen?
                  </div>
                </div>

                <Link
                  href="/register/citizen"
                  className="w-full h-11 border border-slate-200 text-slate-600 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm"
                >
                  Create a Citizen Account <ArrowRight className="w-4 h-4" />
                </Link>
              </form>
            )}

            {/* ── Forgot Password Form ── */}
            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword} className="px-7 py-7 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Your Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                {resetStatus && <Banner {...resetStatus} />}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
                    : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>
                  }
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("login"); setResetStatus(null); setResetEmail("") }}
                  className="w-full h-11 border border-slate-200 text-slate-600 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-sm"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* ── New Password Form (after clicking reset link) ── */}
            {mode === "reset" && (
              <form onSubmit={handleNewPassword} className="px-7 py-7 space-y-5">
                {newPwStatus && <Banner {...newPwStatus} />}

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                      className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      minLength={6}
                      className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={newPwLoading}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {newPwLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Updating…</>
                    : <>Set New Password <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
