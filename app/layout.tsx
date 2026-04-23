import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SchoolarD",
  description: "Plateforme de gestion scolaire",
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  )
}
