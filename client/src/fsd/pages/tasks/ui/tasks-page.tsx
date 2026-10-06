"use client"

import { AppShell } from "@/widgets/app-shell"
import { TaskBoard } from "@/widgets/task-board"

export function TasksPage() {
  return (
    <AppShell>
      <TaskBoard />
    </AppShell>
  )
}
