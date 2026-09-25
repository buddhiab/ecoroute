"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  Zap,
  Truck,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Car,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Lock,
  Eye,
  EyeOff,
  Clock,
  ShieldCheck,
} from "lucide-react"
import EcoRouteLogo from "@/components/EcoRouteLogo"

const ZONES = [
  "Colombo 03",
  "Colombo 04",
  "Colombo 05",
  "Colombo 07",
  "Colombo 10",
  "Colombo 15",
]

// ── UI Helpers ────────────────────────────────────────────────────────────────

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
                isCompleted ? "bg-emerald-700 border-emerald-700 text-white"
                : isActive ? "bg-white border-emerald-700 text-emerald-700"
                : "bg-white border-slate-200 text-slate-400"
              }`}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap transition-colors ${
                isActive ? "text-emerald-700" : isCompleted ? "text-slate-600" : "text-slate-400"
              }`}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 transition-colors duration-300 ${current > step ? "bg-emerald-700" : "bg-slate-200"}`} />
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
      <input
        className={`w-full border border-slate-200 bg-white rounded-xl py-2.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700 transition-all ${Icon ? "pl-10 pr-3.5" : "px-3.5"}`}
        {...props}
      />
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder = "Create a password" }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={8}
        required
        className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700 transition-all"
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

// ── Approval Waiting Screen ───────────────────────────────────────────────────

function ApprovalWaitingScreen({ driverName, driverId, onSignOut }) {
  const router = useRouter()

  useEffect(() => {
    if (!driverId) return

    // Poll for approval via Realtime
    const channel = supabase
      .channel(`approval-wait-${driverId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "driver_profiles",
          filter: `id=eq.${driverId}`,
        },
        (payload) => {
          if (payload.new?.is_approved === true) {
            router.push("/driver")
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [driverId, router])

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <EcoRouteLogo size={32} className="rounded-lg shadow-sm shrink-0" />
          <span className="font-bold text-slate-800 text-sm tracking-tight">EcoRoute</span>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          {/* Animated waiting icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-amber-200 animate-ping opacity-40" />
            <div className="relative w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center">
              <Clock className="w-9 h-9 text-amber-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Application Submitted!
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-1">
            Hi <span className="font-semibold text-slate-700">{driverName}</span>, your driver registration is under review.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            An admin will review your details and approve your account. This page will <span className="font-semibold text-slate-600">automatically redirect</span> you to the dashboard once approved — no need to refresh.
          </p>

          {/* Status pill */}
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Awaiting Admin Approval</span>
          </div>

          {/* What happens next */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left shadow-sm space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">What happens next</p>
            {[
              { icon: ShieldCheck, text: "Admin reviews your vehicle, license, and zone details" },
              { icon: CheckCircle2, text: "Admin approves your account in the Fleet Monitor" },
              { icon: Truck, text: "You are automatically redirected to the Driver Dashboard" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                </div>
                <p className="text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-6">
            Already approved?{" "}
            <Link href="/login/driver" className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
              Log in here →
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

// ── Main Registration Component ───────────────────────────────────────────────

export default function DriverRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 — Contact & Auth
  const [contactType, setContactType] = useState("email")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  // Step 2 — Profile & Vehicle
  const [fullName, setFullName] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [assignedZone, setAssignedZone] = useState(ZONES[0])
  const [availableVehicles, setAvailableVehicles] = useState([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)

  // Step 3 — Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  // Post-submit — Approval waiting state
  const [submitted, setSubmitted] = useState(false)
  const [pendingDriverId, setPendingDriverId] = useState(null)

  const back = () => { setStatus(null); setStep((s) => s - 1) }

  // Fetch available vehicles when step 2 loads
  useEffect(() => {
    if (step !== 2) return
    setVehiclesLoading(true)
    supabase
      .from("vehicles")
      .select("registration_number")
      .order("created_at", { ascending: true })
      .then(({ data: allVehicles }) => {
        if (!allVehicles) { setVehiclesLoading(false); return }
        // Exclude vehicles already assigned to approved drivers
        supabase
          .from("driver_profiles")
          .select("vehicle_number")
          .eq("is_approved", true)
          .then(({ data: assigned }) => {
            const assignedSet = new Set((assigned || []).map((d) => d.vehicle_number))
            const free = allVehicles
              .map((v) => v.registration_number)
              .filter((reg) => !assignedSet.has(reg))
            setAvailableVehicles(free)
            if (free.length > 0 && !selectedVehicle) setSelectedVehicle(free[0])
            setVehiclesLoading(false)
          })
      })
  }, [step])

  // ── Step validators ──

  const handleStep1 = (e) => {
    e.preventDefault()
    if (contactType === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return setStatus({ message: "Please enter a valid email address.", type: "error" })
      }
    } else {
      if (!/^\+?[\d\s\-]{7,15}$/.test(phone.trim())) {
        return setStatus({ message: "Please enter a valid phone number (include country code).", type: "error" })
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return setStatus({ message: "An email address is also required for your account login.", type: "error" })
      }
    }
    if (password.length < 8) {
      return setStatus({ message: "Password must be at least 8 characters.", type: "error" })
    }
    setStatus(null)
    setStep(2)
  }

  const handleStep2 = (e) => {
    e.preventDefault()
    if (!fullName.trim() || !licenseNumber.trim()) {
      return setStatus({ message: "Full name and license number are required.", type: "error" })
    }
    if (!selectedVehicle) {
      return setStatus({ message: "Please select an available vehicle.", type: "error" })
    }
    setStatus(null)
    setStep(3)
  }

  // ── Final Submit ──

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setStatus(null)

    try {
      // 1. Create Supabase Auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { role: "driver", full_name: fullName.trim() },
        },
      })

      if (authError) throw authError

      const userId = authData.user?.id

      // 2. Insert driver profile (is_approved = false by default)
      const { data: profileData, error: profileError } = await supabase
        .from("driver_profiles")
        .insert([
          {
            user_id: userId ?? null,
            full_name: fullName.trim(),
            email: email.trim(),
            phone_number: phone.trim() || null,
            vehicle_number: selectedVehicle,
            license_number: licenseNumber.trim().toUpperCase(),
            assigned_zone: assignedZone,
            is_approved: false,
          },
        ])
        .select()

      if (profileError) throw profileError

      const driverId = profileData[0]?.id
      setPendingDriverId(driverId)

      setSubmitted(true)
    } catch (err) {
      console.error("Registration error:", err)
      let msg = err.message || "Registration failed. Please try again."
      if (msg.includes("already registered")) msg = "An account with this email already exists. Try logging in instead."
      setStatus({ message: msg, type: "error" })
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/register/driver")
  }

  // ── Show approval waiting screen after submission ──

  if (submitted) {
    return (
      <ApprovalWaitingScreen
        driverName={fullName}
        driverId={pendingDriverId}
        onSignOut={handleSignOut}
      />
    )
  }

  // ── Registration form ──

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <EcoRouteLogo size={32} className="rounded-lg shadow-sm shrink-0" />
          <span className="font-bold text-slate-800 text-sm tracking-tight">EcoRoute</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login/driver" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
            Already registered? Log in →
          </Link>
          <Link href="/register" className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
            ← All roles
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 px-7 py-6">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest">Driver Registration</span>
              </div>
              <h1 className="text-xl font-bold text-white">Create Driver Account</h1>
              <p className="text-emerald-100 text-sm mt-1">
                {step === 1 && "Set up your login credentials."}
                {step === 2 && "Enter your vehicle and license details."}
                {step === 3 && "Review your details and submit for approval."}
              </p>
            </div>

            <div className="px-7 py-7">
              <StepBar current={step} labels={["Login", "Vehicle", "Review"]} />

              {/* ── Step 1: Contact & Password ── */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-5">
                  {/* Email/Phone toggle */}
                  <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    {["email", "phone"].map((t) => (
                      <button key={t} type="button"
                        onClick={() => { setContactType(t); setStatus(null) }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${contactType === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                        {t === "email" ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                        {t === "email" ? "Email" : "Phone"}
                      </button>
                    ))}
                  </div>

                  <Field label="Email Address" hint="Used for your account login">
                    <TextInput
                      icon={Mail}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>

                  {contactType === "phone" && (
                    <Field label="Phone Number" hint="Include country code, e.g. +94 77 123 4567">
                      <TextInput
                        icon={Phone}
                        type="tel"
                        placeholder="+94 77 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </Field>
                  )}

                  <Field label="Password" hint="Minimum 8 characters">
                    <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
                  </Field>

                  {status && <Banner {...status} />}

                  <button type="submit" className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* ── Step 2: Vehicle & Profile ── */}
              {step === 2 && (
                <form onSubmit={handleStep2} className="space-y-5">
                  <Field label="Full Name">
                    <TextInput icon={User} type="text" placeholder="e.g. R. Fernando"
                      value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </Field>

                  <Field label="Assigned Vehicle" hint={availableVehicles.length === 0 ? "No vehicles available — contact admin to add vehicles to the fleet." : `${availableVehicles.length} vehicle(s) available`}>
                    {vehiclesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-2.5 px-3.5 border border-slate-200 rounded-xl">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading available vehicles…
                      </div>
                    ) : availableVehicles.length === 0 ? (
                      <div className="py-2.5 px-3.5 border border-amber-200 bg-amber-50 rounded-xl text-sm text-amber-700 font-medium">
                        No vehicles available. Admin must add vehicles to the fleet first.
                      </div>
                    ) : (
                      <div className="relative">
                        <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                          value={selectedVehicle}
                          onChange={(e) => setSelectedVehicle(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700 transition-all cursor-pointer"
                        >
                          {availableVehicles.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </Field>

                  <Field label="Driver's License Number">
                    <TextInput icon={FileText} type="text" placeholder="e.g. B1234567"
                      value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                  </Field>

                  <Field label="Preferred Zone">
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select value={assignedZone} onChange={(e) => setAssignedZone(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700 transition-all cursor-pointer">
                        {ZONES.map((z) => <option key={z}>{z}</option>)}
                      </select>
                    </div>
                  </Field>

                  {status && <Banner {...status} />}

                  <div className="flex gap-3">
                    <button type="button" onClick={back} className="h-11 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center gap-1.5">
                      <ArrowLeft className="w-4 h-4" />Back
                    </button>
                    <button
                      type="submit"
                      disabled={availableVehicles.length === 0}
                      className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* ── Step 3: Review & Submit ── */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Registration Summary</p>
                    {[
                      { label: "Email", value: email },
                      { label: "Phone", value: phone || "Not provided" },
                      { label: "Full Name", value: fullName },
                      { label: "Vehicle", value: selectedVehicle },
                      { label: "License", value: licenseNumber.toUpperCase() },
                      { label: "Zone", value: assignedZone },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-0.5">
                        <span className="text-xs text-slate-500 font-medium">{label}</span>
                        <span className="text-xs font-semibold text-slate-700">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 font-medium">
                      After submitting, your account will be <strong>pending admin approval</strong>. You will be automatically redirected to the dashboard once an admin approves you.
                    </p>
                  </div>

                  {status && <Banner {...status} />}

                  <div className="flex gap-3">
                    <button type="button" onClick={back} disabled={isSubmitting}
                      className="h-11 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50">
                      <ArrowLeft className="w-4 h-4" />Back
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                      className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</>
                        : <><CheckCircle2 className="w-4 h-4" />Submit Application</>
                      }
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
