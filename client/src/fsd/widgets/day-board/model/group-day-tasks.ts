import type { Group } from "@/entities/group"
import type { Task } from "@/entities/task"

export type DaySection = {
  key: string
  title: string
  color: string | null
  tasks: Task[]
}

export function groupDayTasks(tasks: Task[], groups: Group[]) {
  const active = tasks.filter((task) => !task.completed)
  const completed = tasks.filter((task) => task.completed)
  const known = new Map(groups.map((group) => [group.id, group]))
  const buckets = new Map<string, Task[]>()
  const ungrouped: Task[] = []

  for (const task of active) {
    if (task.groupId && known.has(task.groupId)) {
      const list = buckets.get(task.groupId) ?? []
      list.push(task)
      buckets.set(task.groupId, list)
    } else {
      ungrouped.push(task)
    }
  }

  const sections: DaySection[] = []
  for (const group of groups) {
    const list = buckets.get(group.id)
    if (list?.length) {
      sections.push({
        key: group.id,
        title: group.name,
        color: group.color,
        tasks: list,
      })
    }
  }

  if (ungrouped.length) {
    sections.push({
      key: "none",
      title: "Без группы",
      color: null,
      tasks: ungrouped,
    })
  }

  return { sections, completed }
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return "Доброй ночи"
  if (hour < 12) return "Доброе утро"
  if (hour < 18) return "Добрый день"
  return "Добрый вечер"
}
