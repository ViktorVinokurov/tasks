"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSelector } from "react-redux"

import { selectUser } from "@/entities/session"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { UserAvatar } from "@/shared/ui/user-avatar"

import { useLogout } from "../model/use-logout"

export function SessionMenu() {
  const user = useSelector(selectUser)
  const pathname = usePathname()
  const logout = useLogout()
  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/profile"
        aria-label={`Профиль, ${user.name}`}
        aria-current={pathname === "/profile" ? "page" : undefined}
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-full py-1 pr-1 pl-1",
          pathname === "/profile" && "bg-foreground/6",
        )}
      >
        <UserAvatar name={user.name} avatar={user.avatar} />
        <span className="hidden max-w-36 truncate text-sm text-muted-foreground sm:inline">
          {user.name}
        </span>
      </Link>
      <Button type="button" variant="outline" size="sm" onClick={logout}>
        Выйти
      </Button>
    </div>
  )
}
