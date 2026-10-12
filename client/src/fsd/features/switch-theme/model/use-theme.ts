"use client"

import { useLayoutEffect, useState } from "react"

import { applyTheme, isDarkMode, readTheme, storeTheme, type ThemeMode } from "./theme"

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>("system")
  const [dark, setDark] = useState(false)

  useLayoutEffect(() => {
    const stored = readTheme()
    // Тема лежит в localStorage и недоступна при серверном рендере.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- один раз после монтирования
    setModeState(stored)
    setDark(applyTheme(stored))
  }, [])

  useLayoutEffect(() => {
    if (mode !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => setDark(applyTheme("system"))
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [mode])

  return {
    mode,
    dark,
    setMode(next: ThemeMode) {
      storeTheme(next)
      setModeState(next)
      setDark(isDarkMode(next))
      applyTheme(next)
    },
  }
}
