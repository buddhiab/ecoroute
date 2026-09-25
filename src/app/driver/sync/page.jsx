"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  Clock,
  Database,
  Trash2,
  Upload,
  AlertTriangle,
  Loader2,
  HardDrive,
  Signal,
  ServerCrash,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// ── IndexedDB helpers
const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open("EcoRouteDB", 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const getAllQueueItems = async () => {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction("syncQueue", "readonly")
    const req = tx.objectStore("syncQueue").getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => resolve([])
  })
}

const clearQueue = async () => {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction("syncQueue", "readwrite")
    tx.objectStore("syncQueue").clear()
    tx.oncomplete = resolve
  })
}

const deleteQueueItem = async (id) => {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction("syncQueue", "readwrite")
    tx.objectStore("syncQueue").delete(id)
    tx.oncomplete = resolve
  })
}

// ── Service Worker status reader
const getSWStatus = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { supported: false, status: "unsupported", registration: null }
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js")
    if (!reg) return { supported: true, status: "unregistered", registration: null }
    const sw = reg.active ?? reg.installing ?? reg.waiting
    const status = reg.active
      ? "active"
      : reg.installing
      ? "installing"
      : reg.waiting
      ? "waiting"
      : "unknown"
    return { supported: true, status, registration: reg, scriptURL: sw?.scriptURL }
  } catch {
    return { supported: true, status: "error", registration: null }
  }
}

// ── Cache storage inspector
const getCacheEntries = async () => {
  if (typeof window === "undefined" || !("caches" in window)) return []
  try {
    const keys = await caches.keys()
    const entries = []
    for (const key of keys) {
      const cache = await caches.open(key)
      const requests = await cache.keys()
      entries.push({ name: key, count: requests.length, urls: requests.map((r) => r.url) })
    }
    return entries
  } catch {
    return []
  }
}

