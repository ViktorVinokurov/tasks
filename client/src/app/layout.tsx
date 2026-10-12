import type { Metadata, Viewport } from "next"
import { Literata, Nunito } from "next/font/google"

import { AppProviders } from "@/app/providers"
import { THEME_BOOT } from "@/features/switch-theme/model/theme"
import { APP_DESCRIPTION, APP_NAME } from "@/shared/config/app"
import { LiquidBackdrop } from "@/shared/ui/liquid-backdrop"

import "./globals.css"

const nunito = Nunito({
  subsets: ["latin", "cyrillic"],
  variable: "--font-nunito",
})

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  variable: "--font-literata",
})

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1ea" },
    { media: "(prefers-color-scheme: dark)", color: "#221e1b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "light dark",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${literata.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="isolate min-h-full font-sans text-foreground">
        <LiquidBackdrop />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
