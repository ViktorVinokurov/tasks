"use client"

import { useSelector } from "react-redux"

import { selectUser } from "@/entities/session"
import { Button } from "@/shared/ui/button"

import { useLogout } from "../model/use-logout"

export function SessionMenu() {
  const user = useSelector(selectUser)
  const logout = useLogout()
  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-36 truncate text-sm text-muted-foreground sm:inline">
        {user.name}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={logout}>
        Выйти
      </Button>
    </div>
  )
}
