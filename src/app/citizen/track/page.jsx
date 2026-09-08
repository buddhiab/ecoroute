"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Truck, Navigation, Clock, CheckCircle2, Loader2, MapPin, ClipboardList } from "lucide-react";

const STATUS_CONFIG = {
  Pending: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
    label: "Pending",
  },
  "In Progress": {
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    label: "In Progress",
  },
  Resolved: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
    label: "Resolved",
  },
};

export default function CitizenTrackPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("CitizenReports")
        .select("id, issue_type, zone, status, assigned_driver_id, description, created_at")
        .order("id", { ascending: false })
        .limit(20);
      setReports(data ?? []);
      setIsLoading(false);
    };

    fetchReports();

    // Real-time updates — if admin assigns a driver, the card updates live
    const channel = supabase
      .channel(`citizen-track-reports-${Math.random()}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "CitizenReports" },
        (payload) => {
          setReports((prev) =>
            prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r))
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const activeReports = reports.filter(
    (r) => r.assigned_driver_id && r.status === "In Progress"
  );
  const otherReports = reports.filter(
    (r) => !activeReports.find((a) => a.id === r.id)
  );

  return (
    <div className="p-5 md:p-7 space-y-7 max-w-3xl mx-auto w-full">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-600" />
          Track Your Driver
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Live updates on reports with an assigned driver.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Active — driver assigned and in progress */}
          {activeReports.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Driver En Route
              </p>
              {activeReports.map((report) => (
                <div
                  key={report.id}
                  className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-lg shadow-blue-500/20"
                >
                  <div className="absolute inset-0 bg-white/5" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <p className="text-white font-bold text-sm">On The Way</p>
                        </div>
                        <p className="text-blue-200 text-xs">
                          #{report.id} · {report.issue_type}
                        </p>
                        <p className="text-blue-200/70 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" /> {report.zone}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/track/${report.id}`}
                      className="shrink-0 flex items-center gap-1.5 bg-white text-blue-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:bg-blue-50 transition-colors whitespace-nowrap"
                    >
                      <Navigation className="w-4 h-4" />
                      Track Live
                    </Link>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* All other reports */}
          {otherReports.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Other Reports
              </p>
              {otherReports.map((report) => {
                const sc = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.Pending;
                const hasDriver = !!report.assigned_driver_id;
                return (
                  <div
                    key={report.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">
                          #{report.id} · {report.issue_type}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sc.cls}`}
                        >
                          {sc.icon}
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" /> {report.zone}
                      </p>
                    </div>

                    {/* Link only if driver is assigned (even if resolved) */}
                    {hasDriver ? (
                      <Link
                        href={`/track/${report.id}`}
                        className="shrink-0 flex items-center gap-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 font-bold text-xs px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        View Map
                      </Link>
                    ) : (
                      <span className="shrink-0 text-xs text-slate-400 font-medium">
                        No driver yet
                      </span>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Empty state */}
          {reports.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Truck className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No reports yet</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
                Once you submit a report and a driver is assigned, you can track them live here.
              </p>
              <Link
                href="/citizen/report"
                className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-[#00A878] hover:text-[#009468] transition-colors"
              >
                Submit a report →
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
