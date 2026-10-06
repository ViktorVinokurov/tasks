"use client"

import { TaskFilters } from "@/features/filter-tasks"
import { TaskItem } from "@/features/task-item"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import { useTaskBoard } from "../model/use-task-board"

export function TaskBoard() {
  const board = useTaskBoard()

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Все дела</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Здесь собрано всё: что ещё впереди и что уже получилось. Можно смотреть только активные
          или только завершённые.
        </p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Список</CardTitle>
          <CardDescription>Фильтры не меняют сами дела — только то, что видно сейчас.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <TaskFilters filters={board.filters} />
          {board.groups.length === 0 ? (
            <p className="rounded-2xl bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
              {board.emptyMessage}
            </p>
          ) : (
            <div className="grid gap-5">
              {board.groups.map((group) => (
                <section key={group.date} className="grid gap-1">
                  <div className="flex min-h-8 items-center justify-between gap-3 px-2">
                    <h2 className="min-w-0 text-sm leading-5 font-semibold">
                      {group.title}
                      {group.relative ? (
                        <span className="ml-2 font-medium text-muted-foreground">{group.relative}</span>
                      ) : null}
                    </h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => board.openDay(group.date)}
                    >
                      Открыть день
                    </Button>
                  </div>
                  {group.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
