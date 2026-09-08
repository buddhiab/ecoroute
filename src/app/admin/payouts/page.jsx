"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Landmark,
  RefreshCw,
  Loader2,
  Wallet,
  Coins,
  Clock,
  CheckCircle2,
  DollarSign,
} from "lucide-react"

const STATUS_STYLES = {
  "Pending Transfer": "bg-amber-100 text-amber-800 border-amber-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Processing: "bg-blue-100 text-blue-800 border-blue-200",
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("BankPayouts")
      .select("*")
      .order("id", { ascending: false })
    setPayouts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPayouts()
    const channel = supabase
      .channel("admin-payouts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "BankPayouts" }, (payload) => {
        setPayouts((prev) => {
          if (payload.eventType === "INSERT") return [payload.new, ...prev]
          if (payload.eventType === "UPDATE") return prev.map((p) => (p.id === payload.new.id ? payload.new : p))
          if (payload.eventType === "DELETE") return prev.filter((p) => p.id !== payload.old.id)
          return prev
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchPayouts])

  // Aggregates
  const totalLKR = payouts.reduce((acc, p) => acc + Number(p.lkr_amount || 0), 0)
  const totalECO = payouts.reduce((acc, p) => acc + Number(p.eco_burned || 0), 0)
  const pendingCount = payouts.filter((p) => (p.status ?? "Pending Transfer") === "Pending Transfer").length
  const completedCount = payouts.filter((p) => p.status === "Completed").length

  return (
    <div className="p-6 md:p-8 space-y-7 max-w-6xl mx-auto w-full">
      {/* Heading */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Landmark className="w-7 h-7 text-emerald-600" />
            Municipal Payouts
          </h1>
          <p className="text-slate-500 mt-1">Review and manage citizen ECO-to-LKR bank transfer requests.</p>
        </div>
        <Button
          onClick={fetchPayouts}
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
          { label: "Total Requests", value: payouts.length, icon: Landmark, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
          { label: "Pending Transfer", value: pendingCount, icon: Clock, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
          { label: "Total LKR Out", value: `Rs. ${totalLKR.toLocaleString()}`, icon: DollarSign, color: "text-green-700", bg: "bg-green-50 border-green-200" },
          { label: "Total ECO Burned", value: `${totalECO} ECO`, icon: Coins, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border rounded-2xl p-5 flex items-center gap-3`}>
            <Icon className={`w-6 h-6 ${color} shrink-0`} strokeWidth={2} />
            <div>
              <p className={`text-xl font-black ${color} leading-tight`}>{loading ? "—" : value}</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payouts table */}
      <Card className="bg-white shadow-sm border-t-4 border-t-emerald-500">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">🏦 Payout Requests</CardTitle>
          <CardDescription>
            All citizen direct bank transfer requests from ECO token conversions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  {[
                    "Req ID",
                    "Account Holder",
                    "Wallet",
                    "Bank",
                    "Account No.",
                    "LKR Amount",
                    "ECO Burned",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="px-4 py-4 font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((__, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : payouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-medium">
                      No payout requests recorded yet.
                    </td>
                  </tr>
                ) : (
                  payouts.map((payout) => {
                    const status = payout.status ?? "Pending Transfer"
                    return (
                      <tr key={payout.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-slate-500 font-mono text-xs">
                          #{payout.id}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-800 whitespace-nowrap">
                          {payout.account_name}
                        </td>
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono text-xs text-slate-500">
                              {payout.wallet_address
                                ? `${payout.wallet_address.slice(0, 6)}…${payout.wallet_address.slice(-4)}`
                                : "N/A"}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-700 whitespace-nowrap">
                          {payout.bank_name}
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-600">{payout.account_number}</td>
                        <td className="px-4 py-4 font-black text-green-700 whitespace-nowrap">
                          Rs. {Number(payout.lkr_amount || 0).toLocaleString()} LKR
                        </td>
                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1 font-semibold text-blue-600">
                            <Coins className="w-3.5 h-3.5 shrink-0" />
                            {payout.eco_burned} ECO
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border whitespace-nowrap ${
                              STATUS_STYLES[status] ?? STATUS_STYLES["Pending Transfer"]
                            }`}
                          >
                            {status}
                          </span>
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
    </div>
  )
}
