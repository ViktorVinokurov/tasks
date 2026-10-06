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
import { useDiaryApi } from "@/entities/session"
import { detachGroup } from "@/entities/task"
import { ApiError } from "@/shared/api/client"
import { LIMITS } from "@/shared/config/app"

export function useGroupForm(group: Group | null, onDone: () => void) {
  const dispatch = useDispatch()
  const request = useDiaryApi()
  const [name, setName] = useState(group?.name ?? "")
  const [color, setColor] = useState<string>(group?.color ?? GROUP_COLORS[0])
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    const nextName = name.trim()
    if (!nextName) {
      setError("Дайте группе имя")
      return
    }

    setPending(true)
    try {
      if (group) {
        const updated = await request<Group>(`/api/groups/${group.id}`, {
          method: "PATCH",
          body: { name: nextName, color },
        })
        dispatch(updateGroup(updated))
      } else {
        const created = await request<Group>("/api/groups", {
          body: { name: nextName, color },
        })
        dispatch(addGroup(created))
      }
      onDone()
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось сохранить группу")
    } finally {
      setPending(false)
    }
  }

  return {
    name,
    color,
    error,
    pending,
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
  const request = useDiaryApi()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  return {
    pending,
    error,
    async confirm() {
      if (!group || pending) return
      setPending(true)
      setError("")
      try {
        await request<void>(`/api/groups/${group.id}`, { method: "DELETE" })
        dispatch(detachGroup(group.id))
        dispatch(removeGroup(group.id))
        onDone()
      } catch (reason) {
        setError(reason instanceof ApiError ? reason.message : "Не удалось удалить группу")
      } finally {
        setPending(false)
      }
    },
  }
}
