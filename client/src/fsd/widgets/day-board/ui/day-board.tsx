"use client"

import type { ReactNode } from "react"

import { AddTaskForm } from "@/features/add-task"
import { AddThoughtForm } from "@/features/add-thought"
import { DateSwitcher } from "@/features/pick-date"
import { TaskItem } from "@/features/task-item"
import { ThoughtItem } from "@/features/thought-item"
import { cn } from "@/shared/lib/utils"
import { MotionList, MotionSwap } from "@/shared/ui/motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import { useDayBoard } from "../model/use-day-board"

export function DayBoard() {
  const day = useDayBoard()
  const taskRows: { id: string; content: ReactNode; animateExit?: boolean }[] = []

  day.sections.forEach((section, index) => {
    taskRows.push({
      id: `section-${section.key}`,
      animateExit: false,
      content: (
        <SectionHeading
          title={section.title}
          color={section.color}
          spaced={index > 0}
        />
      ),
    })
    for (const task of section.tasks) {
      taskRows.push({
        id: task.id,
        content: <TaskItem task={task} />,
      })
    }
  })

  if (day.completed.length > 0) {
    taskRows.push({
      id: "section-done",
      animateExit: false,
      content: (
        <SectionHeading
          title="Сделано"
          dotClassName="bg-primary/50"
          spaced={taskRows.length > 0}
        />
      ),
    })
    for (const task of day.completed) {
      taskRows.push({
        id: task.id,
        content: <TaskItem task={task} />,
      })
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <p className="text-sm font-semibold text-primary">{day.greeting}</p>
        <DateSwitcher />
        <MotionSwap id={day.date} axis="y">
          <p className="text-sm text-muted-foreground">{day.summary}</p>
        </MotionSwap>
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Мысли</CardTitle>
            <CardDescription>Коротко о дне: настроение, заметки, то, что не хочется забыть.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AddThoughtForm date={day.date} />
            <MotionSwap id={day.date} axis="y">
              <MotionList
                className="flex flex-col"
                itemClassName="pb-2"
                items={day.thoughts.map((thought) => ({
                  id: thought.id,
                  content: <ThoughtItem thought={thought} />,
                }))}
                empty={
                  <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                    Здесь пока тихо. Одной фразы уже достаточно.
                  </p>
                }
              />
            </MotionSwap>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Дела</CardTitle>
            <CardDescription>То, что хотите успеть именно в этот день.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <AddTaskForm date={day.date} />
            <MotionSwap id={day.date} axis="y">
              <MotionList
                className="flex flex-col"
                itemClassName="pb-1"
                items={taskRows}
                empty={
                  <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                    На этот день пока пусто. Добавьте одно маленькое дело — и день станет понятнее.
                  </p>
                }
              />
            </MotionSwap>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SectionHeading({
  title,
  color,
  dotClassName,
  spaced,
}: {
  title: string
  color?: string | null
  dotClassName?: string
  spaced?: boolean
}) {
  return (
    <h3
      className={cn(
        "flex h-8 items-center gap-2 px-2 text-sm leading-none font-semibold text-muted-foreground",
        spaced && "mt-3",
      )}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", !color && (dotClassName ?? "bg-muted-foreground"))}
        style={color ? { backgroundColor: color } : undefined}
        aria-hidden
      />
      {title}
    </h3>
  )
}
