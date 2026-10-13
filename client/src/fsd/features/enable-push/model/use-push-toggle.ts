"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { useDispatch, useSelector } from "react-redux"

import { setGroups, type Group } from "@/entities/group"
import { selectToken, useDiaryApi } from "@/entities/session"
import { setTasks, type Task } from "@/entities/task"
import { setSelectedDate } from "@/features/pick-date"
import { isISODate } from "@/shared/lib/date"
import { disablePush, enablePush, pushAvailable, syncPush } from "@/shared/lib/web-push"

function notificationDenied() {
  return pushAvailable() && Notification.permission === "denied"
}

function subscribeNotificationPermission(onChange: () => void) {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) return () => undefined
  let active = true
  let status: PermissionStatus | null = null
  void navigator.permissions
    .query({ name: "notifications" })
    .then((next) => {
      if (!active) return
      status = next
      status.onchange = () => onChange()
    })
    .catch(() => undefined)
  return () => {
    active = false
    if (status) status.onchange = null
  }
}

export function usePushToggle() {
  const token = useSelector(selectToken)
  const request = useDiaryApi()
  const dispatch = useDispatch()
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [justDenied, setJustDenied] = useState(false)
  const [hint, setHint] = useState("")
  const permissionDenied = useSyncExternalStore(
    subscribeNotificationPermission,
    notificationDenied,
    () => false,
  )
  const denied = permissionDenied || justDenied

  const reload = useCallback(async () => {
    try {
      const [tasks, groups] = await Promise.all([
        request<Task[]>("/api/tasks"),
        request<Group[]>("/api/groups"),
      ])
      dispatch(setTasks(tasks))
      dispatch(setGroups(groups))
    } catch {
      return
    }
  }, [dispatch, request])

  useEffect(() => {
    if (!token || !pushAvailable() || Notification.permission !== "granted") return
    let cancelled = false
    void syncPush(token).then((active) => {
      if (!cancelled) setEnabled(active)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token || !("serviceWorker" in navigator)) return
    const onMessage = (event: MessageEvent) => {
      const data: unknown = event.data
      if (!data || typeof data !== "object" || !("type" in data) || data.type !== "diary-push") return
      if ("date" in data && typeof data.date === "string" && isISODate(data.date)) {
        dispatch(setSelectedDate(data.date))
      }
      void reload()
    }
    navigator.serviceWorker.addEventListener("message", onMessage)
    return () => navigator.serviceWorker.removeEventListener("message", onMessage)
  }, [dispatch, reload, token])

  async function toggle() {
    if (!token || busy) return
    setBusy(true)
    setHint("")
    try {
      if (enabled) {
        await disablePush(token)
        setEnabled(false)
      } else {
        await enablePush(token)
        setEnabled(true)
      }
    } catch (error) {
      setHint(error instanceof Error ? error.message : "Не удалось включить уведомления")
      if (pushAvailable() && Notification.permission === "denied") setJustDenied(true)
    } finally {
      setBusy(false)
    }
  }

  const label = denied
    ? "Уведомления запрещены в настройках браузера"
    : enabled
      ? "Выключить уведомления"
      : "Включить уведомления"

  return { enabled, busy, denied, hint, label, toggle }
}
