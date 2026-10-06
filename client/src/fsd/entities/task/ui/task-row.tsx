import { Check } from "lucide-react"
import type { ReactNode } from "react"

import type { Task } from "../model/types"
import { cn } from "@/shared/lib/utils"

type TaskRowProps = {
  task: Task
  group: { name: string; color: string } | null
  onToggle: () => void
  menu?: ReactNode
}

export function TaskRow({ task, group, onToggle, menu }: TaskRowProps) {
  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-background/70",
        task.completed && "opacity-70",
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? "Вернуть в дела" : "Отметить выполненным"}
        onClick={onToggle}
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
          task.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-transparent hover:border-primary",
        )}
      >
        <Check className="size-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-5 font-semibold",
            task.completed && "text-muted-foreground line-through decoration-muted-foreground/70",
          )}
        >
          {task.title}
        </p>
        {task.note ? (
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{task.note}</p>
        ) : null}
        {group ? (
          <div className="mt-1.5 flex items-center text-xs leading-4 text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: group.color }}
                aria-hidden
              />
              <span className="truncate">{group.name}</span>
            </span>
          </div>
        ) : null}
      </div>
      {menu ? <div className="flex shrink-0 items-center self-center">{menu}</div> : null}
    </article>
  )
}
