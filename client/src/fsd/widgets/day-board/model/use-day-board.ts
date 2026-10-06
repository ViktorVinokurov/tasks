"use client"

import { useSelector } from "react-redux"

import { selectGroups } from "@/entities/group"
import { selectTasksByDate } from "@/entities/task"
import { selectThoughtsByDate } from "@/entities/thought"
import { selectSelectedDate } from "@/features/pick-date"
import { plural } from "@/shared/lib/plural"

import { greeting, groupDayTasks } from "./group-day-tasks"

export function useDayBoard() {
  const date = useSelector(selectSelectedDate)
  const tasks = useSelector((state: Parameters<typeof selectTasksByDate>[0]) =>
    selectTasksByDate(state, date),
  )
  const thoughts = useSelector((state: Parameters<typeof selectThoughtsByDate>[0]) =>
    selectThoughtsByDate(state, date),
  )
  const groups = useSelector(selectGroups)
  const { sections, completed } = groupDayTasks(tasks, groups)
  const openCount = tasks.length - completed.length

  return {
    date,
    greeting: greeting(),
    summary: buildSummary(openCount, completed.length, thoughts.length),
    sections,
    completed,
    thoughts,
    isEmptyTasks: tasks.length === 0,
  }
}

function buildSummary(openCount: number, doneCount: number, thoughtCount: number) {
  if (openCount === 0 && doneCount === 0 && thoughtCount === 0) {
    return "День ещё чистый — можно начать с одной мысли или одного дела."
  }

  const parts: string[] = []
  if (openCount > 0) {
    parts.push(`${openCount} ${plural(openCount, "дело", "дела", "дел")} впереди`)
  }
  if (doneCount > 0) {
    parts.push(
      `${doneCount} ${plural(doneCount, "завершено", "завершены", "завершено")}`,
    )
  }
  if (thoughtCount > 0) {
    parts.push(`${thoughtCount} ${plural(thoughtCount, "мысль", "мысли", "мыслей")}`)
  }
  if (openCount === 0 && doneCount > 0) {
    parts.unshift("На сегодня всё сделано")
  }
  return parts.join(" · ")
}
