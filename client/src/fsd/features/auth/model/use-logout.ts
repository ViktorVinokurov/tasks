"use client"

import { useDispatch } from "react-redux"
import { useRouter } from "next/navigation"

import { clearGroups } from "@/entities/group"
import { clearSession } from "@/entities/session"
import { clearTasks } from "@/entities/task"
import { clearThoughts } from "@/entities/thought"

export function useLogout() {
  const dispatch = useDispatch()
  const router = useRouter()

  return function logout() {
    dispatch(clearSession())
    dispatch(clearTasks())
    dispatch(clearGroups())
    dispatch(clearThoughts())
    router.replace("/login")
  }
}
