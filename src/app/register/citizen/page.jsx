"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getContractSigner } from "@/lib/web3"
import {
  Zap,
  User,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
  UserPlus
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
                isCompleted ? "bg-orange-500 border-orange-500 text-white"
                : isActive ? "bg-white border-orange-500 text-orange-500"
                : "bg-white border-slate-200 text-slate-400"
              }`}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap transition-colors ${
                isActive ? "text-orange-500" : isCompleted ? "text-slate-600" : "text-slate-400"
              }`}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors duration-300 ${current > step ? "bg-orange-500" : "bg-slate-200"}`} />
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
      <input className={`w-full border border-slate-200 bg-white rounded-xl py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all ${Icon ? "pl-10 pr-3.5" : "px-3.5"}`} {...props} />
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

export default function CitizenRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 — Auth
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  // Step 2 — Profile
  const [fullName, setFullName] = useState("")

  // Step 3 — Wallet
  const [walletAddress, setWalletAddress] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  const back = () => { setStatus(null); setStep((s) => s - 1) }

  // ── Step 1 ──
  const handleStep1 = (e) => {
    e.preventDefault()
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setStatus({ message: "Please enter a valid email address.", type: "error" })
    }
    if (password.length < 8) {
      return setStatus({ message: "Password must be at least 8 characters.", type: "error" })
    }
    setStatus(null)
    setStep(2)
  }

  // ── Step 2 ──
  const handleStep2 = (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      return setStatus({ message: "Full name is required.", type: "error" })
    }
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
    setStatus({ message: "Creating citizen account…", type: "info" })
    try {
      // 1. Create Supabase Auth account with citizen role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role: "citizen", full_name: fullName.trim() },
        },
      })
      if (authError) {
        if (authError.message.includes("already registered") || authError.status === 429)
          throw new Error("An account with this email already exists or rate limit exceeded. Try logging in instead.")
        throw authError
      }

      // 2. Insert profile record into the general profiles table
      const { error: pErr } = await supabase.from("profiles").insert([
        {
          contact: email.trim(),
          contact_type: "email",
          role: "citizen",
          full_name: fullName.trim(),
          email: email.trim(),
          wallet_address: walletAddress,
        },
      ])
      
      if (pErr) {
        if (pErr.code === "23505") throw new Error("This wallet or email is already registered.")
        throw new Error(`Profile error: ${pErr.message}`)
      }

      // Optional: link auth user in citizen_profiles if the table expects it
      await supabase.from("citizen_profiles").insert([{ user_id: authData.user?.id || null }]);

      setStatus({ message: "Account created! Redirecting to dashboard…", type: "success" })
      setTimeout(() => router.push("/citizen"), 1500)
    } catch (err) {
      console.warn("Registration error:", err)
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
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
            Already registered? Log in →
          </Link>
          <Link href="/register" className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
            ← All roles
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-orange-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 px-7 py-6">
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4 text-orange-100" />
                <span className="text-xs font-bold text-orange-100 uppercase tracking-widest">Citizen Registration</span>
              </div>
              <h1 className="text-xl font-bold text-white">Create Citizen Account</h1>
              <p className="text-orange-100 text-sm mt-1">
                {step === 1 && "Set up your login credentials."}
                {step === 2 && "Enter your profile details."}
                {step === 3 && "Connect your MetaMask wallet to receive rewards."}
              </p>
            </div>

            <div className="px-7 py-7">
              <StepBar current={step} labels={["Account", "Profile", "Wallet"]} />

              {/* Step 1 */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-5">
                  <Field label="Email Address">
                    <TextInput icon={Mail} type="email" placeholder="you@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </Field>
                  <Field label="Password" hint="Minimum 8 characters">
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a secure password"
                        minLength={8}
                        required
                        className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  {status && <Banner {...status} />}
                  <button type="submit" className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <form onSubmit={handleStep2} className="space-y-5">
                  <Field label="Full Name">
                    <TextInput icon={User} type="text" placeholder="e.g. Kamal Perera"
                      value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </Field>

                  {status && <Banner {...status} />}

                  <div className="flex gap-3">
                    <button type="button" onClick={back}
                      className="h-11 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center gap-1.5">
                      <ArrowLeft className="w-4 h-4" />Back
                    </button>
                    <button type="submit" className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Summary</p>
                    {[
                      { label: "Name", value: fullName },
                      { label: "Email", value: email },
                      { label: "Role", value: "Citizen" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-xs text-slate-500 font-medium">{label}</span>
                        <span className="text-xs font-semibold text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Wallet */}
                  {walletAddress ? (
                    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">Wallet Connected</p>
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
                        <p className="text-xs text-slate-400">Required to receive ECO tokens</p>
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
                      className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : <><CheckCircle2 className="w-4 h-4" />Create Account</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
