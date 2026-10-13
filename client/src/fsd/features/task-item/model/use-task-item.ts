"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"

import { selectGroupById, selectGroups } from "@/entities/group"
import { useDiaryApi, type DirectoryUser } from "@/entities/session"
import { deleteTask, updateTask, type Subtask, type Task } from "@/entities/task"
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
  const [transferOpen, setTransferOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [people, setPeople] = useState<DirectoryUser[]>([])
  const [selected, setSelected] = useState<DirectoryUser | null>(null)
  const [searching, setSearching] = useState(false)
  const [transferError, setTransferError] = useState("")
  const [title, setTitle] = useState(task.title)
  const [note, setNote] = useState(task.note)
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks ?? [])
  const [date, setDate] = useState(task.date)
  const [groupId, setGroupId] = useState(task.groupId ?? NONE)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [pending, setPending] = useState(false)

  function openEditor() {
    setTitle(task.title)
    setNote(task.note)
    setSubtasks((task.subtasks ?? []).map((item) => ({ ...item })))
    setDate(task.date)
    setGroupId(task.groupId ?? NONE)
    setError("")
    setEditing(true)
  }

  function openTransfer() {
    setQuery("")
    setPeople([])
    setSelected(null)
    setSearching(false)
    setTransferError("")
    setTransferOpen(true)
  }

  useEffect(() => {
    if (!transferOpen) return
    const needle = query.trim()
    if (!needle) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      setSearching(true)
      request<DirectoryUser[]>(`/api/users?q=${encodeURIComponent(needle)}`)
        .then((found) => {
          if (!cancelled) {
            setPeople(found)
            setTransferError("")
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPeople([])
            setTransferError("Не удалось найти пользователей")
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false)
        })
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, request, transferOpen])

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
          subtasks,
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
    transferOpen,
    query,
    people,
    selectedId: selected?.id ?? null,
    searching,
    transferError,
    title,
    note,
    subtasks,
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
    setTransferOpen,
    openTransfer,
    setQuery(value: string) {
      setQuery(value)
      setSelected(null)
      if (!value.trim()) {
        setPeople([])
        setSearching(false)
      }
      if (transferError) setTransferError("")
    },
    selectPerson(person: DirectoryUser) {
      setSelected(person)
      setTransferError("")
    },
    setTitle(value: string) {
      setTitle(value.slice(0, LIMITS.taskTitle))
      if (error) setError("")
    },
    setNote(value: string) {
      setNote(value.slice(0, LIMITS.taskNote))
    },
    setSubtasks,
    setDate,
    setGroupId,
    async changeSubtasks(next: Subtask[]) {
      if (pending) return
      setPending(true)
      setActionError("")
      try {
        const updated = await request<Task>(`/api/tasks/${task.id}`, {
          method: "PATCH",
          body: { subtasks: next },
        })
        dispatch(updateTask(updated))
      } catch (reason) {
        setActionError(reason instanceof ApiError ? reason.message : "Не удалось сохранить подзадачи")
      } finally {
        setPending(false)
      }
    },
    async toggle() {
      setActionError("")
      try {
        const updated = await request<Task>(`/api/tasks/${task.id}/toggle`, { method: "POST" })
        dispatch(updateTask(updated))
      } catch (reason) {
        setActionError(reason instanceof ApiError ? reason.message : "Не удалось отметить дело")
      }
    },
    async transfer(event: FormEvent) {
      event.preventDefault()
      if (pending) return
      if (!selected) {
        setTransferError("Выберите пользователя")
        return
      }

      setPending(true)
      setTransferError("")
      try {
        await request<Task>(`/api/tasks/${task.id}/transfer`, {
          method: "POST",
          body: { userId: selected.id },
        })
        dispatch(deleteTask(task.id))
        setTransferOpen(false)
      } catch (reason) {
        setTransferError(reason instanceof ApiError ? reason.message : "Не удалось передать дело")
      } finally {
        setPending(false)
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
