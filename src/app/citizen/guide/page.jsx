"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Leaf, Package, Cpu, CheckCircle2, XCircle, ChevronDown } from "lucide-react"

const CATEGORIES = [
  {
    id: "organic",
    label: "Organic",
    tagline: "Green Bin",
    icon: Leaf,
    emoji: "🍎",
    accentBg: "bg-emerald-600",
    cardBg: "bg-emerald-50",
    border: "border-t-emerald-500",
    textAccent: "text-emerald-700",
    textLight: "text-emerald-600",
    badgeBg: "bg-emerald-100 text-emerald-800",
    accepted: [
      "Food scraps & vegetable peels",
      "Fruit waste & rinds",
      "Cooked food leftovers",
      "Garden clippings & leaves",
      "Coffee grounds & tea bags",
      "Eggshells",
      "Small cardboard soaked in food",
    ],
    rejected: [
      "Plastic-lined paper cups",
      "Meat & fish bones (large)",
      "Cooking oil & grease",
      "Diseased plant material",
    ],
    tip: "Wrap organic waste in newspaper before placing in the green bin to absorb moisture and reduce odour.",
  },
  {
    id: "plastic",
    label: "Plastic",
    tagline: "Blue Bin",
    icon: Package,
    emoji: "🥤",
    accentBg: "bg-blue-600",
    cardBg: "bg-blue-50",
    border: "border-t-blue-500",
    textAccent: "text-blue-700",
    textLight: "text-blue-600",
    badgeBg: "bg-blue-100 text-blue-800",
    accepted: [
      "Clean PET water & soda bottles",
      "HDPE milk & detergent containers",
      "Clean plastic bags (bundled)",
      "Polystyrene foam (clean)",
      "Yoghurt & margarine tubs",
      "Clear food packaging",
      "Straws & cutlery (clean)",
    ],
    rejected: [
      "Contaminated / food-soiled plastic",
      "Bubble wrap with adhesive",
      "Plastic mixed with metal",
      "Medical / biohazard plastic",
    ],
    tip: "Rinse all containers before placing them in the blue bin — food residue contaminates entire batches.",
  },
  {
    id: "ewaste",
    label: "E-Waste",
    tagline: "Red Bin",
    icon: Cpu,
    emoji: "💻",
    accentBg: "bg-red-600",
    cardBg: "bg-red-50",
    border: "border-t-red-500",
    textAccent: "text-red-700",
    textLight: "text-red-600",
    badgeBg: "bg-red-100 text-red-800",
    accepted: [
      "Old mobile phones & chargers",
      "Laptops & desktop computers",
      "Batteries (all types)",
      "CRT / LED monitors",
      "Printers & scanners",
      "Cables & wiring",
      "Fluorescent & LED bulbs",
    ],
    rejected: [
      "Large home appliances (refrigerators, washing machines)",
      "CFC-containing devices without prior clearance",
      "Car batteries (specialist disposal required)",
      "Smoke detectors containing Americium",
    ],
    tip: "Never place batteries in organic or plastic bins — punctured batteries can cause fires in collection trucks.",
  },
]

function AccordionItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-bold text-slate-700">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 bg-slate-50 text-sm text-slate-600 leading-relaxed border-t border-slate-200">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function WasteGuidePage() {
  const [active, setActive] = useState("organic")

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-teal-600" />
          Waste Segregation Guide
        </h1>
        <p className="text-slate-500 mt-1">
          Learn how to separate household waste to reduce landfill and earn ECO rewards.
        </p>
      </div>

      {/* Category tab pills */}
      <div className="flex flex-wrap gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setActive(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all shadow-sm ${
                active === cat.id
                  ? `${cat.accentBg} text-white border-transparent`
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2.5} />
              {cat.label} ({cat.tagline})
            </button>
          )
        })}
      </div>

      {/* Active category card */}
      {CATEGORIES.filter((c) => c.id === active).map((cat) => {
        const Icon = cat.icon
        return (
          <Card key={cat.id} className={`bg-white shadow-sm border-t-4 ${cat.border}`}>
            <CardHeader className={`${cat.cardBg} rounded-t-xl pb-4`}>
              <div className="flex items-center gap-4">
                <div className="text-5xl">{cat.emoji}</div>
                <div>
                  <span className={`text-xs font-black uppercase tracking-widest ${cat.badgeBg} px-2 py-0.5 rounded-full`}>
                    {cat.tagline}
                  </span>
                  <CardTitle className={`text-2xl font-black ${cat.textAccent} mt-1`}>
                    {cat.label} Waste
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Accepted */}
                <div>
                  <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Accepted Items
                  </h3>
                  <ul className="space-y-2">
                    {cat.accepted.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Rejected */}
                <div>
                  <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Not Accepted
                  </h3>
                  <ul className="space-y-2">
                    {cat.rejected.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-500">
                        <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tip */}
              <div className={`${cat.cardBg} border ${cat.border.replace("border-t-", "border-")} rounded-xl p-4 flex items-start gap-3`}>
                <span className="text-xl shrink-0">💡</span>
                <p className={`text-sm font-medium ${cat.textAccent}`}>{cat.tip}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Quick overview cards */}
      <div>
        <h2 className="text-xl font-black text-slate-800 mb-4">Quick Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`${cat.cardBg} border rounded-2xl p-5 text-left hover:shadow-md transition-all group`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${cat.accentBg} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className={`font-black ${cat.textAccent}`}>{cat.label}</p>
                    <p className="text-xs text-slate-500">{cat.tagline}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {cat.accepted.slice(0, 3).join(", ")}…
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-xl font-black text-slate-800 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          <AccordionItem
            question="What happens if I put the wrong waste in a bin?"
            answer="Incorrect waste can contaminate entire batches, sending otherwise recyclable materials to landfill. CMC collectors may also refuse to collect a bin flagged as contaminated. Repeated violations may result in a civic notice."
          />
          <AccordionItem
            question="How do I dispose of cooking oil?"
            answer="Never pour cooking oil down the drain. Let it solidify, seal it in a container, and place it in the general waste (non-recyclable) bag. Large quantities should be taken to a CMC designated waste oil collection point."
          />
          <AccordionItem
            question="When is E-Waste collected?"
            answer="E-Waste collections are on a monthly basis and require prior registration via the CMC hotline (+94 11 269 4229). Check the Schedule page for your zone's specific date."
          />
          <AccordionItem
            question="Can I earn ECO tokens for correct segregation?"
            answer="Currently ECO tokens are rewarded for reporting civic issues. Future updates will include photo-verified segregation rewards via the EcoRoute mobile app."
          />
        </div>
      </div>
    </div>
  )
}
