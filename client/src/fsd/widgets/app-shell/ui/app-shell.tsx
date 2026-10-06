"use client"

import { BookOpen, Folders, ListTodo, SunMedium } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

import { useAppNav } from "../model/use-app-nav"

const ICONS = {
  "/": SunMedium,
  "/tasks": ListTodo,
  "/groups": Folders,
} as const

export function AppShell({ children }: { children: ReactNode }) {
  const items = useAppNav()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="size-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-base leading-5 font-bold">Ежедневник</span>
              <span className="block truncate text-xs leading-4 text-muted-foreground">
                мысли и дела на каждый день
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Разделы">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:pb-10">{children}</main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/95 backdrop-blur md:hidden"
        aria-label="Разделы"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-3 px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {items.map((item) => {
            const Icon = ICONS[item.href]
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs leading-none font-semibold",
                    item.active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
