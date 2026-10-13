"use client"

import { useEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"

import { setGroups, type Group } from "@/entities/group"
import { clearSession, selectToken, useDiaryApi } from "@/entities/session"
import { selectAllTasks, setTasks, type Task } from "@/entities/task"
import { setSelectedDate } from "@/features/pick-date"
import { isISODate } from "@/shared/lib/date"

const POLL_MS = 4000

function readFrame(frame: string) {
  const line = frame.split("\n").find((item) => item.startsWith("data:"))
  if (!line) return null
  try {
    const payload: unknown = JSON.parse(line.slice(5).trim())
    if (!payload || typeof payload !== "object" || !("type" in payload)) return null
    if (payload.type !== "task" || !("date" in payload) || typeof payload.date !== "string") return null
    return payload.date
  } catch {
    return null
  }
}

export function useLiveDiary() {
  const token = useSelector(selectToken)
  const tasks = useSelector(selectAllTasks)
  const request = useDiaryApi()
  const dispatch = useDispatch()
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    let cancelled = false
    const controller = new AbortController()

    async function reload(jump: boolean) {
      try {
        const before = tasksRef.current
        const [nextTasks, groups] = await Promise.all([
          request<Task[]>("/api/tasks"),
          request<Group[]>("/api/groups"),
        ])
        if (cancelled) return
        dispatch(setTasks(nextTasks))
        dispatch(setGroups(groups))
        if (!jump) return
        const known = new Set(before.map((task) => task.id))
        const fresh = nextTasks.find((task) => !known.has(task.id))
        if (fresh && isISODate(fresh.date)) dispatch(setSelectedDate(fresh.date))
      } catch {
        return
      }
    }

    function showTask(date: string) {
      if (isISODate(date)) dispatch(setSelectedDate(date))
      void reload(false)
    }

    async function listen() {
      let delay = 1000
      while (!cancelled) {
        try {
          const response = await fetch("/api/events", {
            headers: {
              Accept: "text/event-stream",
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
            signal: controller.signal,
          })
          if (response.status === 401) {
            dispatch(clearSession())
            return
          }
          if (!response.ok || !response.body) throw new Error("Поток событий недоступен")
          delay = 1000
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ""
          while (!cancelled) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const frames = buffer.split("\n\n")
            buffer = frames.pop() ?? ""
            for (const frame of frames) {
              const date = readFrame(frame)
              if (date) showTask(date)
            }
          }
        } catch {
          if (cancelled || controller.signal.aborted) return
        }
        if (cancelled) return
        await new Promise((resolve) => window.setTimeout(resolve, delay))
        delay = Math.min(delay * 2, 15_000)
      }
    }

    void listen()
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void reload(true)
    }, POLL_MS)

    function onVisible() {
      if (document.visibilityState === "visible") void reload(true)
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(poll)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [dispatch, request, token])
}
