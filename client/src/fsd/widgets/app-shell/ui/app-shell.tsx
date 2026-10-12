"use client"

import { BookOpen, Folders, ListTodo, SunMedium } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { SessionMenu } from "@/features/auth"
import { ThemeSwitch } from "@/features/switch-theme"
import { cn } from "@/shared/lib/utils"

import { useAppNav } from "../model/use-app-nav"

const ICONS = {
  "/": SunMedium,
  "/tasks": ListTodo,
  "/groups": Folders,
} as const

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const items = useAppNav()

  return (
    <div className="min-h-dvh">
      <header className="glass-panel glass-bar sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <span className="glass glass-tint grid size-10 shrink-0 place-items-center rounded-full transition-transform duration-200 ease-out-soft group-hover:scale-105">
              <BookOpen className="size-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-base leading-5 font-bold">Ежедневник</span>
              <span className="block truncate text-xs leading-4 text-muted-foreground">
                мысли и дела на каждый день
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <DesktopNav items={items} />
            <ThemeSwitch />
            <SessionMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:pb-10">
        <div key={pathname} className="motion-page">
          {children}
        </div>
      </main>
      <nav
        className="glass-panel glass-bar-top fixed inset-x-0 bottom-0 z-30 md:hidden"
        aria-label="Разделы"
      >
        <div className="mx-auto max-w-lg px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <ul className="grid grid-cols-3 gap-1">
            {items.map((item) => {
              const Icon = ICONS[item.href]
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "glass flex h-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs leading-none font-semibold",
                      item.active ? "glass-tint text-primary-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 transition-transform duration-300 ease-out-soft",
                        item.active && "scale-110",
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </div>
  )
}

function DesktopNav({ items }: { items: ReturnType<typeof useAppNav> }) {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Разделы">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "glass rounded-full px-3 py-1.5 text-sm font-semibold",
            item.active ? "glass-tint text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
