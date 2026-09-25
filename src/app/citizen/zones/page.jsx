"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { SCHEDULE_DATA, getNextPickup } from "@/lib/schedule"
import { Card, CardContent } from "@/components/ui/card"
import {
  MapPin,
  Truck,
  CalendarDays,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Users,
} from "lucide-react"

const ZONES = [
  {
    id: "colombo-03",
    name: "Colombo 03",
    neighbourhood: "Kollupitiya · Bambalapitiya",    status: "Active",
    accentFrom: "from-emerald-500",
    accentTo: "to-teal-600",
    border: "border-t-emerald-500",
    badgeBg: "bg-emerald-100 text-emerald-800",
    icon: "🌿",
  },
  {
    id: "colombo-04",
    name: "Colombo 04",
    neighbourhood: "Bambalapitiya · Wellawatte",    status: "Active",
    accentFrom: "from-blue-500",
    accentTo: "to-indigo-600",
    border: "border-t-blue-500",
    badgeBg: "bg-blue-100 text-blue-800",
    icon: "🔵",
  },
  {
    id: "colombo-05",
    name: "Colombo 05",
    neighbourhood: "Kirulapone · Havelock Town",    status: "Active",
    accentFrom: "from-amber-500",
    accentTo: "to-orange-600",
    border: "border-t-amber-500",
    badgeBg: "bg-amber-100 text-amber-800",
    icon: "🟡",
  },
  {
    id: "colombo-07",
    name: "Colombo 07",
    neighbourhood: "Cinnamon Gardens · Borella",    status: "Active",
    accentFrom: "from-purple-500",
    accentTo: "to-violet-600",
    border: "border-t-purple-500",
    badgeBg: "bg-purple-100 text-purple-800",
    icon: "🟣",
  },
]

function ResolutionBar({ total, resolved }) {
  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
        <span>Issue Resolution</span>
        <span className="font-black text-slate-700">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ZonesPage() {
  const [zonesState, setZonesState] = useState(() =>
    ZONES.map((z) => ({ ...z, activeRoutes: 0, drivers: [], totalReports: 0, resolvedReports: 0 }))
  )
  const [globalReports, setGlobalReports] = useState(0)
  const [totals, setTotals] = useState({ routes: 0, drivers: 0 })

  useEffect(() => {
    async function fetchData() {
      const [reportsRes, driversRes, routesRes] = await Promise.all([
        supabase.from("CitizenReports").select("zone, status"),
        supabase.from("driver_profiles").select("full_name, assigned_zone").eq("is_approved", true),
        supabase.from("Routes").select("zone, status"),
      ])

      const reports = reportsRes.data ?? []
      const drivers = driversRes.data ?? []
      const routes = routesRes.data ?? []

      setGlobalReports(reports.length)
      setTotals({ routes: routes.length, drivers: drivers.length })

      setZonesState((prev) =>
        prev.map((zone) => {
          const zr = reports.filter((r) => r.zone === zone.name)
          return {
            ...zone,
            totalReports: zr.length,
            resolvedReports: zr.filter((r) => r.status === "Resolved").length,
            activeRoutes: routes.filter((r) => r.zone === zone.name && r.status === "In Progress").length,
            drivers: drivers
              .filter((d) => d.assigned_zone === zone.name)
              .map((d) => d.full_name?.split(" ")[0])
              .filter(Boolean),
          }
        })
      )
    }
    fetchData()
  }, [])

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <MapPin className="w-8 h-8 text-purple-600" />
          Municipal Zones
        </h1>
        <p className="text-slate-500 mt-1">
          Overview of active collection zones managed by the Colombo Municipal Council.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Zones", value: String(ZONES.length), icon: MapPin, color: "text-purple-600" },
          { label: "Total Routes", value: String(totals.routes), icon: Truck, color: "text-blue-600" },
          { label: "Approved Drivers", value: String(totals.drivers), icon: Users, color: "text-emerald-600" },
          { label: "Reports Filed", value: globalReports.toString(), icon: ClipboardList, color: "text-orange-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} strokeWidth={2.5} />
            <p className="text-2xl font-black text-slate-800">{value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {zonesState.map((zone) => {
          const resolutionPct =
            zone.totalReports > 0
              ? Math.round((zone.resolvedReports / zone.totalReports) * 100)
              : 0
          const next = getNextPickup(SCHEDULE_DATA[zone.name])
          return (
            <Card
              key={zone.id}
              className={`bg-white shadow-sm border-t-4 ${zone.border} hover:shadow-lg transition-shadow duration-200`}
            >
              {/* Card header gradient strip */}
              <div
                className={`bg-gradient-to-r ${zone.accentFrom} ${zone.accentTo} px-6 py-4 rounded-t-xl`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${zone.badgeBg}`}
                      >
                        {zone.status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{zone.name}</h2>
                    <p className="text-sm text-white/80 mt-0.5">{zone.neighbourhood}</p>
                  </div>
                  <span className="text-4xl select-none">{zone.icon}</span>
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <Truck className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-slate-800">{zone.activeRoutes}</p>
                    <p className="text-xs text-slate-400 font-medium">Routes</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-slate-800">{zone.resolvedReports}</p>
                    <p className="text-xs text-slate-400 font-medium">Resolved</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-slate-800">{zone.drivers.length}</p>
                    <p className="text-xs text-slate-400 font-medium">Drivers</p>
                  </div>
                </div>

                {/* Resolution bar */}
                <ResolutionBar total={zone.totalReports} resolved={zone.resolvedReports} />

                {/* Next pickup */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Next Pickup</p>
                    <p className="text-sm font-black text-slate-800">
                      {next.label} · {next.time}
                      <span className="font-medium text-slate-500"> · {next.type}</span>
                    </p>
                  </div>
                </div>

                {/* Drivers list */}
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">Assigned Drivers</p>
                  <div className="flex flex-wrap gap-2">
                    {zone.drivers.length === 0 && (<span className="text-xs text-slate-400">None assigned yet</span>)}
                    {zone.drivers.map((driver) => (
                      <span
                        key={driver}
                        className="text-xs bg-white border border-slate-200 text-slate-600 font-semibold px-2.5 py-1 rounded-full"
                      >
                        {driver}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex gap-3 pt-1">
                  <Link
                    href="/citizen/schedule"
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl py-2.5 transition-colors"
                  >
                    <CalendarDays className="w-4 h-4" />
                    Schedule
                  </Link>
                  <Link
                    href="/citizen/report"
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 transition-colors"
                  >
                    Report Issue
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
