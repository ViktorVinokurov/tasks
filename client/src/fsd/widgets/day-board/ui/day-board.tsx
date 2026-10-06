"use client"

import { AddTaskForm } from "@/features/add-task"
import { AddThoughtForm } from "@/features/add-thought"
import { DateSwitcher } from "@/features/pick-date"
import { TaskItem } from "@/features/task-item"
import { ThoughtItem } from "@/features/thought-item"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import { useDayBoard } from "../model/use-day-board"

export function DayBoard() {
  const day = useDayBoard()

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <p className="text-sm font-semibold text-primary">{day.greeting}</p>
        <DateSwitcher />
        <p className="text-sm text-muted-foreground">{day.summary}</p>
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Мысли</CardTitle>
            <CardDescription>Коротко о дне: настроение, заметки, то, что не хочется забыть.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AddThoughtForm date={day.date} />
            {day.thoughts.length === 0 ? (
              <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Здесь пока тихо. Одной фразы уже достаточно.
              </p>
            ) : (
              <div className="grid gap-2">
                {day.thoughts.map((thought) => (
                  <ThoughtItem key={thought.id} thought={thought} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Дела</CardTitle>
            <CardDescription>То, что хотите успеть именно в этот день.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AddTaskForm date={day.date} />
            {day.isEmptyTasks ? (
              <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                На этот день пока пусто. Добавьте одно маленькое дело — и день станет понятнее.
              </p>
            ) : (
              <div className="grid gap-4">
                {day.sections.map((section) => (
                  <section key={section.key} className="grid gap-1">
                    <h3 className="flex h-8 items-center gap-2 px-2 text-sm leading-none font-semibold text-muted-foreground">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: section.color ?? "var(--muted-foreground)" }}
                        aria-hidden
                      />
                      {section.title}
                    </h3>
                    {section.tasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </section>
                ))}
                {day.completed.length > 0 ? (
                  <section className="grid gap-1">
                    <h3 className="flex h-8 items-center gap-2 px-2 text-sm leading-none font-semibold text-muted-foreground">
                      <span className="size-2 shrink-0 rounded-full bg-primary/50" aria-hidden />
                      Сделано
                    </h3>
                    {day.completed.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </section>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
