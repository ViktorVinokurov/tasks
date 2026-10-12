import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-white/70 bg-white/45 px-3 text-base text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.8)] outline-none backdrop-blur-md transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
