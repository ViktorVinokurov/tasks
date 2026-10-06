import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"

type GroupMarkProps = {
  color: string | null
  name?: string
} & ComponentProps<"span">

export function GroupMark({ color, name, className, ...props }: GroupMarkProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)} {...props}>
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color ?? "var(--muted-foreground)" }}
        aria-hidden
      />
      {name ? <span className="truncate">{name}</span> : null}
    </span>
  )
}
