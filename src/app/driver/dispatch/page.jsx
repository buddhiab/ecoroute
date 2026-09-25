"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, MapPin, User, RefreshCw, Loader2, CheckCircle2, Clock } from "lucide-react"

const STATUS_STYLES = {
  Completed: "bg-green-900/40 text-green-300 border-green-700/40",
  "In Progress": "bg-blue-900/40 text-blue-300 border-blue-700/40",
  Pending: "bg-amber-900/40 text-amber-300 border-amber-700/40",
}

export default function FleetDispatchPage() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRoutes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    let driverName = null
    if (user) {
      const { data: profile } = await supabase
        .from("driver_profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single()
      driverName = profile?.full_name ?? null
    }
    if (!driverName) {
      setRoutes([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from("Routes")
      .select("*")
      .eq("driver_name", driverName)
      .order("id", { ascending: true })
    setRoutes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRoutes()
    const channel = supabase
      .channel("dispatch-routes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "Routes" }, fetchRoutes)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchRoutes])

  const active = routes.filter((r) => r.status === "In Progress").length
  const completed = routes.filter((r) => r.status === "Completed").length
  const pending = routes.filter((r) => r.status === "Pending").length

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-green-400" />
            Fleet Dispatch
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Your assigned routes — live status board</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchRoutes() }}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "In Progress", count: active, color: "text-blue-400", bg: "bg-blue-900/20 border-blue-700/30" },
          { label: "Completed", count: completed, color: "text-green-400", bg: "bg-green-900/20 border-green-700/30" },
          { label: "Pending", count: pending, color: "text-amber-400", bg: "bg-amber-900/20 border-amber-700/30" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} border rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-black ${color}`}>{count}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Routes table */}
      <Card className="bg-slate-900 border-slate-800 rounded-2xl overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-slate-800">
          <CardTitle className="text-sm font-black text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-green-400" />
            My Routes ({routes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-bold">Loading routes…</span>
            </div>
          ) : routes.length === 0 ? (
            <div className="py-12 text-center text-slate-600 font-bold">
              No routes assigned to you yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800">
                  <tr>
                    {["ID", "Driver", "Zone", "Status"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {routes.map((route) => (
                    <tr key={route.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-500 font-mono text-xs">#{route.id}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                            <User className="w-3 h-3 text-slate-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-200">{route.driver_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-400">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {route.zone}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[route.status] ?? STATUS_STYLES.Pending}`}>
                          {route.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
