"use client"

import Link from "next/link"
import { WifiOff, RefreshCcw, Home } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-10 h-10 text-slate-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-slate-800 mb-2">You are offline</h1>
      <p className="text-slate-500 max-w-sm mb-8">
        It looks like you&apos;ve lost your internet connection. Don&apos;t worry, the EcoRoute Driver App still works offline!
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button 
          onClick={() => window.location.reload()}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" /> Try Again
        </button>
        
        <Link 
          href="/driver"
          className="w-full h-12 border border-slate-200 text-slate-700 bg-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" /> Go to Offline Dashboard
        </Link>
      </div>
    </div>
  )
}
