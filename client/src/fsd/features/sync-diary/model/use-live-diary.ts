"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

import { setGroups, type Group } from "@/entities/group"
import { clearSession, selectToken, useDiaryApi } from "@/entities/session"
import { setTasks, type Task } from "@/entities/task"
import { setSelectedDate } from "@/features/pick-date"
import { isISODate } from "@/shared/lib/date"

const AUTH_CLOSE = 4401

type DiaryFrame =
  | { type: "ready" }
  | { type: "ping" }
  | { type: "diary" }
  | { type: "task"; date: string }

function diarySocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/api/ws`
}

function readFrame(data: unknown): DiaryFrame | null {
  if (typeof data !== "string") return null
  let payload: unknown
  try {
    payload = JSON.parse(data)
  } catch {
    return null
  }
  if (!payload || typeof payload !== "object" || !("type" in payload)) return null
  if (payload.type === "ready" || payload.type === "ping" || payload.type === "diary") {
    return { type: payload.type }
  }
  if (payload.type === "task" && "date" in payload && typeof payload.date === "string") {
    return { type: "task", date: payload.date }
  }
  return null
}

export function useLiveDiary() {
  const token = useSelector(selectToken)
  const request = useDiaryApi()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!token) return
    const accessToken = token
    let cancelled = false
    let socket: WebSocket | null = null
    let delay = 1000
    let retryTimer = 0
    let connected = false

    async function reload() {
      try {
        const [nextTasks, groups] = await Promise.all([
          request<Task[]>("/api/tasks"),
          request<Group[]>("/api/groups"),
        ])
        if (cancelled) return
        dispatch(setTasks(nextTasks))
        dispatch(setGroups(groups))
      } catch {
        return
      }
    }

    function showTask(date: string) {
      if (isISODate(date)) dispatch(setSelectedDate(date))
      void reload()
    }

    function schedule() {
      if (cancelled) return
      window.clearTimeout(retryTimer)
      retryTimer = window.setTimeout(() => {
        connect()
        delay = Math.min(delay * 2, 15_000)
      }, delay)
    }

    function connect() {
      if (cancelled) return
      if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
        return
      }
      const next = new WebSocket(diarySocketUrl())
      socket = next

      next.addEventListener("open", () => {
        if (cancelled || socket !== next) {
          next.close()
          return
        }
        next.send(JSON.stringify({ type: "auth", token: accessToken }))
      })

      next.addEventListener("message", (event) => {
        if (cancelled || socket !== next) return
        const frame = readFrame(event.data)
        if (!frame || frame.type === "ping") return
        if (frame.type === "ready") {
          delay = 1000
          if (connected) void reload()
          connected = true
          return
        }
        if (frame.type === "task") showTask(frame.date)
        else void reload()
      })

      next.addEventListener("close", (event) => {
        if (socket !== next) return
        socket = null
        if (cancelled) return
        if (event.code === AUTH_CLOSE) {
          dispatch(clearSession())
          return
        }
        schedule()
      })
    }

    function onVisible() {
      if (document.visibilityState !== "visible" || cancelled) return
      if (socket?.readyState === WebSocket.OPEN) {
        void reload()
        return
      }
      window.clearTimeout(retryTimer)
      delay = 1000
      connect()
    }

    connect()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
      document.removeEventListener("visibilitychange", onVisible)
      socket?.close()
      socket = null
    }
  }, [dispatch, request, token])
}
