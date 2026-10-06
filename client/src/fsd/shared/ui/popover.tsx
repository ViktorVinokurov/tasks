"use client"

import { Popover as PopoverPrimitive } from "radix-ui"
import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"
import { popupMotionClass } from "@/shared/ui/motion"

function Popover({ ...props }: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit origin-(--radix-popover-content-transform-origin) rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none",
          popupMotionClass,
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
