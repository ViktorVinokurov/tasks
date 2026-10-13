"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"

import { selectUser, updateUser, useDiaryApi, type SessionUser } from "@/entities/session"
import { ApiError } from "@/shared/api/client"
import { LIMITS } from "@/shared/config/app"

import { readAvatarFile } from "./read-avatar"

export function useEditProfile() {
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const request = useDiaryApi()
  const [name, setName] = useState(user?.name ?? "")
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null)
  const [profileError, setProfileError] = useState("")
  const [profileSaved, setProfileSaved] = useState(false)
  const [profilePending, setProfilePending] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [nextPassword, setNextPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordPending, setPasswordPending] = useState(false)

  async function onAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setProfileError("")
    setProfileSaved(false)
    try {
      setAvatar(await readAvatarFile(file))
    } catch (reason) {
      setProfileError(reason instanceof Error ? reason.message : "Не удалось прочитать фото")
    }
  }

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault()
    if (profilePending) return
    const nextName = name.trim()
    if (!nextName) {
      setProfileError("Укажите ФИО")
      return
    }
    setProfilePending(true)
    setProfileError("")
    setProfileSaved(false)
    try {
      const updated = await request<SessionUser>("/api/auth/me", {
        method: "PATCH",
        body: { name: nextName, avatar },
      })
      dispatch(updateUser(updated))
      setName(updated.name)
      setAvatar(updated.avatar)
      setProfileSaved(true)
    } catch (reason) {
      setProfileError(reason instanceof ApiError ? reason.message : "Не удалось сохранить профиль")
    } finally {
      setProfilePending(false)
    }
  }

  async function onSavePassword(event: FormEvent) {
    event.preventDefault()
    if (passwordPending) return
    if (!currentPassword) {
      setPasswordError("Введите текущий пароль")
      return
    }
    if (nextPassword.length < 8) {
      setPasswordError("Новый пароль не короче 8 символов")
      return
    }
    setPasswordPending(true)
    setPasswordError("")
    setPasswordSaved(false)
    try {
      await request<void>("/api/auth/password", {
        method: "POST",
        body: { currentPassword, newPassword: nextPassword },
      })
      setCurrentPassword("")
      setNextPassword("")
      setPasswordSaved(true)
    } catch (reason) {
      setPasswordError(reason instanceof ApiError ? reason.message : "Не удалось сменить пароль")
    } finally {
      setPasswordPending(false)
    }
  }

  return {
    name,
    avatar,
    profileError,
    profileSaved,
    profilePending,
    currentPassword,
    nextPassword,
    passwordError,
    passwordSaved,
    passwordPending,
    nameLimit: LIMITS.userName,
    passwordLimit: LIMITS.password,
    setName(value: string) {
      setName(value.slice(0, LIMITS.userName))
      setProfileSaved(false)
      if (profileError) setProfileError("")
    },
    setCurrentPassword(value: string) {
      setCurrentPassword(value)
      setPasswordSaved(false)
      if (passwordError) setPasswordError("")
    },
    setNextPassword(value: string) {
      setNextPassword(value.slice(0, LIMITS.password))
      setPasswordSaved(false)
      if (passwordError) setPasswordError("")
    },
    clearAvatar() {
      setAvatar(null)
      setProfileSaved(false)
    },
    onAvatar,
    onSaveProfile,
    onSavePassword,
  }
}
