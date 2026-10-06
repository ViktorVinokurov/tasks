"use client"

import { useState, type FormEvent } from "react"
import { useDispatch } from "react-redux"

import { addThought } from "@/entities/thought"
import { LIMITS } from "@/shared/config/app"

export function useAddThought(date: string) {
  const dispatch = useDispatch()
  const [text, setText] = useState("")
  const [error, setError] = useState("")

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextText = text.trim()
    if (!nextText) {
      setError("Напишите мысль, прежде чем сохранять")
      return
    }

    dispatch(addThought({ text: nextText, date }))
    setText("")
    setError("")
  }

  return {
    text,
    error,
    limit: LIMITS.thought,
    setText(value: string) {
      setText(value.slice(0, LIMITS.thought))
      if (error) setError("")
    },
    onSubmit,
  }
}
