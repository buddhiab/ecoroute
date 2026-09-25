import CitizenShell from "./CitizenShell"
import RegisterSW from "@/components/RegisterSW"

export const metadata = {
  title: "EcoRoute Citizen",
  applicationName: "EcoRoute Citizen",
  description: "EcoRoute citizen app — report waste issues, track pickups and earn ECO tokens.",
  manifest: "/manifest-citizen.json",
  icons: { icon: "/icons/citizen-192.png", apple: "/icons/citizen-180.png" },
  appleWebApp: { capable: true, title: "EcoRoute Citizen", statusBarStyle: "default" },
}

export const viewport = {
  themeColor: "#00A878",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function CitizenLayout({ children }) {
  return (
    <>
      <RegisterSW />
      <CitizenShell>{children}</CitizenShell>
    </>
  )
}
