import { apiRequest } from "@/shared/api/client"

type VapidKey = {
  publicKey: string
}

function urlBase64ToBytes(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes
}

function sameApplicationKey(subscription: PushSubscription, next: Uint8Array) {
  const current = subscription.options.applicationServerKey
  if (!current) return false
  const bytes = new Uint8Array(current)
  if (bytes.byteLength !== next.byteLength) return false
  return bytes.every((byte, index) => byte === next[index])
}

function isIos() {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return true
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
}

function isInAppBrowser() {
  return /Telegram|Instagram|FBAN|FBAV|VKClient|MicroMessenger|Line\/|Twitter|Snapchat|; wv\)/i.test(
    navigator.userAgent,
  )
}

function hasPushManager() {
  if ("PushManager" in window) return true
  return typeof ServiceWorkerRegistration !== "undefined" && "pushManager" in ServiceWorkerRegistration.prototype
}

export function pushAvailable() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    hasPushManager()
  )
}

function unsupportedMessage() {
  if (!window.isSecureContext) {
    return "На телефоне уведомления включаются только по адресу https://, с замком в строке. Сейчас сайт открыт без защиты."
  }
  if (isIos()) return "Добавьте ежедневник на экран «Домой», затем включите уведомления"
  if (isInAppBrowser()) {
    return "Это встроенное окно приложения. Откройте ежедневник в Chrome: меню и «Открыть в браузере»."
  }
  return "Откройте ежедневник в Chrome. Этот браузер не присылает уведомления."
}

async function readyRegistration() {
  const timeout = new Promise<null>((resolve) => {
    window.setTimeout(() => resolve(null), 4000)
  })
  return Promise.race([navigator.serviceWorker.ready, timeout])
}

async function subscribe(token: string) {
  const registration = await readyRegistration()
  if (!registration) throw new Error("Уведомления включаются в опубликованном приложении")

  const { publicKey } = await apiRequest<VapidKey>("/api/push/vapid", { token })
  const applicationServerKey = urlBase64ToBytes(publicKey)
  let current = await registration.pushManager.getSubscription()
  if (current && !sameApplicationKey(current, applicationServerKey)) {
    await current.unsubscribe()
    current = null
  }
  const subscription =
    current ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }))
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("Браузер не выдал подписку на уведомления")
  }
  await apiRequest("/api/push/subscription", {
    method: "PUT",
    token,
    body: {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    },
  })
}

export async function enablePush(token: string) {
  if (!pushAvailable()) throw new Error(unsupportedMessage())
  const permission = await Notification.requestPermission()
  if (permission !== "granted") throw new Error("Разрешите уведомления в настройках браузера")
  await subscribe(token)
}

export async function syncPush(token: string) {
  if (!pushAvailable() || Notification.permission !== "granted") return false
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return false
  try {
    await subscribe(token)
    return true
  } catch {
    return false
  }
}

export async function disablePush(token: string) {
  if (!("serviceWorker" in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  const endpoint = subscription?.endpoint
  await subscription?.unsubscribe()
  if (!endpoint) return
  await apiRequest("/api/push/subscription", {
    method: "DELETE",
    token,
    body: { endpoint },
  })
}
