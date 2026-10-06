import type { Metadata, Viewport } from "next"
import { Literata, Nunito } from "next/font/google"

import { AppProviders } from "@/app/providers"
import { APP_DESCRIPTION, APP_NAME, THEME_COLOR } from "@/shared/config/app"

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
  themeColor: THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "light",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${nunito.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
