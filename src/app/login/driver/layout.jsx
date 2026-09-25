import RegisterSW from "@/components/RegisterSW"

// Login pages link the driver manifest so the app can be installed straight from sign-in.
export const metadata = {
  title: "EcoRoute Driver — Sign in",
  applicationName: "EcoRoute Driver",
  manifest: "/manifest-driver.json",
  icons: { icon: "/icons/driver-192.png", apple: "/icons/driver-180.png" },
  appleWebApp: { capable: true, title: "EcoRoute Driver", statusBarStyle: "black-translucent" },
}

export const viewport = { themeColor: "#0f172a" }

export default function DriverLoginLayout({ children }) {
  return (
    <>
      <RegisterSW />
      {children}
    </>
  )
}
