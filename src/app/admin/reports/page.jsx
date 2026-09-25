"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ClipboardList,
  RefreshCw,
  Loader2,
  MapPin,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react"

const ZONES = ["All", "Colombo 03", "Colombo 04", "Colombo 05", "Colombo 07"]
const STATUSES = ["All", "Pending", "In Progress", "Resolved"]

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Resolved: "bg-green-100 text-green-800 border-green-200",
}

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoneFilter, setZoneFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeReport, setActiveReport] = useState(null)
  const [availableDrivers, setAvailableDrivers] = useState([])
  const [selectedDriverId, setSelectedDriverId] = useState("")
  const [driversLoading, setDriversLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("CitizenReports")
      .select("*")
      .order("id", { ascending: false })
    setReports(data ?? [])
    setLoading(false)
  }, [])

  const openAssignModal = async (report) => {
    setActiveReport(report)
    setSelectedDriverId("")
    setAvailableDrivers([])
    setIsModalOpen(true)
    setDriversLoading(true)

    const { data } = await supabase
      .from("driver_profiles")
      .select("id, full_name, vehicle_number")
      .eq("assigned_zone", report.zone)
    
    setAvailableDrivers(data || [])
    setDriversLoading(false)
  }

  const handleAssignTask = async () => {
    if (!activeReport || !selectedDriverId) return;

    const selectedDriver = availableDrivers.find((d) => d.id === selectedDriverId);
    
    const { error } = await supabase
      .from("CitizenReports")
      .update({ 
        assigned_driver_id: selectedDriverId, 
        status: 'In Progress' 
      })
      .eq("id", activeReport.id);

    if (!error) {
      setIsModalOpen(false);
      fetchReports();
      // Send push notification to citizen (if they subscribed)
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: activeReport.id,
          driverName: selectedDriver?.full_name || "Your driver",
        }),
      }).catch(console.error);
    } else {
      alert("Error assigning task");
    }
  }

  useEffect(() => {
    fetchReports()
    const channel = supabase
      .channel("admin-reports-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "CitizenReports" }, (payload) => {
        setReports((prev) => {
          if (payload.eventType === "INSERT") return [payload.new, ...prev]
          if (payload.eventType === "UPDATE") return prev.map((r) => (r.id === payload.new.id ? payload.new : r))
          if (payload.eventType === "DELETE") return prev.filter((r) => r.id !== payload.old.id)
          return prev
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchReports])

  const filtered = reports
    .filter((r) => zoneFilter === "All" || r.zone === zoneFilter)
    .filter((r) => statusFilter === "All" || (r.status ?? "Pending") === statusFilter)

  const pending = reports.filter((r) => (r.status ?? "Pending") === "Pending").length
  const inProgress = reports.filter((r) => r.status === "In Progress").length
  const resolved = reports.filter((r) => r.status === "Resolved").length

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-6xl mx-auto w-full">
      {/* Heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-indigo-600" />
            Citizen Reports
          </h1>
          <p className="text-slate-500 mt-1">All submissions with live status tracking.</p>
        </div>
        <Button
          onClick={fetchReports}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", count: pending, icon: Clock, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "In Progress", count: inProgress, icon: AlertCircle, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
          { label: "Resolved", count: resolved, icon: CheckCircle2, color: "text-green-700", bg: "bg-green-50 border-green-200" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(label)}
            className={`${bg} border rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md ${statusFilter === label ? "ring-2 ring-blue-400" : ""}`}
          >
            <Icon className={`w-7 h-7 ${color}`} strokeWidth={2} />
            <div className="text-left">
              <p className={`text-3xl font-black ${color}`}>{loading ? "—" : count}</p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-500">Zone:</span>
          <div className="flex flex-wrap gap-2">
            {ZONES.map((z) => (
              <button
                key={z}
                onClick={() => setZoneFilter(z)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  zoneFilter === z
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-500 border-slate-200 hover:border-indigo-400"
                }`}
              >
                {z}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold border border-slate-200 bg-white text-slate-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {(zoneFilter !== "All" || statusFilter !== "All") && (
          <button
            onClick={() => { setZoneFilter("All"); setStatusFilter("All") }}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Reports table */}
      <Card className="bg-white shadow-sm border-t-4 border-t-indigo-500">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">📋 All Reports</CardTitle>
          <CardDescription>Real-time Supabase feed — updates automatically on new submissions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  {["ID", "Issue Type", "Zone", "Description", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-4 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                      No reports match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((report) => {
                    const status = report.status ?? "Pending"
                    return (
                      <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-slate-400 text-xs">#{report.id}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{report.issue_type}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {report.zone}
                          </div>
                        </td>
                        <td className="px-5 py-4 max-w-[200px]">
                          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                            {report.description}
                          </p>
                          {report.image_url && (
                            <a 
                              href={report.image_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              View Photo
                            </a>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLES[status] ?? STATUS_STYLES.Pending}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-y-1.5">
                          {status === "Pending" && (
                            <button
                              onClick={() => openAssignModal(report)}
                              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition whitespace-nowrap block ml-auto"
                            >
                              Assign Driver
                            </button>
                          )}
                          {report.assigned_driver_id && (
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/track/${report.id}`;
                                navigator.clipboard.writeText(url).then(() => {
                                  setCopiedId(report.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                });
                              }}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap block ml-auto ${
                                copiedId === report.id
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {copiedId === report.id ? "✓ Copied!" : "📤 Share Tracking Link"}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ASSIGN DRIVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Assign Task to Driver
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Select an available driver in <span className="font-bold text-gray-800">{activeReport?.zone}</span> for Report #{activeReport?.id}.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Drivers
              </label>
              {driversLoading ? (
                <div className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading drivers...
                </div>
              ) : availableDrivers.length === 0 ? (
                <div className="px-4 py-3 border border-red-100 rounded-xl bg-red-50 text-sm text-red-600 font-medium">
                  No drivers currently assigned to this zone.
                </div>
              ) : (
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50 font-medium text-slate-700"
                >
                  <option value="" disabled>-- Select a Driver --</option>
                  {availableDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} ({d.vehicle_number || "Unassigned Vehicle"})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignTask}
                disabled={!selectedDriverId}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dispatch Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
