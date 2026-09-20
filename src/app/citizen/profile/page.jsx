"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getContractSigner } from "@/lib/web3"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  CalendarDays,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Save,
  X,
  Zap,
  LogOut,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react"

const ZONES = [
  "Colombo 03",
  "Colombo 04",
  "Colombo 05",
  "Colombo 07",
  "Colombo 10",
  "Colombo 15",
]

const PICKUP_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function Banner({ message, type }) {
  if (!message) return null
  const cfg = {
    error:   { cls: "bg-red-50 border-red-200 text-red-700",            Icon: AlertCircle },
    success: { cls: "bg-emerald-50 border-emerald-200 text-emerald-700", Icon: CheckCircle2 },
    info:    { cls: "bg-blue-50 border-blue-200 text-blue-700",          Icon: Loader2 },
  }
  const { cls, Icon } = cfg[type] ?? cfg.info
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm font-medium ${cls}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${type === "info" ? "animate-spin" : ""}`} />
      <span>{message}</span>
    </div>
  )
}

function ReadOnlyRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-all">
          {value || <span className="text-slate-400 font-normal italic">Not provided</span>}
        </p>
      </div>
    </div>
  )
}

export default function CitizenProfilePage() {
  const router = useRouter()

  // Profile data
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edit state
  const [editing, setEditing]         = useState(false)
  const [editName, setEditName]       = useState("")
  const [editPhone, setEditPhone]     = useState("")
  const [editZone, setEditZone]       = useState("")
  const [editDay, setEditDay]         = useState("")
  const [editHouse, setEditHouse]     = useState("")
  const [saving, setSaving]           = useState(false)
  const [status, setStatus]           = useState(null)

  // Wallet connect
  const [walletConnecting, setWalletConnecting] = useState(false)
  const [walletStatus, setWalletStatus]         = useState(null)

  // Sign out
  const [signingOut, setSigningOut] = useState(false)

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmEmail, setConfirmEmail]           = useState("")
  const [deleting, setDeleting]                   = useState(false)
  const [deleteError, setDeleteError]             = useState(null)

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace("/login/citizen"); return }

      const { data: rows, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, zone, house_number, preferred_day, wallet_address, how_heard")
        .eq("email", session.user.email)
        .eq("role", "citizen")
        .limit(1)

      const data = rows?.[0] ?? null

      // Fallback: if RLS hides the row, build a minimal profile from auth metadata
      const resolved = data ?? {
        full_name:     session.user.user_metadata?.full_name || "",
        email:         session.user.email,
        phone:         null,
        zone:          localStorage.getItem("citizen_zone") || "",
        house_number:  null,
        preferred_day: null,
        wallet_address: null,
        how_heard:     null,
      }

      if (error && !data) { console.warn("Profile fetch error:", error) }

      setProfile(resolved)
      setEditName(resolved.full_name || "")
      setEditPhone(resolved.phone || "")
      setEditZone(resolved.zone || ZONES[0])
      setEditDay(resolved.preferred_day || PICKUP_DAYS[0])
      setEditHouse(resolved.house_number || "")
      setLoading(false)
    }
    loadProfile()
  }, [router])

  const handleSave = async () => {
    if (!editName.trim()) {
      return setStatus({ message: "Full name cannot be empty.", type: "error" })
    }
    if (editPhone.trim() && !/^\+?[\d\s\-]{7,15}$/.test(editPhone.trim())) {
      return setStatus({ message: "Please enter a valid phone number.", type: "error" })
    }
    setSaving(true)
    setStatus({ message: "Saving changes…", type: "info" })
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name:     editName.trim(),
          phone:         editPhone.trim() || null,
          zone:          editZone,
          preferred_day: editDay,
          house_number:  editHouse.trim() || null,
        })
        .eq("email", session.user.email)
        .eq("role", "citizen")

      if (error) throw error

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("citizen_zone", editZone)
        localStorage.setItem("citizen_name", editName.trim())
      }

      setProfile((p) => ({ ...p, full_name: editName.trim(), phone: editPhone.trim() || null, zone: editZone, preferred_day: editDay, house_number: editHouse.trim() || null }))
      setStatus({ message: "Profile updated successfully!", type: "success" })
      setEditing(false)
    } catch (err) {
      setStatus({ message: err.message || "Failed to save changes.", type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setStatus(null)
    setEditName(profile.full_name || "")
    setEditPhone(profile.phone || "")
    setEditZone(profile.zone || ZONES[0])
    setEditDay(profile.preferred_day || PICKUP_DAYS[0])
    setEditHouse(profile.house_number || "")
  }

  const handleConnectWallet = async () => {
    setWalletConnecting(true)
    setWalletStatus({ message: "Connecting to MetaMask…", type: "info" })
    try {
      const { signer } = await getContractSigner()
      const address = await signer.getAddress()

      const { data: { session } } = await supabase.auth.getSession()
      const { error } = await supabase
        .from("profiles")
        .update({ wallet_address: address })
        .eq("email", session.user.email)
        .eq("role", "citizen")

      if (error) throw error

      setProfile((p) => ({ ...p, wallet_address: address }))
      setWalletStatus({ message: "Wallet connected and saved!", type: "success" })
    } catch {
      setWalletStatus({ message: "Failed to connect wallet. Make sure MetaMask is unlocked.", type: "error" })
    } finally {
      setWalletConnecting(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    if (typeof window !== "undefined") {
      localStorage.removeItem("citizen_zone")
      localStorage.removeItem("citizen_name")
    }
    router.replace("/login/citizen")
  }

  const handleDeleteAccount = async () => {
    if (confirmEmail.trim().toLowerCase() !== profile?.email?.toLowerCase()) {
      setDeleteError("Email does not match. Please type your email exactly.")
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch("/api/citizen/delete-account", { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Deletion failed")

      // Clear local state
      await supabase.auth.signOut()
      if (typeof window !== "undefined") {
        localStorage.removeItem("citizen_zone")
        localStorage.removeItem("citizen_name")
      }
      router.replace("/")
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account. Please try again.")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="p-5 md:p-7 max-w-2xl mx-auto w-full space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">View and manage your citizen account details.</p>
        </div>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setStatus(null) }}
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors shadow-sm shrink-0"
          >
            <Pencil className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* ── Profile Info Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Card header strip */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base">{profile.full_name}</p>
            <p className="text-orange-100 text-sm">{profile.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Citizen</span>
          </div>
        </div>

        {/* View mode */}
        {!editing && (
          <div className="px-6 py-2 divide-y divide-slate-100">
            <ReadOnlyRow icon={Mail}        label="Email"            value={profile.email} />
            <ReadOnlyRow icon={Phone}       label="Phone Number"     value={profile.phone} />
            <ReadOnlyRow icon={MapPin}      label="Residential Zone" value={profile.zone} />
            <ReadOnlyRow icon={Home}        label="House / Flat No." value={profile.house_number} />
            <ReadOnlyRow icon={CalendarDays} label="Preferred Pickup Day" value={profile.preferred_day} />
          </div>
        )}

        {/* Edit mode */}
        {editing && (
          <div className="px-6 py-5 space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Full Name <span className="text-orange-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name" required
                  className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all" />
              </div>
            </div>

            {/* Zone */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Residential Zone</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select value={editZone} onChange={(e) => setEditZone(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all appearance-none cursor-pointer">
                  {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>

            {/* House Number */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">House / Flat Number</label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="text" value={editHouse} onChange={(e) => setEditHouse(e.target.value)}
                  placeholder="e.g. 12A or Flat 3B"
                  className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all" />
              </div>
            </div>

            {/* Preferred Pickup Day */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Preferred Pickup Day</label>
              <div className="relative">
                <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select value={editDay} onChange={(e) => setEditDay(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-xl py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all appearance-none cursor-pointer">
                  {PICKUP_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {status && <Banner {...status} />}

            <div className="flex gap-3 pt-1">
              <button onClick={handleCancelEdit} disabled={saving}
                className="h-11 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50">
                <X className="w-4 h-4" />Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                  : <><Save className="w-4 h-4" />Save Changes</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Status banner (view mode) */}
        {!editing && status && (
          <div className="px-6 pb-4">
            <Banner {...status} />
          </div>
        )}
      </div>

      {/* ── Wallet Card ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-800">MetaMask Wallet</h2>
        </div>

        {profile.wallet_address ? (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Connected</p>
              <p className="text-sm font-mono text-slate-700 truncate">{profile.wallet_address}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <p className="text-xs text-amber-700 font-medium">
                No wallet connected. Connect MetaMask to earn <strong>ECO tokens</strong> when you submit waste reports.
              </p>
            </div>
            <button onClick={handleConnectWallet} disabled={walletConnecting}
              className="w-full flex items-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl p-4 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                {walletConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">{walletConnecting ? "Connecting…" : "Connect MetaMask"}</p>
                <p className="text-xs text-slate-400">Earn ECO tokens for every report</p>
              </div>
            </button>
            {walletStatus && <Banner {...walletStatus} />}
          </div>
        )}
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-2">
          <TriangleAlert className="w-4 h-4 text-red-500 shrink-0" />
          <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Sign Out */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Sign Out</p>
              <p className="text-xs text-slate-500 mt-0.5">Sign out of your account on this device.</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="shrink-0 inline-flex items-center gap-2 h-10 px-4 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
            >
              {signingOut
                ? <><Loader2 className="w-4 h-4 animate-spin" />Signing out…</>
                : <><LogOut className="w-4 h-4" />Sign Out</>
              }
            </button>
          </div>

          <div className="border-t border-red-100" />

          {/* Delete Account */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-red-700">Delete Account</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanently delete your account and all associated data. This cannot be undone.
                </p>
              </div>
              {!showDeleteConfirm && (
                <button
                  onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); setConfirmEmail("") }}
                  className="shrink-0 inline-flex items-center gap-2 h-10 px-4 bg-red-50 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              )}
            </div>

            {/* Confirmation dialog */}
            {showDeleteConfirm && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <TriangleAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">This will permanently delete:</p>
                    <ul className="text-xs text-red-600 mt-1 space-y-0.5 list-disc list-inside">
                      <li>Your profile and all personal data</li>
                      <li>Your citizen account login</li>
                      <li>Your reports and activity history</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-red-700">
                    Type your email address to confirm: <span className="font-mono text-red-500">{profile?.email}</span>
                  </label>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => { setConfirmEmail(e.target.value); setDeleteError(null) }}
                    placeholder={profile?.email}
                    disabled={deleting}
                    className="w-full border border-red-200 bg-white rounded-xl py-2.5 px-3.5 text-sm font-medium text-slate-800 placeholder:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-400/40 focus:border-red-400 transition-all disabled:opacity-50"
                  />
                </div>

                {deleteError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {deleteError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setConfirmEmail(""); setDeleteError(null) }}
                    disabled={deleting}
                    className="flex-1 h-10 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white transition-colors text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || confirmEmail.trim().toLowerCase() !== profile?.email?.toLowerCase()}
                    className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleting
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</>
                      : <><Trash2 className="w-4 h-4" />Yes, Delete Everything</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
