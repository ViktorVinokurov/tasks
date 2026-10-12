"use client"

import { AuthScreen } from "@/features/auth"
import { ThemeSwitch } from "@/features/switch-theme"

export function LoginPage() {
  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitch />
      </div>
      <AuthScreen />
    </div>
  )
}
