"use client"

import { useEffect, useState } from "react"
import { Download, Share } from "lucide-react"

// Shows an install button where the browser supports it (Android/desktop Chrome),
// and an "Add to Home Screen" hint on iPhone/iPad. Hidden once the app is installed.
export default function InstallAppButton({ appName, className = "" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
    setInstalled(standalone)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (installed) return null

  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={async () => {
          deferredPrompt.prompt()
          await deferredPrompt.userChoice
          setDeferredPrompt(null)
        }}
        className={`w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors ${className}`}
      >
        <Download className="w-4 h-4" />
        Install {appName} app
      </button>
    )
  }

  if (isIOS) {
    return (
      <p className={`flex items-center justify-center gap-1.5 text-xs text-slate-500 text-center ${className}`}>
        <Share className="w-3.5 h-3.5 shrink-0" />
        To install {appName}: tap Share, then &quot;Add to Home Screen&quot;.
      </p>
    )
  }

  return null
}
