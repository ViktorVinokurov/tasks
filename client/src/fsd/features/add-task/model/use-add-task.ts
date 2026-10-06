"use client"

import { useState, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"

import { selectGroups } from "@/entities/group"
import { addTask } from "@/entities/task"
import { LIMITS } from "@/shared/config/app"

const NONE = "none"

export function useAddTask(date: string) {
  const dispatch = useDispatch()
  const groups = useSelector(selectGroups)
  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [groupId, setGroupId] = useState<string>(NONE)
  const [showNote, setShowNote] = useState(false)
  const [error, setError] = useState("")

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) {
      setError("Напишите, что нужно сделать")
      return
    }

    dispatch(
      addTask({
        title: nextTitle,
        note: note.trim(),
        date,
        groupId: groupId === NONE ? null : groupId,
      }),
    )
    setTitle("")
    setNote("")
    setShowNote(false)
    setError("")
  }

  return {
    title,
    note,
    groupId,
    groups,
    showNote,
    error,
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
