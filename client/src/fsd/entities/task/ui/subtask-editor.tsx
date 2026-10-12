"use client"

import { Check, Plus, X } from "lucide-react"
import { useState } from "react"

import { createId } from "@/shared/lib/id"
import { plural } from "@/shared/lib/plural"
import { LIMITS } from "@/shared/config/app"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

import type { Subtask } from "../model/types"

export function SubtaskEditor({
  items,
  onChange,
  disabled = false,
  startOpen = false,
}: {
  items: Subtask[]
  onChange: (items: Subtask[]) => void
  disabled?: boolean
  startOpen?: boolean
}) {
  const [draft, setDraft] = useState("")
  const [expanded, setExpanded] = useState(startOpen || items.length > 0)
  const done = items.filter((item) => item.completed).length
  const total = items.length
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  const atLimit = total >= LIMITS.subtasks

  if ((startOpen || items.length > 0) && !expanded) {
    setExpanded(true)
  }

  function add() {
    const title = draft.trim()
    if (!title || disabled || atLimit) return
    onChange([
      ...items,
      { id: createId(), title: title.slice(0, LIMITS.subtaskTitle), completed: false },
    ])
    setDraft("")
  }

  if (!expanded) {
    return (
      <button
        type="button"
        className="mt-2 text-left text-xs font-semibold text-primary"
        onClick={() => setExpanded(true)}
      >
        Добавить подзадачи
      </button>
    )
  }

  return (
    <div className="mt-2 grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">Подзадачи</p>
        {total > 0 ? (
          <p className="text-xs text-muted-foreground">
            {done} из {total}{" "}
            {plural(total, "подзадача", "подзадачи", "подзадач")}
          </p>
        ) : null}
      </div>
      {total > 0 ? (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-foreground/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={`Прогресс подзадач: ${done} из ${total}`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out-soft"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}
      {items.length > 0 ? (
        <ul className="grid gap-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={item.completed}
                aria-label={item.completed ? `Вернуть «${item.title}»` : `Выполнить «${item.title}»`}
                disabled={disabled}
                onClick={() =>
                  onChange(
                    items.map((current) =>
                      current.id === item.id
                        ? { ...current, completed: !current.completed }
                        : current,
                    ),
                  )
                }
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-200",
                  item.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/80 bg-white/50 text-transparent hover:border-primary",
                )}
              >
                <Check
                  className={cn(
                    "size-3 transition-transform duration-200",
                    item.completed ? "scale-100" : "scale-0",
                  )}
                />
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm leading-5",
                  item.completed && "text-muted-foreground line-through",
                )}
              >
                {item.title}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label={`Удалить подзадачу «${item.title}»`}
                onClick={() => onChange(items.filter((current) => current.id !== item.id))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={draft}
          disabled={disabled || atLimit}
          maxLength={LIMITS.subtaskTitle}
          placeholder={atLimit ? `Не больше ${LIMITS.subtasks} подзадач` : "Шаг или пункт"}
          aria-label="Новая подзадача"
          className="h-9"
          onChange={(event) => setDraft(event.target.value.slice(0, LIMITS.subtaskTitle))}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            add()
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0"
          disabled={disabled || atLimit || !draft.trim()}
          onClick={add}
        >
          <Plus />
          Добавить
        </Button>
      </div>
    </div>
  )
}
