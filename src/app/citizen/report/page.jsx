"use client"

import { useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { getContractSigner } from "@/lib/web3"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ClipboardList, Zap, CheckCircle2, AlertTriangle, Loader2, MapPin, Image as ImageIcon } from "lucide-react"
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api"
import { v4 as uuidv4 } from "uuid"

const ZONES = ["Colombo 03", "Colombo 04", "Colombo 05", "Colombo 07"]

const ISSUE_TYPES = [
  "Missed Garbage Pickup",
  "Overflowing Public Bin",
  "Illegal Dumping Spotted",
  "Request E-Waste Collection",
  "Broken Bin / Container Damage",
  "Animal Interference with Waste",
]

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "0.5rem",
}

const defaultCenter = {
  lat: 6.9271,
  lng: 79.8612, // Colombo, Sri Lanka
}

function StatusBanner({ message }) {
  if (!message) return null
  const isError = message.startsWith("❌")
  const isWarning = message.startsWith("⚠️")
  const isPending = message.startsWith("⏳")
  const isSuccess = message.startsWith("🎉")

  const styles = isError || isWarning
    ? "bg-red-50 text-red-700 border-red-200"
    : isPending
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : isSuccess
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-blue-50 text-blue-700 border-blue-200"

  return (
    <div
      className={`p-4 rounded-xl text-sm font-semibold border text-center animate-in fade-in slide-in-from-bottom-2 duration-300 ${styles}`}
    >
      {message}
    </div>
  )
}

