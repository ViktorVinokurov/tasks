"use client"

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

const EXIT_MS = 300
const FLIP_MS = 320
const FLIP_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"

export const popupMotionClass =
  "duration-200 ease-out fill-mode-both data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"

export const dialogMotionClass =
  "duration-200 ease-out fill-mode-both data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-3 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-2"

type MotionItem = {
  id: string
  content: ReactNode
  animateExit?: boolean
}

type Snap = {
  content: ReactNode
  animateExit: boolean
}

type View = {
  order: string[]
  exiting: string[]
  snapshots: Record<string, Snap>
  known: string[]
  rising: string[]
  fresh: string[]
  delays: Record<string, number>
}

function listsEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function snapOf(item: MotionItem): Snap {
  return { content: item.content, animateExit: item.animateExit !== false }
}

function initialView(items: MotionItem[]): View {
  const order = items.map((item) => item.id)
  const snapshots: Record<string, Snap> = {}
  for (const item of items) snapshots[item.id] = snapOf(item)
  return {
    order,
    exiting: [],
    snapshots,
    known: order,
    rising: [],
    fresh: [],
    delays: {},
  }
}

function reconcile(current: View, items: MotionItem[], stagger: number): View {
  const live = items.map((item) => item.id)
  const liveSet = new Set(live)
  const snapshots = { ...current.snapshots }
  for (const item of items) snapshots[item.id] = snapOf(item)

  const exiting = current.exiting.filter((id) => !liveSet.has(id))
  for (const id of current.order) {
    if (liveSet.has(id) || exiting.includes(id)) continue
    if (snapshots[id]?.animateExit === false) {
      delete snapshots[id]
      continue
    }
    exiting.push(id)
  }

  const order = [...live]
  for (const id of exiting) {
    const oldIndex = current.order.indexOf(id)
    const index = oldIndex < 0 ? order.length : Math.min(oldIndex, order.length)
    order.splice(index, 0, id)
  }

  const known = new Set(current.known)
  const fresh = live.filter((id) => !known.has(id))
  for (const id of live) known.add(id)

  const delays = { ...current.delays }
  fresh.forEach((id, index) => {
    delays[id] = Math.min(index, 7) * stagger
  })

  const rising = [
    ...current.rising.filter((id) => order.includes(id)),
    ...fresh.filter((id) => !current.rising.includes(id)),
  ]

  if (
    listsEqual(order, current.order) &&
    listsEqual(exiting, current.exiting) &&
    fresh.length === 0
  ) {
    return current
  }

  return {
    order,
    exiting,
    snapshots,
    known: [...known],
    rising,
    fresh,
    delays,
  }
}

