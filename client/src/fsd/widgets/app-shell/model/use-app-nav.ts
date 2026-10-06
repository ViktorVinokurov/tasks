"use client"

import { usePathname } from "next/navigation"

export const NAV_ITEMS = [
  { href: "/", label: "День" },
  { href: "/tasks", label: "Задачи" },
  { href: "/groups", label: "Группы" },
] as const

export function useAppNav() {
  const pathname = usePathname()

  return NAV_ITEMS.map((item) => ({
    ...item,
    active: item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  }))
}
