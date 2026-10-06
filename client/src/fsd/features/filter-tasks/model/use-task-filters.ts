"use client"

import { useMemo, useState } from "react"
import { useSelector } from "react-redux"

import { selectGroups } from "@/entities/group"
import { selectAllTasks, type Task } from "@/entities/task"

export type TaskStatusFilter = "all" | "active" | "completed"

export function useTaskFilters() {
  const tasks = useSelector(selectAllTasks)
  const groups = useSelector(selectGroups)
  const [status, setStatus] = useState<TaskStatusFilter>("all")
  const [groupId, setGroupId] = useState("all")
  const [query, setQuery] = useState("")

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((task) => !task.completed).length,
      completed: tasks.filter((task) => task.completed).length,
    }),
    [tasks],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return tasks.filter((task) => {
      if (status === "active" && task.completed) return false
      if (status === "completed" && !task.completed) return false
      if (groupId === "none") {
        if (task.groupId) return false
      } else if (groupId !== "all" && task.groupId !== groupId) {
        return false
      }
      if (!needle) return true
      return `${task.title} ${task.note}`.toLowerCase().includes(needle)
    })
  }, [groupId, query, status, tasks])

  const hasUngrouped = tasks.some((task) => !task.groupId)

  return {
    status,
    groupId,
    query,
    groups,
    counts,
    filtered,
    hasUngrouped,
    setStatus,
    setGroupId,
    setQuery,
  }
}

export function groupFilteredTasks(tasks: Task[]) {
  const dates = [...new Set(tasks.map((task) => task.date))].sort((left, right) =>
    right.localeCompare(left),
  )

  return dates.map((date) => ({
    date,
    tasks: tasks
      .filter((task) => task.date === date)
      .sort((left, right) => {
        if (left.completed !== right.completed) return left.completed ? 1 : -1
        return left.createdAt.localeCompare(right.createdAt)
      }),
  }))
}
