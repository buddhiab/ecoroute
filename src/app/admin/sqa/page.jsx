"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FlaskConical, RefreshCw, Loader2, MousePointerClick, Timer, Hash, Zap } from "lucide-react"

function SparkBar({ value, max }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-purple-400 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function SQAPage() {
  const [hciLogs, setHciLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("HCILogs")
      .select("*")
      .order("id", { ascending: false })
    setHciLogs(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLogs()
    const channel = supabase
      .channel("admin-sqa-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "HCILogs" }, (payload) => {
        setHciLogs((prev) => {
          if (payload.eventType === "INSERT") return [payload.new, ...prev]
          if (payload.eventType === "UPDATE") return prev.map((l) => (l.id === payload.new.id ? payload.new : l))
          if (payload.eventType === "DELETE") return prev.filter((l) => l.id !== payload.old.id)
          return prev
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchLogs])

  // Computed SQA metrics
  const totalTime = hciLogs.reduce((acc, l) => acc + (l.time_taken || 0), 0)
  const avgMs = hciLogs.length > 0 ? Math.round(totalTime / hciLogs.length) : 0
  const avgSec = Math.round(avgMs / 1000)
  const totalClicks = hciLogs.reduce((acc, l) => acc + (l.clicks || 0), 0)
  const avgClicks = hciLogs.length > 0 ? (totalClicks / hciLogs.length).toFixed(1) : "—"
  const maxTime = Math.max(...hciLogs.map((l) => l.time_taken || 0), 1)
  const maxClicks = Math.max(...hciLogs.map((l) => l.clicks || 0), 1)

  // Task breakdown
  const taskBreakdown = hciLogs.reduce((acc, l) => {
    if (!acc[l.task_name]) acc[l.task_name] = { count: 0, totalTime: 0, totalClicks: 0 }
    acc[l.task_name].count++
    acc[l.task_name].totalTime += l.time_taken || 0
    acc[l.task_name].totalClicks += l.clicks || 0
    return acc
  }, {})

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-6xl mx-auto w-full">
      {/* Heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-7 h-7 text-purple-600" />
            SQA Telemetry
          </h1>
          <p className="text-slate-500 mt-1">HCI usability metrics — cognitive load and interaction speed tracking.</p>
        </div>
        <Button
          onClick={fetchLogs}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: hciLogs.length, icon: Hash, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
          { label: "Avg. Task Time", value: `${avgSec}s`, icon: Timer, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
          { label: "Total Clicks", value: totalClicks, icon: MousePointerClick, color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
          { label: "Avg. Clicks/Task", value: avgClicks, icon: Zap, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border rounded-2xl p-5 flex items-center gap-3`}>
            <Icon className={`w-6 h-6 ${color} shrink-0`} strokeWidth={2} />
            <div>
              <p className={`text-2xl font-black ${color}`}>{loading ? "—" : value}</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Task breakdown */}
      {Object.keys(taskBreakdown).length > 0 && (
        <Card className="bg-white shadow-sm border-t-4 border-t-purple-400">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Task Breakdown</CardTitle>
            <CardDescription>Average performance per tracked action type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                    {["Task Name", "Events", "Avg Time", "Avg Clicks"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {Object.entries(taskBreakdown).map(([name, data]) => (
                    <tr key={name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-purple-700">{name}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{data.count}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {Math.round(data.totalTime / data.count / 1000)}s
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {(data.totalClicks / data.count).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw logs table */}
      <Card className="bg-white shadow-sm border-t-4 border-t-purple-500">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">🔬 Raw HCI Log Stream</CardTitle>
          <CardDescription>Background telemetry tracking UI cognitive load and interaction speeds.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Log ID", "Action Tracked", "Clicks", "Time (ms)", "Time Bar"].map((h) => (
                    <th key={h} className="px-5 py-4 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : hciLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                      No telemetry data recorded yet.
                    </td>
                  </tr>
                ) : (
                  hciLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-400 font-mono text-xs">#{log.id}</td>
                      <td className="px-5 py-4 font-medium text-purple-700">{log.task_name}</td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5">
                          <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
                          {log.clicks}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-700">{log.time_taken} ms</td>
                      <td className="px-5 py-4">
                        <SparkBar value={log.time_taken} max={maxTime} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
