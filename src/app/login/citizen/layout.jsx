import RegisterSW from "@/components/RegisterSW"

// Login pages link the citizen manifest so the app can be installed straight from sign-in.
export const metadata = {
  title: "EcoRoute Citizen — Sign in",
  applicationName: "EcoRoute Citizen",
  manifest: "/manifest-citizen.json",
  icons: { icon: "/icons/citizen-192.png", apple: "/icons/citizen-180.png" },
  appleWebApp: { capable: true, title: "EcoRoute Citizen", statusBarStyle: "default" },
}

export const viewport = { themeColor: "#00A878" }

export default function CitizenLoginLayout({ children }) {
  return (
    <>
      <RegisterSW />
      {children}
    </>
  )
}
