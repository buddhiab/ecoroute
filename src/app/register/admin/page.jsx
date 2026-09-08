"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getContractSigner } from "@/lib/web3"
import {
  Zap,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react"

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function StepBar({ current, labels }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-xs mx-auto mb-8">
      {labels.map((label, i) => {
        const step = i + 1
        const isCompleted = current > step
        const isActive = current === step
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200 ${
                isCompleted ? "bg-blue-600 border-blue-600 text-white"
                : isActive ? "bg-white border-blue-600 text-blue-600"
                : "bg-white border-slate-200 text-slate-400"
              }`}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap transition-colors ${
                isActive ? "text-blue-600" : isCompleted ? "text-slate-600" : "text-slate-400"
              }`}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors duration-300 ${current > step ? "bg-blue-600" : "bg-slate-200"}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function TextInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
      <input className={`w-full border border-slate-200 bg-white rounded-xl py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all ${Icon ? "pl-10 pr-3.5" : "px-3.5"}`} {...props} />
    </div>
  )
}

function Banner({ message, type }) {
  if (!message) return null
  const cfg = {
    error: { cls: "bg-red-50 border-red-200 text-red-700", Icon: AlertCircle },
    success: { cls: "bg-emerald-50 border-emerald-200 text-emerald-700", Icon: CheckCircle2 },
    info: { cls: "bg-blue-50 border-blue-200 text-blue-700", Icon: Loader2 },
    warning: { cls: "bg-amber-50 border-amber-200 text-amber-700", Icon: AlertCircle },
  }
  const { cls, Icon } = cfg[type] ?? cfg.info
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm font-medium ${cls}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${type === "info" ? "animate-spin" : ""}`} />
      <span>{message}</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 — contact
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [department, setDepartment] = useState("")

  // Step 2 — admin access code
  const [accessCode, setAccessCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)

  // Step 3 — wallet
  const [walletAddress, setWalletAddress] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  const back = () => { setStatus(null); setStep((s) => s - 1) }

  // ── Step 1 ──
  const handleStep1 = (e) => {
    e.preventDefault()
    if (!email.trim() || !fullName.trim()) {
      return setStatus({ message: "Full name and email are required.", type: "error" })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setStatus({ message: "Please enter a valid email address.", type: "error" })
    }
    if (password.length < 8) {
      return setStatus({ message: "Password must be at least 8 characters.", type: "error" })
    }
    setStatus(null)
    setStep(2)
  }

  // ── Step 2 — verify access code ──
  // The access code is read from NEXT_PUBLIC_ADMIN_ACCESS_CODE env var.
  // In production, replace with a server-side verification call.
  const handleStep2 = (e) => {
    e.preventDefault()
    const expectedCode = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE || "ECO-ADMIN-2024"
    if (accessCode.trim() !== expectedCode) {
      return setStatus({ message: "Invalid access code. Contact your system administrator.", type: "error" })
    }
    setCodeVerified(true)
    setStatus(null)
    setStep(3)
  }

  // ── Wallet connect ──
  const connectWallet = async () => {
    setIsConnecting(true)
    setStatus({ message: "Connecting to MetaMask…", type: "info" })
    try {
      const { signer } = await getContractSigner()
      setWalletAddress(await signer.getAddress())
      setStatus(null)
    } catch {
      setStatus({ message: "Failed to connect wallet. Make sure MetaMask is unlocked.", type: "error" })
    } finally {
      setIsConnecting(false)
    }
  }

  // ── Submit ──
  const handleSubmit = async () => {
    if (!walletAddress) return setStatus({ message: "Please connect your MetaMask wallet first.", type: "error" })
    setIsSubmitting(true)
    setStatus({ message: "Creating admin account…", type: "info" })
    try {
      // 1. Create Supabase Auth account with admin role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role: "admin", full_name: fullName.trim() },
        },
      })
      if (authError) {
        if (authError.message.includes("already registered"))
          throw new Error("An account with this email already exists. Try logging in instead.")
        throw authError
      }

      // 2. Insert profile record
      const { error: pErr } = await supabase.from("profiles").insert([
        {
          contact: email.trim(),
          contact_type: "email",
          role: "admin",
          full_name: fullName.trim(),
          department: department.trim() || null,
          wallet_address: walletAddress,
        },
      ])
      if (pErr && pErr.code !== "42P01") {
        if (pErr.code === "23505") throw new Error("This wallet or email is already registered.")
        throw new Error(`Profile error: ${pErr.message}`)
      }

      // 3. Insert into admin_profiles (optional table)
      const { error: aErr } = await supabase.from("admin_profiles").insert([
        { wallet_address: walletAddress, full_name: fullName.trim(), department: department.trim() || null },
      ])
      if (aErr && aErr.code !== "42P01") {
        throw new Error(`Admin profile error: ${aErr.message}`)
      }

      setStatus({ message: "Admin account created! Redirecting to login…", type: "success" })
      setTimeout(() => router.push("/login/admin"), 1500)
    } catch (err) {
      console.warn("Admin registration error:", err)
      setStatus({ message: err.message, type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00A878] flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-slate-800 text-sm tracking-tight">EcoRoute</span>
        </Link>
        <Link href="/register" className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
          ← All roles
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 px-7 py-6">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Admin Registration</span>
              </div>
              <h1 className="text-xl font-bold text-white">Create Admin Account</h1>
              <p className="text-blue-100 text-sm mt-1">
                {step === 1 && "Enter your administrator details."}
                {step === 2 && "Enter your admin access code to verify your identity."}
                {step === 3 && "Connect your MetaMask wallet to complete registration."}
              </p>
            </div>

            <div className="px-7 py-7">
              <StepBar current={step} labels={["Details", "Verify", "Wallet"]} />

              {/* Step 1 */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-5">
                  <Field label="Full Name">
                    <TextInput icon={User} type="text" placeholder="e.g. A.B. Perera"
                      value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </Field>
                  <Field label="Official Email Address">
                    <TextInput icon={Mail} type="email" placeholder="admin@municipality.lk"
                      value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </Field>
                  <Field label="Department (Optional)">
                    <TextInput icon={Building2} type="text" placeholder="e.g. Waste Management Division"
                      value={department} onChange={(e) => setDepartment(e.target.value)} />
                  </Field>
                  <Field label="Password" hint="Minimum 8 characters — used to log in to the Command Center">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a secure password"
                        minLength={8}
                        required
                        className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  {status && <Banner {...status} />}
                  <button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 2 — Access code */}
              {step === 2 && (
                <form onSubmit={handleStep2} className="space-y-5">
                  {/* Info box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-800">Admin Access Required</p>
                        <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                          Enter the admin access code provided by your system administrator to verify your identity. This code is required to prevent unauthorised access.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Field label="Admin Access Code"
                    hint="Contact your system administrator if you don't have this code.">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showCode ? "text" : "password"}
                        placeholder="Enter access code"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        required
                        className="w-full pl-10 pr-11 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
                      />
                      <button type="button" onClick={() => setShowCode((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  {status && <Banner {...status} />}

                  <div className="flex gap-3">
                    <button type="button" onClick={back}
                      className="h-11 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center gap-1.5">
                      <ArrowLeft className="w-4 h-4" />Back
                    </button>
                    <button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                      Verify &amp; Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3 — Wallet */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* Verified badge */}
                  {codeVerified && (
                    <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="text-sm font-semibold text-blue-700">Access code verified — admin identity confirmed.</p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Summary</p>
                    {[
                      { label: "Name", value: fullName },
                      { label: "Email", value: email },
                      { label: "Department", value: department || "—" },
                      { label: "Role", value: "System Administrator" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-xs text-slate-500 font-medium">{label}</span>
                        <span className="text-xs font-semibold text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Wallet */}
                  {walletAddress ? (
                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Wallet Connected</p>
                        <p className="text-sm font-mono text-slate-700 truncate">{walletAddress}</p>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={connectWallet} disabled={isConnecting}
                      className="w-full flex items-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl p-4 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                        {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold">{isConnecting ? "Connecting…" : "Connect MetaMask Wallet"}</p>
                        <p className="text-xs text-slate-400">Required for treasury management</p>
                      </div>
                      <ChevronRight className="w-4 h-4 ml-auto text-slate-500" />
                    </button>
                  )}

                  {status && <Banner {...status} />}

                  <div className="flex gap-3">
                    <button type="button" onClick={back} disabled={isSubmitting}
                      className="h-11 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50">
                      <ArrowLeft className="w-4 h-4" />Back
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={!walletAddress || isSubmitting}
                      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : <><CheckCircle2 className="w-4 h-4" />Create Admin Account</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-5">
            Already have access?{" "}
            <Link href="/login/admin" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Log in to Command Center →
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
