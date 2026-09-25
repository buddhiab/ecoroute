"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  Users,
  Crown,
  ShieldCheck,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Calendar,
  Shield,
} from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────

function Badge({ role }) {
  if (role === "super_admin") {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
        <Crown className="w-3 h-3" /> Super Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
      <ShieldCheck className="w-3 h-3" /> Admin
    </span>
  )
}

function Banner({ message, type, onClose }) {
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
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-60 hover:opacity-100 transition-opacity text-xs">✕</button>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminManagementPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null) // { id, email }

  // Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
  }, [])

  // Fetch all admins via service role API route
  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch("/api/admin/list-admins")
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to load admins")
      }
      const data = await res.json()
      setAdmins(data.admins)
    } catch (err) {
      setStatus({ message: err.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  // Delete an admin
  const handleDelete = async (id, email) => {
    setConfirmDelete(null)
    setDeletingId(id)
    setStatus({ message: `Removing ${email}…`, type: "info" })
    try {
      const res = await fetch("/api/admin/delete-admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete admin")
      }
      setStatus({ message: `${email} has been removed.`, type: "success" })
      setAdmins((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setStatus({ message: err.message, type: "error" })
    } finally {
      setDeletingId(null)
    }
  }

  const isSuperAdmin = currentUser?.user_metadata?.role === "super_admin"

  // Guard: only super_admins can see this page
  if (!isSuperAdmin && currentUser !== null) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <Shield className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Access Denied</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Only <span className="font-semibold text-amber-600">Super Admins</span> can access this page.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-800">Admin Management</h1>
          </div>
          <p className="text-sm text-slate-500">
            View and manage all administrator accounts. Super Admin only.
          </p>
        </div>
        <button
          onClick={fetchAdmins}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status banner */}
      {status && <Banner {...status} onClose={() => setStatus(null)} />}

      {/* Admins table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">All Administrators</span>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5">
            {admins.length} {admins.length === 1 ? "account" : "accounts"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading admins…</span>
          </div>
        ) : admins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Users className="w-10 h-10 text-slate-200" />
            <p className="text-sm font-medium text-slate-400">No admin accounts found</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {admins.map((admin) => {
              const isMe = admin.id === currentUser?.id
              const isDeleting = deletingId === admin.id
              return (
                <li
                  key={admin.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                      admin.role === "super_admin"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {(admin.full_name || admin.email || "?")[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {admin.full_name || "—"}
                      </span>
                      <Badge role={admin.role} />
                      {isMe && (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Mail className="w-3 h-3" /> {admin.email}
                      </span>
                      {admin.created_at && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(admin.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete — cannot delete yourself or another super_admin */}
                  {!isMe && admin.role !== "super_admin" && (
                    <button
                      onClick={() => setConfirmDelete({ id: admin.id, email: admin.email })}
                      disabled={!!deletingId}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Remove admin"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Remove Admin</p>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-slate-800">{confirmDelete.email}</span> as an admin?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id, confirmDelete.email)}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

