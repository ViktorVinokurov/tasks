import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <span className="glass block w-full min-w-0 rounded-xl has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring/40">
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-10 w-full min-w-0 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed md:text-sm",
          className,
        )}
        {...props}
      />
    </span>
  )
}

export { Input }
