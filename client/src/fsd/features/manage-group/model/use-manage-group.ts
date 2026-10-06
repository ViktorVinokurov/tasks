"use client"

import { useState, type FormEvent } from "react"
import { useDispatch } from "react-redux"

import {
  addGroup,
  GROUP_COLORS,
  removeGroup,
  updateGroup,
  type Group,
} from "@/entities/group"
import { detachGroup } from "@/entities/task"
import { LIMITS } from "@/shared/config/app"

export function useGroupForm(group: Group | null, onDone: () => void) {
  const dispatch = useDispatch()
  const [name, setName] = useState(group?.name ?? "")
  const [color, setColor] = useState<string>(group?.color ?? GROUP_COLORS[0])
  const [error, setError] = useState("")

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextName = name.trim()
    if (!nextName) {
      setError("Дайте группе имя")
      return
    }

    if (group) {
      dispatch(updateGroup({ id: group.id, changes: { name: nextName, color } }))
    } else {
      dispatch(addGroup({ name: nextName, color }))
    }
    onDone()
  }

  return {
    name,
    color,
    error,
    colors: GROUP_COLORS,
    limit: LIMITS.groupName,
    isEdit: Boolean(group),
    setName(value: string) {
      setName(value.slice(0, LIMITS.groupName))
      if (error) setError("")
    },
    setColor,
    onSubmit,
  }
}

export function useDeleteGroup(group: Group | null, onDone: () => void) {
  const dispatch = useDispatch()

  return {
    confirm() {
      if (!group) return
      dispatch(detachGroup(group.id))
      dispatch(removeGroup(group.id))
      onDone()
    },
  }
}
