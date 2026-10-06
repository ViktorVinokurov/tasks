"use client"

import { BookOpen, Folders, ListTodo, SunMedium } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLayoutEffect, useRef, useState, type ReactNode } from "react"

import { SessionMenu } from "@/features/auth"
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
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.active),
  )

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="group flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform duration-300 ease-out-soft group-hover:scale-105">
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
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-card/95 backdrop-blur md:hidden"
        aria-label="Разделы"
      >
        <div className="relative mx-auto max-w-lg px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-2 w-[calc((100%-1rem)/3)] rounded-2xl bg-primary/10 transition-transform duration-300 ease-out-soft"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          <ul className="relative grid grid-cols-3">
            {items.map((item) => {
              const Icon = ICONS[item.href]
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "flex h-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs leading-none font-semibold transition-colors duration-200",
                      item.active ? "text-primary" : "text-muted-foreground",
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
  const listRef = useRef<HTMLElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)
  const activeHref = items.find((item) => item.active)?.href ?? "/"

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    function measure() {
      const active = list?.querySelector<HTMLElement>("[aria-current='page']")
      if (!active || active.offsetWidth === 0) return
      const next = { left: active.offsetLeft, width: active.offsetWidth }
      setPill((current) => {
        if (current && current.left === next.left && current.width === next.width) return current
        return next
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [activeHref])

  return (
    <nav ref={listRef} className="relative hidden items-center md:flex" aria-label="Разделы">
      {pill ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-full rounded-full bg-primary transition-[transform,width] duration-300 ease-out-soft"
          style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
        />
      ) : null}
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "relative z-10 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-200",
            item.active
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
