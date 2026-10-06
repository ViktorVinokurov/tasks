"use client"

import { useMemo, useState } from "react"
import { useSelector } from "react-redux"

import { selectGroups, type Group } from "@/entities/group"
import { selectAllTasks } from "@/entities/task"
import { plural } from "@/shared/lib/plural"

type DialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; group: Group }
  | { type: "delete"; group: Group }

export function useGroupBoard() {
  const groups = useSelector(selectGroups)
  const tasks = useSelector(selectAllTasks)
  const [dialog, setDialog] = useState<DialogState>({ type: "closed" })

  const cards = useMemo(
    () =>
      groups.map((group) => {
        const own = tasks.filter((task) => task.groupId === group.id)
        const active = own.filter((task) => !task.completed).length
        const done = own.length - active
        return {
          group,
          caption: `${active} ${plural(active, "дело", "дела", "дел")} в работе · ${done} ${plural(done, "готово", "готовы", "готово")}`,
        }
      }),
    [groups, tasks],
  )

  return {
    cards,
    formOpen: dialog.type === "create" || dialog.type === "edit",
    editingGroup: dialog.type === "edit" ? dialog.group : null,
    deletingGroup: dialog.type === "delete" ? dialog.group : null,
    startCreate() {
      setDialog({ type: "create" })
    },
    startEdit(group: Group) {
      setDialog({ type: "edit", group })
    },
    startDelete(group: Group) {
      setDialog({ type: "delete", group })
    },
    closeForm() {
      setDialog({ type: "closed" })
    },
    closeDelete() {
      setDialog({ type: "closed" })
    },
  }
}
