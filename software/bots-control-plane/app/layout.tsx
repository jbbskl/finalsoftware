import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import { UserProvider } from "@/contexts/user-context"
import NextAuthSessionProvider from "@/components/providers/session-provider"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Bots Control Plane",
  description: "Manage and monitor your automation bots",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <NextAuthSessionProvider>
          <UserProvider>
            <Suspense fallback={null}>{children}</Suspense>
            <Toaster />
          </UserProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  )
}
