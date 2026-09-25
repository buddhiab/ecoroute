import DriverShell from "./DriverShell"
import RegisterSW from "@/components/RegisterSW"

export const metadata = {
  title: "EcoRoute Driver",
  applicationName: "EcoRoute Driver",
  description: "EcoRoute field app for waste collection drivers — tasks, live GPS and offline sync.",
  manifest: "/manifest-driver.json",
  icons: { icon: "/icons/driver-192.png", apple: "/icons/driver-180.png" },
  appleWebApp: { capable: true, title: "EcoRoute Driver", statusBarStyle: "black-translucent" },
}

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function DriverLayout({ children }) {
  return (
    <>
      <RegisterSW />
      <DriverShell>{children}</DriverShell>
    </>
  )
}