export default function ReportIssuePage() {
  const [zone, setZone] = useState("Colombo 05")
  const [issueType, setIssueType] = useState("Missed Garbage Pickup")
  const [description, setDescription] = useState("")
  const [exactAddress, setExactAddress] = useState("")
  const [markerPos, setMarkerPos] = useState(defaultCenter)
  const [imageFile, setImageFile] = useState(null)
  
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const mapRef = useRef()

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

  const onMapLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  const handleMapClick = useCallback((e) => {
    setMarkerPos({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    })
  }, [])

  const handleMarkerDragEnd = useCallback((e) => {
    setMarkerPos({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!exactAddress.trim()) {
      setStatus("❌ Please provide the exact address.")
      setTimeout(() => setStatus(null), 6000)
      return
    }

    setIsSubmitting(true)
    setStatus("⏳ Saving your report to the database…")

    // 1. Fetch current user to link the report
    const { data: { user } } = await supabase.auth.getUser()

    // 1.5 Upload image if selected
    let uploadedImageUrl = null
    if (imageFile) {
      setStatus("⏳ Uploading photo…")
      const fileExt = imageFile.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${user?.id || "anon"}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("citizen_reports")
        .upload(filePath, imageFile)

      if (uploadError) {
        console.error("Upload error:", uploadError)
        setStatus("❌ Failed to upload image. Try again without a photo.")
        setIsSubmitting(false)
        setTimeout(() => setStatus(null), 6000)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from("citizen_reports")
        .getPublicUrl(filePath)
      
      uploadedImageUrl = publicUrlData.publicUrl
      setStatus("⏳ Saving your report to the database…")
    }

    // 2. Insert into Supabase with user_id and image_url
    const { error: dbError } = await supabase.from("CitizenReports").insert([
      {
        user_id: user?.id ?? null,
        zone,
        issue_type: issueType,
        description,
        exact_address: exactAddress,
        latitude: markerPos.lat,
        longitude: markerPos.lng,
        image_url: uploadedImageUrl,
        status: "Pending",
      },
    ])

    if (dbError) {
      console.error("Supabase error:", dbError)
      setStatus("❌ Failed to submit report. Check your connection and try again.")
      setIsSubmitting(false)
      setTimeout(() => setStatus(null), 6000)
      return
    }

    // 3. Trigger server-side token reward (owner wallet signs server-side)
    try {
      setStatus("⏳ Report saved! Getting your wallet address to claim reward…")
      const { signer } = await getContractSigner()
      const citizenAddress = await signer.getAddress()

      setStatus("⏳ Sending token reward to your wallet…")
      const res = await fetch("/api/reward-citizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenAddress }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Reward failed")

      setStatus("🎉 Success! Report submitted & 10 ECO tokens rewarded to your wallet.")
      setDescription("")
      setExactAddress("")
      setMarkerPos(defaultCenter)
      setSubmitted(true)
    } catch (web3Err) {
      console.error("Reward error:", web3Err)
      const msg = web3Err?.message ?? "Unknown error"
      setStatus(`⚠️ Report saved, but token reward failed: ${msg}`)
    }

    setIsSubmitting(false)
    setTimeout(() => setStatus(null), 10000)
  }

  const resetForm = () => {
    setSubmitted(false)
    setZone("Colombo 05")
    setIssueType("Missed Garbage Pickup")
    setDescription("")
    setExactAddress("")
    setMarkerPos(defaultCenter)
    setImageFile(null)
    setStatus(null)
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto w-full space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-8 h-8 text-orange-500" />
          Report an Issue
        </h1>
        <p className="text-slate-500 mt-1">
          Submit a municipal issue and earn <strong>10 ECO tokens</strong> upon successful verification.
        </p>
      </div>

      {/* Reward info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" strokeWidth={2.5} />
        <div>
          <p className="text-sm font-bold text-amber-800">Earn ECO Tokens</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Every verified report rewards you with <strong>10 ECO</strong> tokens directly to your
            MetaMask wallet via the EcoRoute smart contract on Sepolia.
          </p>
        </div>
      </div>

      {/* Success state */}
      {submitted ? (
        <Card className="bg-white shadow-sm border-t-4 border-t-emerald-500">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-black text-slate-800">Report Submitted!</h2>
            <p className="text-slate-500 text-sm">
              Your civic report has been logged and tokens have been dispatched to your wallet.
            </p>
            <Button
              onClick={resetForm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 mt-2"
            >
              Submit Another Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white shadow-sm border-t-4 border-t-orange-500">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800">Issue Details</CardTitle>
            <CardDescription>
              All fields are required. Pinpoint the exact location on the map.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Zone */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700" htmlFor="zone-select">
                  Municipal Zone
                </label>
                <select
                  id="zone-select"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              {/* Exact Address */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700" htmlFor="address-input">
                  Exact Address / Landmark
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="address-input"
                    type="text"
                    value={exactAddress}
                    onChange={(e) => setExactAddress(e.target.value)}
                    placeholder="e.g. In front of 124 Galle Road"
                    required
                    className="w-full p-3 pl-9 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                  />
                </div>
              </div>

              {/* Interactive Map */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  Pinpoint Location on Map
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Click on the map or drag the pin to set the exact coordinates for the collection team.
                </p>
                <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  {loadError ? (
                    <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
                      Error loading Google Maps.
                    </div>
                  ) : !isLoaded ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                      Loading map...
                    </div>
                  ) : (
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      zoom={14}
                      center={defaultCenter}
                      onClick={handleMapClick}
                      onLoad={onMapLoad}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                      }}
                    >
                      <Marker
                        position={markerPos}
                        draggable={true}
                        onDragEnd={handleMarkerDragEnd}
                        animation={window.google.maps.Animation.DROP}
                      />
                    </GoogleMap>
                  )}
                </div>
              </div>

              {/* Issue Type */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700" htmlFor="issue-type-select">
                  Issue Type
                </label>
                <select
                  id="issue-type-select"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700" htmlFor="photo-upload">
                  Upload Photo (Optional)
                </label>
                <div className="relative">
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-orange-50 file:text-orange-700
                      hover:file:bg-orange-100 cursor-pointer
                      border border-slate-300 rounded-lg bg-white p-1"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700" htmlFor="description-input">
                  Additional Details
                </label>
                <textarea
                  id="description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional details or instructions for the driver…"
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium h-24 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all leading-relaxed"
                />
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500">
                  Submitting a report will prompt a MetaMask transaction. Ensure your wallet is
                  connected to <strong>Sepolia testnet</strong> before proceeding.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-sm disabled:opacity-60 transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </span>
                ) : (
                  "Submit Report & Claim Tokens"
                )}
              </Button>

              <StatusBanner message={status} />
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
