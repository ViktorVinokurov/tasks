"use client"

import { useState, type FormEvent } from "react"
import { useDispatch } from "react-redux"

import { useDiaryApi } from "@/entities/session"
import { addThought, type Thought } from "@/entities/thought"
import { ApiError } from "@/shared/api/client"
import { LIMITS } from "@/shared/config/app"

export function useAddThought(date: string) {
  const dispatch = useDispatch()
  const request = useDiaryApi()
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    const nextText = text.trim()
    if (!nextText) {
      setError("Напишите мысль, прежде чем сохранять")
      return
    }

    setPending(true)
    try {
      const thought = await request<Thought>("/api/thoughts", {
        body: { text: nextText, date },
      })
      dispatch(addThought(thought))
      setText("")
      setError("")
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось записать мысль")
    } finally {
      setPending(false)
    }
  }

  return {
    text,
    error,
    pending,
    limit: LIMITS.thought,
    setText(value: string) {
      setText(value.slice(0, LIMITS.thought))
      if (error) setError("")
    },
    onSubmit,
  }
}
