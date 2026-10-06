"use client"

import { useState, type FormEvent } from "react"
import { useDispatch } from "react-redux"

import { deleteThought, updateThought, type Thought } from "@/entities/thought"
import { LIMITS } from "@/shared/config/app"

export function useThoughtItem(thought: Thought) {
  const dispatch = useDispatch()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [text, setText] = useState(thought.text)
  const [error, setError] = useState("")

  function openEditor() {
    setText(thought.text)
    setError("")
    setEditing(true)
  }

  function onSave(event: FormEvent) {
    event.preventDefault()
    const nextText = text.trim()
    if (!nextText) {
      setError("Мысль не может быть пустой")
      return
    }

    dispatch(updateThought({ id: thought.id, text: nextText }))
    setEditing(false)
    setError("")
  }

  return {
    thought,
    editing,
    confirmDelete,
    text,
    error,
    limit: LIMITS.thought,
    setEditing,
    openEditor,
    setConfirmDelete,
    setText(value: string) {
      setText(value.slice(0, LIMITS.thought))
      if (error) setError("")
    },
    remove() {
      dispatch(deleteThought(thought.id))
      setConfirmDelete(false)
    },
    onSave,
  }
}
