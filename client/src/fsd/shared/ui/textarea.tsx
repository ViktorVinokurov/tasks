import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"

function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <span className="glass block w-full min-w-0 rounded-xl has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring/40">
      <textarea
        data-slot="textarea"
        className={cn(
          "min-h-24 w-full resize-y bg-transparent px-3 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    </span>
  )
}

export { Textarea }
