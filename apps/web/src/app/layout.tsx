import type { Metadata } from "next"
import { Noto_Serif_SC, Outfit } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { AuthProvider } from "@/lib/auth-context"

const display = Noto_Serif_SC({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "900"],
})

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "契约精神",
  description: "对自己守信，才能对他人守信",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="relative z-10 min-h-full flex flex-col text-ink">
        <AuthProvider>
          <Navbar />
          <main className="relative z-10 flex-1 mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
