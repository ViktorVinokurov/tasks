"use client"

import { useState, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"

import { selectGroupById, selectGroups } from "@/entities/group"
import { useDiaryApi } from "@/entities/session"
import { deleteTask, updateTask, type Task } from "@/entities/task"
import { ApiError } from "@/shared/api/client"
import { LIMITS } from "@/shared/config/app"

const NONE = "none"

export function useTaskItem(task: Task) {
  const dispatch = useDispatch()
  const request = useDiaryApi()
  const groups = useSelector(selectGroups)
  const group = useSelector((state: Parameters<typeof selectGroupById>[0]) =>
    selectGroupById(state, task.groupId),
  )
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note)
  const [date, setDate] = useState(task.date)
  const [groupId, setGroupId] = useState(task.groupId ?? NONE)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [pending, setPending] = useState(false)

  function openEditor() {
    setTitle(task.title)
    setNote(task.note)
    setDate(task.date)
    setGroupId(task.groupId ?? NONE)
    setError("")
    setEditing(true)
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    const nextTitle = title.trim()
    if (!nextTitle) {
      setError("У дела должно быть название")
      return
    }
    if (!date) {
      setError("Выберите дату")
      return
    }

    setPending(true)
    try {
      const updated = await request<Task>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: {
          title: nextTitle,
          note: note.trim(),
          date,
          groupId: groupId === NONE ? null : groupId,
        },
      })
      dispatch(updateTask(updated))
      setEditing(false)
      setError("")
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось сохранить дело")
    } finally {
      setPending(false)
    }
  }

  return {
    task,
    group,
    groups,
    editing,
    confirmDelete,
    title,
    note,
    date,
    groupId,
    error,
    actionError,
    pending,
    noneValue: NONE,
    titleLimit: LIMITS.taskTitle,
    noteLimit: LIMITS.taskNote,
    setEditing,
    openEditor,
    setConfirmDelete,
    setTitle(value: string) {
      setTitle(value.slice(0, LIMITS.taskTitle))
      if (error) setError("")
    },
    setNote(value: string) {
      setNote(value.slice(0, LIMITS.taskNote))
    },
    setDate,
    setGroupId,
    async toggle() {
      setActionError("")
      try {
        const updated = await request<Task>(`/api/tasks/${task.id}/toggle`, { method: "POST" })
        dispatch(updateTask(updated))
      } catch (reason) {
        setActionError(reason instanceof ApiError ? reason.message : "Не удалось отметить дело")
      }
    },
    async remove() {
      if (pending) return
      setPending(true)
      setActionError("")
      try {
        await request<void>(`/api/tasks/${task.id}`, { method: "DELETE" })
        dispatch(deleteTask(task.id))
        setConfirmDelete(false)
      } catch (reason) {
        setActionError(reason instanceof ApiError ? reason.message : "Не удалось удалить дело")
      } finally {
        setPending(false)
      }
    },
    onSave,
  }
}
