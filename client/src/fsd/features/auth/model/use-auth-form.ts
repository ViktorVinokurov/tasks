"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"

import { setSession, type AuthResponse } from "@/entities/session"
import { ApiError, apiRequest } from "@/shared/api/client"
import { LIMITS } from "@/shared/config/app"

const SAVED_LOGIN_KEY = "ezhednevnik-login"

export function useAuthForm() {
  const dispatch = useDispatch()
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    localStorage.removeItem(SAVED_LOGIN_KEY)
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return

    const nextEmail = email.trim()
    if (!nextEmail.includes("@")) {
      setError("Укажите почту, например anna@example.com")
      return
    }
    if (password.length < 8) {
      setError("Пароль не короче 8 символов")
      return
    }

    setPending(true)
    setError("")
    try {
      const body =
        mode === "register"
          ? { email: nextEmail, password, name: name.trim() }
          : { email: nextEmail, password }
      const auth = await apiRequest<AuthResponse>(
        mode === "register" ? "/api/auth/register" : "/api/auth/login",
        { body },
      )
      dispatch(setSession({ token: auth.accessToken, user: auth.user }))
      router.replace("/")
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Не удалось войти")
    } finally {
      setPending(false)
    }
  }

  return {
    mode,
    name,
    email,
    password,
    error,
    pending,
    nameLimit: LIMITS.userName,
    emailLimit: LIMITS.email,
    passwordLimit: LIMITS.password,
    setMode(next: "login" | "register") {
      setMode(next)
      setError("")
    },
    setName(value: string) {
      setName(value.slice(0, LIMITS.userName))
      if (error) setError("")
    },
    setEmail(value: string) {
      setEmail(value.slice(0, LIMITS.email))
      if (error) setError("")
    },
    setPassword(value: string) {
      setPassword(value.slice(0, LIMITS.password))
      if (error) setError("")
    },
    onSubmit,
  }
}