export function MotionList({
  items,
  className,
  itemClassName,
  empty,
  stagger = 36,
}: {
  items: MotionItem[]
  className?: string
  itemClassName?: string
  empty?: ReactNode
  stagger?: number
}) {
  const signature = items.map((item) => item.id).join("\u001f")
  const [previousSignature, setPreviousSignature] = useState(signature)
  const [mirroredItems, setMirroredItems] = useState(items)
  const [view, setView] = useState<View>(() => initialView(items))
  const positions = useRef(new Map<string, DOMRect>())
  const nodes = useRef(new Map<string, HTMLDivElement>())
  const skipFlip = useRef(true)
  const previousExiting = useRef("")

  if (items !== mirroredItems) {
    setMirroredItems(items)
    setView((current) => {
      const snapshots = { ...current.snapshots }
      let changed = false
      for (const item of items) {
        const next = snapOf(item)
        const prev = snapshots[item.id]
        if (!prev || prev.content !== next.content || prev.animateExit !== next.animateExit) {
          snapshots[item.id] = next
          changed = true
        }
      }
      return changed ? { ...current, snapshots } : current
    })
  }

  if (signature !== previousSignature) {
    setPreviousSignature(signature)
    setView((current) => reconcile(current, items, stagger))
  }

  const exitingKey = view.exiting.join("\u001f")
  const orderKey = view.order.join("\u001f")
  const freshKey = view.fresh.join("\u001f")

  useEffect(() => {
    if (!exitingKey) return
    const ids = exitingKey.split("\u001f")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const timer = window.setTimeout(() => {
      setView((current) => {
        const drop = new Set(ids.filter((id) => current.exiting.includes(id)))
        if (drop.size === 0) return current
        const snapshots = { ...current.snapshots }
        const delays = { ...current.delays }
        for (const id of drop) {
          delete snapshots[id]
          delete delays[id]
        }
        return {
          ...current,
          snapshots,
          delays,
          order: current.order.filter((id) => !drop.has(id)),
          exiting: current.exiting.filter((id) => !drop.has(id)),
          rising: current.rising.filter((id) => !drop.has(id)),
          known: current.known.filter((id) => !drop.has(id)),
          fresh: current.fresh.filter((id) => !drop.has(id)),
        }
      })
    }, reduced ? 0 : EXIT_MS)
    return () => window.clearTimeout(timer)
  }, [exitingKey])

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    for (const node of nodes.current.values()) {
      for (const animation of node.getAnimations()) {
        if (animation.id === "motion-flip") animation.cancel()
      }
    }

    const nextPositions = new Map<string, DOMRect>()
    for (const [id, node] of nodes.current) {
      nextPositions.set(id, node.getBoundingClientRect())
    }

    const fresh = new Set(freshKey === "" ? [] : freshKey.split("\u001f"))
    const finishedExit = previousExiting.current !== "" && exitingKey === ""
    const shouldFlip = !skipFlip.current && !reduced && exitingKey === "" && !finishedExit

    if (shouldFlip) {
      for (const [id, node] of nodes.current) {
        if (fresh.has(id)) continue
        const previous = positions.current.get(id)
        const next = nextPositions.get(id)
        if (!previous || !next) continue
        const dx = previous.left - next.left
        const dy = previous.top - next.top
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue
        const animation = node.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: FLIP_MS, easing: FLIP_EASE, fill: "both" },
        )
        animation.id = "motion-flip"
        animation.onfinish = () => animation.cancel()
      }
    }

    if (exitingKey === "") positions.current = nextPositions
    previousExiting.current = exitingKey
    skipFlip.current = false
  }, [exitingKey, freshKey, orderKey])

  if (view.order.length === 0) {
    return empty ? <div className="motion-rise">{empty}</div> : null
  }

  return (
    <div className={className}>
      {view.order.map((id) => {
        const content = items.find((item) => item.id === id)?.content ?? view.snapshots[id]?.content
        if (content == null) return null
        const isExit = view.exiting.includes(id)
        const delay = view.delays[id] ?? 0
        return (
          <div
            key={id}
            ref={(node) => {
              if (node) nodes.current.set(id, node)
              else nodes.current.delete(id)
            }}
            aria-hidden={isExit || undefined}
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out-soft",
              isExit ? "pointer-events-none grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]",
            )}
          >
            <div className={cn("min-h-0", isExit && "overflow-hidden")}>
              <div
                className={cn(itemClassName, !isExit && view.rising.includes(id) && "motion-rise")}
                style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
              >
                {content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function MotionSwap({
  id,
  axis = "y",
  clip = false,
  className,
  children,
}: {
  id: string
  axis?: "x" | "y"
  clip?: boolean
  className?: string
  children: ReactNode
}) {
  const [previousId, setPreviousId] = useState(id)
  const [motion, setMotion] = useState<"next" | "prev" | "rise" | null>(null)

  if (id !== previousId) {
    setPreviousId(id)
    setMotion(axis === "y" ? "rise" : id > previousId ? "next" : "prev")
  }

  return (
    <div className={cn(clip && "overflow-hidden", className)}>
      <div
        key={id}
        className={cn(
          motion === "rise" && "motion-rise",
          motion === "next" && "motion-date-next",
          motion === "prev" && "motion-date-prev",
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function Collapse({
  open,
  children,
  className,
}: {
  open: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-out-soft",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden" inert={open ? undefined : true}>
        {children}
      </div>
    </div>
  )
}
