"use client"

import { useDispatch, useSelector } from "react-redux"
import { useRouter } from "next/navigation"

import { clearGroups } from "@/entities/group"
import { clearSession, selectToken } from "@/entities/session"
import { clearTasks } from "@/entities/task"
import { clearThoughts } from "@/entities/thought"
import { disablePush } from "@/shared/lib/web-push"

export function useLogout() {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = useSelector(selectToken)

  return function logout() {
    if (token) void disablePush(token).catch(() => undefined)
    dispatch(clearSession())
    dispatch(clearTasks())
    dispatch(clearGroups())
    dispatch(clearThoughts())
    router.replace("/login")
  }
}
