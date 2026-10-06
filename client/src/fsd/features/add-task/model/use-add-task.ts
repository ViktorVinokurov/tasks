"use client"

import { useState, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"

import { selectGroups } from "@/entities/group"
import { useDiaryApi } from "@/entities/session"
import { addTask, type Task } from "@/entities/task"
import { ApiError } from "@/shared/api/client"
import { LIMITS } from "@/shared/config/app"

const NONE = "none"

export function useAddTask(date: string) {
  const dispatch = useDispatch()
  const request = useDiaryApi()
  const groups = useSelector(selectGroups)
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [groupId, setGroupId] = useState<string>(NONE)
  const [showNote, setShowNote] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    const nextTitle = title.trim()
    if (!nextTitle) {
      setError("Напишите, что нужно сделать")
      return
    }

    setPending(true)
    try {
      const task = await request<Task>("/api/tasks", {
        body: {
          title: nextTitle,
          note: note.trim(),
          date,
          groupId: groupId === NONE ? null : groupId,
        },
      })
      dispatch(addTask(task))
      setTitle("")
      setNote("")
      setShowNote(false)
      setError("")
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось сохранить дело")
    } finally {
      setPending(false)
    }
  }

  return {
    title,
    note,
    groupId,
    groups,
    showNote,
    error,
    pending,
    noneValue: NONE,
    titleLimit: LIMITS.taskTitle,
    noteLimit: LIMITS.taskNote,
    setTitle(value: string) {
      setTitle(value.slice(0, LIMITS.taskTitle))
      if (error) setError("")
    },
    setNote(value: string) {
      setNote(value.slice(0, LIMITS.taskNote))
    },
    setGroupId,
    setShowNote,
    onSubmit,
  }
}
