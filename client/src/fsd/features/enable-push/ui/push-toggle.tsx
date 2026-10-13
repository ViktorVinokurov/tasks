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
        <span className="max-w-40 truncate text-xs text-destructive" role="status" title={push.hint}>
          {push.hint}
        </span>
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
