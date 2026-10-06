"use client"

import { useState, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"

import { selectGroupById, selectGroups } from "@/entities/group"
import { deleteTask, toggleTask, updateTask, type Task } from "@/entities/task"
import { LIMITS } from "@/shared/config/app"

const NONE = "none"

export function useTaskItem(task: Task) {
  const dispatch = useDispatch()
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

  function openEditor() {
    setTitle(task.title)
    setNote(task.note)
    setDate(task.date)
    setGroupId(task.groupId ?? NONE)
    setError("")
    setEditing(true)
  }

  function onSave(event: FormEvent) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) {
      setError("У дела должно быть название")
      return
    }
    if (!date) {
      setError("Выберите дату")
      return
    }

    dispatch(
      updateTask({
        id: task.id,
        changes: {
          title: nextTitle,
          note: note.trim(),
          date,
          groupId: groupId === NONE ? null : groupId,
        },
      }),
    )
    setEditing(false)
    setError("")
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
    toggle() {
      dispatch(toggleTask(task.id))
    },
    remove() {
      dispatch(deleteTask(task.id))
      setConfirmDelete(false)
    },
    onSave,
  }
}
