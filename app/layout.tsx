import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { Toaster } from "sonner"
import { MigrationLoader } from "@/components/MigrationLoader"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dreamium - AI-Powered Dream Insight Lab",
  description: "Unlock the mysteries of your dreams with advanced AI analysis. Discover hidden meanings, psychological insights, and scientific interpretations of your subconscious mind.",
  generator: "Next.js",
  keywords: ["dream analysis", "AI", "psychology", "subconscious", "dream interpretation", "neural networks"],
  authors: [{ name: "Dreamium Team" }],
  openGraph: {
    title: "Dreamium - AI-Powered Dream Insight Lab",
    description: "Unlock the mysteries of your dreams with advanced AI analysis",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <MigrationLoader />
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  )
}
