// Municipal collection timetable (the CMC publishes this; there is no schedule table in the database).
import { Truck, Leaf, Recycle, Cpu } from "lucide-react"

export const SCHEDULE_DATA = {
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

export function getNextPickup(schedule) {
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
