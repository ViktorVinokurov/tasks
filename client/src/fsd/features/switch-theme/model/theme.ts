export const THEME_KEY = "ezhednevnik-theme"

export type ThemeMode = "system" | "light" | "dark"

export const THEME_BOOT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.toggle("dark",d);root.style.colorScheme=d?"dark":"light";}catch(e){}})();`

export function readTheme(): ThemeMode {
  const value = localStorage.getItem(THEME_KEY)
  if (value === "light" || value === "dark" || value === "system") return value
  return "system"
}

export function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function isDarkMode(mode: ThemeMode) {
  if (mode === "dark") return true
  if (mode === "light") return false
  return prefersDark()
}

export function applyTheme(mode: ThemeMode) {
  const dark = isDarkMode(mode)
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.style.colorScheme = dark ? "dark" : "light"
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", dark ? "#221e1b" : "#f6f1ea")
  return dark
}

export function storeTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_KEY, mode)
}