function StatusBadge({ label, variant }) {
  const variants = {
    success: "bg-green-900/40 text-green-300 border-green-700/40",
    warning: "bg-amber-900/40 text-amber-300 border-amber-700/40",
    error: "bg-red-900/40 text-red-300 border-red-700/40",
    info: "bg-blue-900/40 text-blue-300 border-blue-700/40",
    neutral: "bg-slate-800 text-slate-400 border-slate-700",
  }
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${variants[variant] ?? variants.neutral}`}>
      {label}
    </span>
  )
}

export default function OfflineSyncPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueItems, setQueueItems] = useState([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [swInfo, setSWInfo] = useState(null)
  const [cacheInfo, setCacheInfo] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [syncLog, setSyncLog] = useState([])
  const [clearing, setClearing] = useState(false)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState(null)

  const addLog = (msg, type = "info") => {
    const ts = new Date().toLocaleTimeString()
    setSyncLog((prev) => [{ msg, type, ts }, ...prev].slice(0, 20))
  }

  const loadQueueItems = useCallback(async () => {
    setQueueLoading(true)
    try {
      const items = await getAllQueueItems()
      setQueueItems(items)
    } catch (err) {
      console.error("Failed to read queue:", err)
      setQueueItems([])
    } finally {
      setQueueLoading(false)
    }
  }, [])

  const loadSWAndCacheInfo = useCallback(async () => {
    const [sw, caches] = await Promise.all([getSWStatus(), getCacheEntries()])
    setSWInfo(sw)
    setCacheInfo(caches)
  }, [])

  // Boot
  useEffect(() => {
    if (typeof window === "undefined") return
    setIsOnline(navigator.onLine)
    const onOnline = () => {
      setIsOnline(true)
      addLog("Network reconnected", "success")
      loadQueueItems()
    }
    const onOffline = () => {
      setIsOnline(false)
      addLog("Network disconnected — offline mode active", "warning")
    }
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    loadQueueItems()
    loadSWAndCacheInfo()
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [loadQueueItems, loadSWAndCacheInfo])

  // ── Manual force-sync
  const handleForcSync = async () => {
    if (!isOnline) {
      addLog("Cannot sync — device is offline", "error")
      return
    }
    if (queueItems.length === 0) {
      addLog("Queue is empty — nothing to sync", "info")
      return
    }
    setSyncing(true)
    addLog(`Starting sync of ${queueItems.length} queued task(s)…`, "info")

    let successCount = 0
    let failCount = 0

    for (const task of queueItems) {
      try {
        addLog(`Syncing route #${task.routeId}…`, "info")
        const { error: routeErr } = await supabase
          .from("Routes")
          .update({ status: "Completed" })
          .eq("id", task.routeId)

        if (routeErr) throw routeErr

        const { error: hciErr } = await supabase.from("HCILogs").insert([
          {
            task_name: "Mark Route Completed (Offline Sync)",
            clicks: 1,
            time_taken: task.timeTakenMs,
          },
        ])

        if (hciErr) throw hciErr

        await deleteQueueItem(task.id)
        successCount++
        addLog(`Route #${task.routeId} synced successfully ✓`, "success")
      } catch (err) {
        failCount++
        addLog(`Failed to sync route #${task.routeId}: ${err.message}`, "error")
      }
    }

    await loadQueueItems()
    setLastSyncTime(new Date())
    addLog(
      `Sync complete — ${successCount} succeeded, ${failCount} failed`,
      failCount > 0 ? "warning" : "success"
    )
    setSyncing(false)
  }

  // ── Clear queue manually
  const handleClearQueue = async () => {
    setConfirmingClear(false)
    setClearing(true)
    try {
      await clearQueue()
      setQueueItems([])
      addLog("Offline queue cleared manually", "warning")
    } catch {
      addLog("Failed to clear queue", "error")
    } finally {
      setClearing(false)
    }
  }

  const swVariant =
    swInfo?.status === "active"
      ? "success"
      : swInfo?.status === "installing" || swInfo?.status === "waiting"
      ? "warning"
      : swInfo?.status === "unregistered"
      ? "neutral"
      : "error"

  const swLabel =
    swInfo?.status === "active"
      ? "Active"
      : swInfo?.status === "installing"
      ? "Installing"
      : swInfo?.status === "waiting"
      ? "Waiting"
      : swInfo?.status === "unregistered"
      ? "Not Registered"
      : swInfo?.status === "unsupported"
      ? "Unsupported"
      : "Error"

  return (
    <div className="p-5 md:p-7 space-y-7 max-w-4xl mx-auto w-full">
      {/* Page heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <WifiOff className="w-6 h-6 text-orange-400" />
            Offline Sync Status
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            IndexedDB task queue · Service Worker health · Cache storage
          </p>
        </div>
        <button
          onClick={() => { loadQueueItems(); loadSWAndCacheInfo() }}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── CONNECTIVITY STATUS BANNER ── */}
      <div
        className={`flex items-center gap-4 rounded-2xl px-5 py-4 border ${
          isOnline
            ? "bg-green-950/30 border-green-700/40"
            : "bg-orange-950/30 border-orange-700/40 animate-pulse"
        }`}
      >
        {isOnline ? (
          <Wifi className="w-6 h-6 text-green-400 shrink-0" strokeWidth={2.5} />
        ) : (
          <WifiOff className="w-6 h-6 text-orange-400 shrink-0" strokeWidth={2.5} />
        )}
        <div className="flex-1">
          <p className={`font-black text-sm ${isOnline ? "text-green-300" : "text-orange-300"}`}>
            {isOnline ? "Device is Online" : "Device is Offline"}
          </p>
          <p className={`text-xs mt-0.5 ${isOnline ? "text-green-500/70" : "text-orange-500/70"}`}>
            {isOnline
              ? "All mutations are being synced to Supabase in real-time."
              : "Actions are being saved locally to IndexedDB and will auto-sync on reconnection."}
          </p>
        </div>
        <StatusBadge label={isOnline ? "Online" : "Offline"} variant={isOnline ? "success" : "warning"} />
      </div>

      {/* ── TOP STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Database,
            label: "Queued Tasks",
            value: queueLoading ? "…" : String(queueItems.length),
            color: queueItems.length > 0 ? "text-orange-400" : "text-slate-400",
          },
          {
            icon: HardDrive,
            label: "Cache Buckets",
            value: String(cacheInfo.length),
            color: "text-blue-400",
          },
          {
            icon: Signal,
            label: "Service Worker",
            value: swLabel,
            color: swInfo?.status === "active" ? "text-green-400" : "text-slate-400",
          },
          {
            icon: Clock,
            label: "Last Sync",
            value: lastSyncTime ? lastSyncTime.toLocaleTimeString() : "Never",
            color: "text-slate-400",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} strokeWidth={2} />
            <p className={`text-lg font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── INDEXEDDB QUEUE ── */}
      <Card className="bg-slate-900 border-slate-800 rounded-2xl overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-slate-800 flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-400" />
            <CardTitle className="text-sm font-black text-white">
              IndexedDB Offline Queue
            </CardTitle>
            {!queueLoading && (
              <span className="text-xs font-black bg-orange-900/40 text-orange-300 border border-orange-700/40 px-2 py-0.5 rounded-full">
                {queueItems.length} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {queueItems.length > 0 && (confirmingClear ? (
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handleClearQueue}
                  disabled={clearing}
                  className="h-8 px-3 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl"
                >
                  Confirm clear
                </Button>
                <Button
                  onClick={() => setConfirmingClear(false)}
                  className="h-8 px-3 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setConfirmingClear(true)}
                disabled={clearing}
                className="h-8 px-3 text-xs font-bold bg-transparent border border-red-700/50 text-red-400 hover:bg-red-900/30 rounded-xl"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            ))}
            <Button
              onClick={handleForcSync}
              disabled={syncing || !isOnline || queueItems.length === 0}
              className="h-8 px-3 text-xs font-bold bg-green-700 hover:bg-green-600 text-white rounded-xl disabled:opacity-50"
            >
              {syncing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Syncing…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3 h-3" />
                  Force Sync
                </span>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {queueLoading ? (
            <div className="p-8 text-center text-slate-600 font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading IndexedDB…
            </div>
          ) : queueItems.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-slate-500 font-bold text-sm">Queue is empty</p>
              <p className="text-slate-700 text-xs mt-1">All tasks are synced to Supabase.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {queueItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-900/40 border border-orange-700/40 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        Route #{item.routeId}
                      </p>
                      <p className="text-xs text-slate-600 font-mono">
                        IDB key: {item.id} · Duration: {Math.round((item.timeTakenMs ?? 0) / 1000)}s
                      </p>
                    </div>
                  </div>
                  <StatusBadge label="Pending Sync" variant="warning" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SERVICE WORKER STATUS ── */}
      <Card className="bg-slate-900 border-slate-800 rounded-2xl overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-slate-800 flex-row items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-400" />
          <CardTitle className="text-sm font-black text-white">Service Worker</CardTitle>
          {swInfo && <StatusBadge label={swLabel} variant={swVariant} />}
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {!swInfo ? (
            <p className="text-slate-600 text-sm">Loading…</p>
          ) : !swInfo.supported ? (
            <div className="flex items-start gap-3">
              <ServerCrash className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-slate-400">
                Service Workers are not supported in this browser environment.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/60 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Registration State</p>
                  <p className="text-sm font-black text-slate-200">{swLabel}</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Scope</p>
                  <p className="text-xs font-mono text-slate-300 break-all">
                    {swInfo.registration?.scope ?? "—"}
                  </p>
                </div>
              </div>
              {swInfo.scriptURL && (
                <div className="bg-slate-800/60 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Script URL</p>
                  <p className="text-xs font-mono text-blue-400 break-all">{swInfo.scriptURL}</p>
                </div>
              )}
              {swInfo.status === "unregistered" && (
                <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400">
                    Service worker is not registered. Visit the Driver Terminal to trigger registration.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cache entries */}
          {cacheInfo.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Cache Storage Buckets
              </p>
              {cacheInfo.map((c) => (
                <div key={c.name} className="bg-slate-800/60 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-300 font-mono">{c.name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {c.urls.slice(0, 3).join(", ")}
                      {c.urls.length > 3 ? ` +${c.urls.length - 3} more` : ""}
                    </p>
                  </div>
                  <StatusBadge label={`${c.count} entries`} variant="info" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── SYNC ACTIVITY LOG ── */}
      <Card className="bg-slate-900 border-slate-800 rounded-2xl overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-slate-800 flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <CardTitle className="text-sm font-black text-white">Sync Activity Log</CardTitle>
          </div>
          {syncLog.length > 0 && (
            <button
              onClick={() => setSyncLog([])}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Clear
            </button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {syncLog.length === 0 ? (
            <div className="p-6 text-center text-slate-700 text-xs font-medium">
              No sync activity recorded this session.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
              {syncLog.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className="text-xs text-slate-700 font-mono shrink-0 mt-0.5 w-16">
                    {entry.ts}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      entry.type === "success"
                        ? "bg-green-500"
                        : entry.type === "error"
                        ? "bg-red-500"
                        : entry.type === "warning"
                        ? "bg-amber-400"
                        : "bg-blue-500"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      entry.type === "success"
                        ? "text-green-400"
                        : entry.type === "error"
                        ? "text-red-400"
                        : entry.type === "warning"
                        ? "text-amber-400"
                        : "text-slate-400"
                    }`}
                  >
                    {entry.msg}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
