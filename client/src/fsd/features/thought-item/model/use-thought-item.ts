"use client"

import { useState, type FormEvent } from "react"
import { useDispatch } from "react-redux"

import { useDiaryApi } from "@/entities/session"
import { deleteThought, updateThought, type Thought } from "@/entities/thought"
import { ApiError } from "@/shared/api/client"
import { LIMITS } from "@/shared/config/app"

export function useThoughtItem(thought: Thought) {
  const dispatch = useDispatch()
  const request = useDiaryApi()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [text, setText] = useState(thought.text)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [pending, setPending] = useState(false)

  function openEditor() {
    setText(thought.text)
    setError("")
    setEditing(true)
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    const nextText = text.trim()
    if (!nextText) {
      setError("Мысль не может быть пустой")
      return
    }

    setPending(true)
    try {
      const updated = await request<Thought>(`/api/thoughts/${thought.id}`, {
        method: "PATCH",
        body: { text: nextText },
      })
      dispatch(updateThought(updated))
      setEditing(false)
      setError("")
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось сохранить мысль")
    } finally {
      setPending(false)
    }
  }

  return {
    thought,
    editing,
    confirmDelete,
    text,
    error,
    actionError,
    pending,
    limit: LIMITS.thought,
    setEditing,
    openEditor,
    setConfirmDelete,
    setText(value: string) {
      setText(value.slice(0, LIMITS.thought))
      if (error) setError("")
    },
    async remove() {
      if (pending) return
      setPending(true)
      setActionError("")
      try {
        await request<void>(`/api/thoughts/${thought.id}`, { method: "DELETE" })
        dispatch(deleteThought(thought.id))
        setConfirmDelete(false)
      } catch (reason) {
        setActionError(reason instanceof ApiError ? reason.message : "Не удалось удалить мысль")
      } finally {
        setPending(false)
      }
    },
    onSave,
  }
}
