"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Clock, Truck, Leaf, Recycle, Cpu, MapPin } from "lucide-react"

const SCHEDULE_DATA = {
  "Colombo 03": [
    { day: "Monday", time: "07:00 AM", type: "Organic", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { day: "Wednesday", time: "09:00 AM", type: "Recyclable", icon: Recycle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { day: "Friday", time: "07:00 AM", type: "General Waste", icon: Truck, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
    { day: "2nd Saturday", time: "08:00 AM", type: "E-Waste", icon: Cpu, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  ],
  "Colombo 04": [
    { day: "Tuesday", time: "07:30 AM", type: "Organic", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { day: "Thursday", time: "09:00 AM", type: "Recyclable", icon: Recycle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { day: "Saturday", time: "07:30 AM", type: "General Waste", icon: Truck, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
    { day: "Last Friday", time: "10:00 AM", type: "E-Waste", icon: Cpu, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  ],
  "Colombo 05": [
    { day: "Monday", time: "07:30 AM", type: "Organic", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { day: "Wednesday", time: "08:30 AM", type: "Recyclable", icon: Recycle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { day: "Friday", time: "07:30 AM", type: "General Waste", icon: Truck, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
    { day: "1st Saturday", time: "09:00 AM", type: "E-Waste", icon: Cpu, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  ],
  "Colombo 07": [
    { day: "Tuesday", time: "08:00 AM", type: "Organic", icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
    { day: "Thursday", time: "10:00 AM", type: "Recyclable", icon: Recycle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { day: "Saturday", time: "08:00 AM", type: "General Waste", icon: Truck, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
    { day: "3rd Wednesday", time: "11:00 AM", type: "E-Waste", icon: Cpu, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  ],
}

function getNextPickup(schedule) {
  if (!schedule || schedule.length === 0) return { label: "N/A", time: "N/A", type: "N/A" };

  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let nextSlot = null;
  let minDaysDiff = Infinity;

  for (const slot of schedule) {
    const match = slot.day.match(/(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/);
    if (!match) continue;

    const slotDayName = match[1];
    const slotDayIndex = days.indexOf(slotDayName);

    let daysDiff = (slotDayIndex - currentDayIndex + 7) % 7;

    if (daysDiff === 0) {
      const isPM = slot.time.includes("PM");
      let [timePart] = slot.time.split(" ");
      let [hourStr, minStr] = timePart.split(":");
      let hour = parseInt(hourStr, 10);
      const min = parseInt(minStr, 10);
      
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;

      if (currentHour > hour || (currentHour === hour && currentMinute >= min)) {
        daysDiff = 7;
      }
    }

    if (daysDiff < minDaysDiff) {
      minDaysDiff = daysDiff;
      nextSlot = slot;
    }
  }

  if (!nextSlot) return { label: "N/A", time: "N/A", type: "N/A" };

  const slotDayName = nextSlot.day.match(/(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/)[1];
  let label = slotDayName;
  if (minDaysDiff === 0) label = `Today — ${slotDayName}`;
  else if (minDaysDiff === 1) label = `Tomorrow — ${slotDayName}`;
  
  return {
    label,
    time: nextSlot.time,
    type: nextSlot.type
  };
}

export default function SchedulePage() {
  const [selectedZone, setSelectedZone] = useState("Colombo 05")
  const schedule = SCHEDULE_DATA[selectedZone]
  const next = getNextPickup(schedule)

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto w-full space-y-7">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-8 h-8 text-emerald-600" />
          Collection Schedule
        </h1>
        <p className="text-slate-500 mt-1">
          Select your municipal zone to view upcoming waste collection times.
        </p>
      </div>

      {/* Zone Selector */}
      <div className="flex flex-wrap gap-3">
        {Object.keys(SCHEDULE_DATA).map((zone) => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-all ${
              selectedZone === zone
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {zone}
          </button>
        ))}
      </div>

      {/* Next Pickup Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">
          Next Pickup — {selectedZone}
        </p>
        <p className="text-4xl font-black mt-1">{next.label}</p>
        <p className="text-emerald-100 mt-2 flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4" />
          {next.time} &nbsp;·&nbsp; {next.type} Collection
        </p>
      </div>

      {/* Schedule Grid */}
      <Card className="bg-white shadow-sm border-t-4 border-t-emerald-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-slate-800">
            Weekly Schedule — {selectedZone}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {schedule.map((slot) => {
            const Icon = slot.icon
            return (
              <div
                key={slot.day + slot.type}
                className={`flex items-center gap-4 p-4 rounded-xl border ${slot.bg}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm`}>
                  <Icon className={`w-5 h-5 ${slot.color}`} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${slot.color}`}>{slot.type}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Every {slot.day}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-700">{slot.time}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedZone}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Preparation tips */}
      <Card className="bg-slate-800 text-white shadow-sm border-0">
        <CardContent className="p-5">
          <h3 className="font-black text-base mb-3">📋 Preparation Tips</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              Place bins on the kerb by <strong className="text-white">6:30 AM</strong> on collection days.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              Ensure waste is segregated into organic (green), recyclable (blue), and general bags.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              E-Waste collections require prior registration — call the CMC hotline: <strong className="text-white">+94 11 269 4229</strong>.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              Missed a pickup? <a href="/citizen/report" className="text-emerald-400 underline font-bold">Submit a report</a> to earn ECO tokens.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
