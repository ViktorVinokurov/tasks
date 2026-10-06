"use client"

import { Tabs as TabsPrimitive } from "radix-ui"
import { useLayoutEffect, useRef, useState, type ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"

function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({ className, children, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return

    function measure() {
      const active = list?.querySelector<HTMLElement>("[data-state='active']")
      if (!active || active.offsetWidth === 0) return
      const next = {
        left: active.offsetLeft,
        top: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
      }
      setPill((current) => {
        if (
          current &&
          current.left === next.left &&
          current.top === next.top &&
          current.width === next.width &&
          current.height === next.height
        ) {
          return current
        }
        return next
      })
    }

    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(list)
    const mutations = new MutationObserver(measure)
    mutations.observe(list, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    })
    return () => {
      resize.disconnect()
      mutations.disconnect()
    }
  }, [])

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "relative inline-flex w-full items-center gap-1 rounded-2xl bg-muted p-1 text-muted-foreground sm:w-fit",
        className,
      )}
      {...props}
    >
      {pill ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 rounded-xl bg-card shadow-sm transition-[transform,width,height] duration-300 ease-out-soft"
          style={{
            width: pill.width,
            height: pill.height,
            transform: `translate(${pill.left}px, ${pill.top}px)`,
          }}
        />
      ) : null}
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm leading-none font-semibold whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 data-[state=active]:text-foreground sm:flex-none",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn(className)} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
