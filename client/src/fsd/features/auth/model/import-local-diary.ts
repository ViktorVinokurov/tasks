import type { Group } from "@/entities/group"
import type { Task } from "@/entities/task"
import type { Thought } from "@/entities/thought"
import { apiRequest } from "@/shared/api/client"

const LOCAL_KEY = "persist:ezhednevnik"
const STARTER_NAMES = new Set(["Личное", "Работа", "Здоровье"])

function readItems<T>(raw: string | undefined): T[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || !("items" in parsed)) return []
    const items = parsed.items
    return Array.isArray(items) ? (items as T[]) : []
  } catch {
    return []
  }
}

export async function importLocalDiary(token: string, serverGroups: Group[]) {
  if (typeof window === "undefined") return false
  const raw = window.localStorage.getItem(LOCAL_KEY)
  if (!raw) return false

  let stored: { tasks?: string; thoughts?: string; groups?: string }
  try {
    stored = JSON.parse(raw) as { tasks?: string; thoughts?: string; groups?: string }
  } catch {
    window.localStorage.removeItem(LOCAL_KEY)
    return false
  }

  const tasks = readItems<Task>(stored.tasks).filter((item) => item.title?.trim() && item.date)
  const thoughts = readItems<Thought>(stored.thoughts).filter((item) => item.text?.trim() && item.date)
  const groups = readItems<Group>(stored.groups).filter((item) => item.name?.trim() && item.color)

  const hasCustomGroups = groups.some((group) => !STARTER_NAMES.has(group.name))
  if (tasks.length === 0 && thoughts.length === 0 && !hasCustomGroups) {
    window.localStorage.removeItem(LOCAL_KEY)
    return false
  }

  const byName = new Map(serverGroups.map((group) => [group.name, group.id]))
  const idMap = new Map<string, string>()

  for (const group of groups) {
    const known = byName.get(group.name)
    if (known) {
      idMap.set(group.id, known)
      continue
    }
    const created = await apiRequest<Group>("/api/groups", {
      token,
      body: { name: group.name.trim(), color: group.color },
    })
    byName.set(created.name, created.id)
    idMap.set(group.id, created.id)
  }

  for (const task of tasks) {
    await apiRequest<Task>("/api/tasks", {
      token,
      body: {
        title: task.title.trim(),
        note: task.note?.trim() ?? "",
        date: task.date,
        groupId: task.groupId ? (idMap.get(task.groupId) ?? null) : null,
      },
    })
  }

  for (const thought of thoughts) {
    await apiRequest<Thought>("/api/thoughts", {
      token,
      body: { text: thought.text.trim(), date: thought.date },
    })
  }

  window.localStorage.removeItem(LOCAL_KEY)
  return true
}
