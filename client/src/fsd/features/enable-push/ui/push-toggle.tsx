"use client"

import { Bell, BellOff } from "lucide-react"

import { Button } from "@/shared/ui/button"

import { usePushToggle } from "../model/use-push-toggle"

export function PushToggle() {
  const push = usePushToggle()
  const Icon = push.enabled ? Bell : BellOff

  return (
    <div className="flex min-w-0 items-center gap-2">
      {push.hint ? (
        <p
          className="fixed inset-x-0 top-16 z-30 bg-background/95 px-4 py-2 text-center text-sm text-destructive"
          role="status"
        >
          {push.hint}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={push.hint || push.label}
        aria-pressed={push.enabled}
        title={push.hint || push.label}
        onClick={() => void push.toggle()}
        disabled={push.busy || push.denied}
      >
        <Icon />
      </Button>
    </div>
  )
}
