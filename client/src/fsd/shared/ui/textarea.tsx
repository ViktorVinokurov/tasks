import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-xl border border-white/70 bg-white/45 px-3 py-2 text-base text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.8)] outline-none backdrop-blur-md transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
