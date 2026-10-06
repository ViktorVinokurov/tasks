import type { ReactNode } from "react"

import { formatTime } from "@/shared/lib/date"

import type { Thought } from "../model/types"

type ThoughtCardProps = {
  thought: Thought
  menu?: ReactNode
}

export function ThoughtCard({ thought, menu }: ThoughtCardProps) {
  return (
    <article className="rounded-2xl bg-background/80 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[15px] leading-6 text-foreground">{thought.text}</p>
          <p className="mt-1 text-xs leading-none text-muted-foreground">
            {formatTime(thought.updatedAt)}
          </p>
        </div>
        {menu ? <div className="flex shrink-0 items-center">{menu}</div> : null}
      </div>
    </article>
  )
}
