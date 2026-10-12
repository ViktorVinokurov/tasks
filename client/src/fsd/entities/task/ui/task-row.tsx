"use client"

import { Check } from "lucide-react"
import { useState, type ReactNode } from "react"

import { formatTime } from "@/shared/lib/date"
import { cn } from "@/shared/lib/utils"

import type { Subtask, Task } from "../model/types"
import { SubtaskEditor } from "./subtask-editor"

type TaskRowProps = {
  task: Task
  group: { name: string; color: string } | null
  onToggle: () => void
  onSubtasksChange: (subtasks: Subtask[]) => void
  subtasksDisabled?: boolean
  menu?: ReactNode
}

export function TaskRow({
  task,
  group,
  onToggle,
  onSubtasksChange,
  subtasksDisabled,
  menu,
}: TaskRowProps) {
  const subtasks = task.subtasks ?? []

  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-white/35 bg-white/25 px-2 py-2 backdrop-blur-sm transition-[background-color,border-color,opacity] duration-200 hover:border-white/70 hover:bg-white/40",
        task.completed && "opacity-70",
      )}
    >
      <CompleteToggle completed={task.completed} onToggle={onToggle} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-5 font-semibold transition-colors duration-200",
            task.completed && "text-muted-foreground line-through decoration-muted-foreground/70",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-4 text-muted-foreground">
          <time dateTime={task.createdAt}>создано в {formatTime(task.createdAt)}</time>
          {group ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: group.color }}
                aria-hidden
              />
              <span className="truncate">{group.name}</span>
            </span>
          ) : null}
        </div>
        {task.note ? (
          <p className="mt-1.5 text-sm leading-5 whitespace-pre-wrap text-muted-foreground">{task.note}</p>
        ) : null}
        <SubtaskEditor
          items={subtasks}
          onChange={onSubtasksChange}
          disabled={subtasksDisabled}
        />
      </div>
      {menu ? <div className="flex shrink-0 items-center">{menu}</div> : null}
    </article>
  )
}

function CompleteToggle({ completed, onToggle }: { completed: boolean; onToggle: () => void }) {
  const [seen, setSeen] = useState(completed)
  const [pop, setPop] = useState(false)

  if (completed !== seen) {
    setSeen(completed)
    setPop(completed)
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completed}
      aria-label={completed ? "Вернуть в дела" : "Отметить выполненным"}
      onClick={onToggle}
      className={cn(
        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors duration-200",
        completed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-transparent hover:border-primary",
      )}
    >
      <Check
        className={cn(
          "size-3.5",
          completed ? "scale-100" : "scale-0",
          pop ? "motion-check" : "transition-transform duration-200",
        )}
        onAnimationEnd={() => setPop(false)}
      />
    </button>
  )
}
