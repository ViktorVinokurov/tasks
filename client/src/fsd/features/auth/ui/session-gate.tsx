"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useDispatch, useSelector } from "react-redux"
import { BookOpen } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { clearGroups, setGroups, type Group } from "@/entities/group"
import { clearSession, selectToken } from "@/entities/session"
import { clearTasks, setTasks, type Task } from "@/entities/task"
import { clearThoughts, setThoughts, type Thought } from "@/entities/thought"
import { ApiError, apiRequest } from "@/shared/api/client"
import { Button } from "@/shared/ui/button"

import { importLocalDiary } from "../model/import-local-diary"

const PUBLIC_PATHS = new Set(["/login", "/~offline"])

function Opening() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="motion-rise">
        <span className="motion-breathe mx-auto grid size-14 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-sm">
          <BookOpen className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold tracking-wide text-primary uppercase">Ежедневник</p>
        <p className="mt-2 text-2xl font-bold">Открываю ваш день</p>
      </div>
    </div>
  )
}

export function SessionGate({ children }: { children: ReactNode }) {
  const token = useSelector(selectToken)
  const dispatch = useDispatch()
  const pathname = usePathname()
  const router = useRouter()
  const [loadedToken, setLoadedToken] = useState<string | null>(null)
  const [failedToken, setFailedToken] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (pathname === "/login" && token) router.replace("/")
    if (!PUBLIC_PATHS.has(pathname) && !token) router.replace("/login")
  }, [pathname, router, token])

  useEffect(() => {
    if (!token) {
      dispatch(clearTasks())
      dispatch(clearGroups())
      dispatch(clearThoughts())
      return
    }

    const accessToken = token
    let cancelled = false

    async function load() {
      try {
        const [groups, tasks, thoughts] = await Promise.all([
          apiRequest<Group[]>("/api/groups", { token: accessToken }),
          apiRequest<Task[]>("/api/tasks", { token: accessToken }),
          apiRequest<Thought[]>("/api/thoughts", { token: accessToken }),
        ])
        if (cancelled) return

        if (tasks.length === 0 && thoughts.length === 0) {
          const imported = await importLocalDiary(accessToken, groups)
          if (cancelled) return
          if (imported) {
            const [nextGroups, nextTasks, nextThoughts] = await Promise.all([
              apiRequest<Group[]>("/api/groups", { token: accessToken }),
              apiRequest<Task[]>("/api/tasks", { token: accessToken }),
              apiRequest<Thought[]>("/api/thoughts", { token: accessToken }),
            ])
            if (cancelled) return
            dispatch(setGroups(nextGroups))
            dispatch(setTasks(nextTasks))
            dispatch(setThoughts(nextThoughts))
            setLoadedToken(accessToken)
            setFailedToken(null)
            return
          }
        }

        dispatch(setGroups(groups))
        dispatch(setTasks(tasks))
        dispatch(setThoughts(thoughts))
        setLoadedToken(accessToken)
        setFailedToken(null)
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          dispatch(clearSession())
          return
        }
        setFailedToken(accessToken)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [attempt, dispatch, token])

  if (pathname === "/~offline") return children
  if (!token) {
    if (pathname === "/login") return children
    return <Opening />
  }
  if (failedToken === token) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
        <div className="motion-rise max-w-sm">
          <p className="text-2xl font-bold">Дневник не открылся</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Не удалось загрузить записи. Проверьте связь и попробуйте ещё раз.
          </p>
          <Button
            className="mt-5 h-10"
            onClick={() => {
              setFailedToken(null)
              setAttempt((value) => value + 1)
            }}
          >
            Повторить
          </Button>
        </div>
      </div>
    )
  }
  if (pathname === "/login" || loadedToken !== token) return <Opening />
  return children
}
