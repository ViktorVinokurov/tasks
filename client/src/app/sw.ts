/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { NetworkOnly, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher({ url, sameOrigin }) {
        return sameOrigin && url.pathname.startsWith("/api/")
      },
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document"
        },
      },
    ],
  },
})

serwist.addEventListeners()

type PushNote = {
  title?: string
  body?: string
  url?: string
  date?: string
  tag?: string
}

function readPush(event: PushEvent): PushNote {
  if (!event.data) return {}
  try {
    const parsed: unknown = event.data.json()
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as PushNote
  } catch {
    return { body: event.data.text() }
  }
}

function sameOriginUrl(raw: string) {
  const url = new URL(raw, self.location.origin)
  if (url.origin !== self.location.origin) return new URL("/", self.location.origin).href
  return url.href
}

async function tellClients(date: string | undefined) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
  await Promise.all(windows.map((client) => client.postMessage({ type: "diary-push", date })))
}

async function openClient(target: string) {
  const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
  for (const client of windows) {
    if (new URL(client.url).origin !== self.location.origin) continue
    if ("navigate" in client && typeof client.navigate === "function") {
      const next = await client.navigate(target)
      await (next ?? client).focus()
      return
    }
    await client.focus()
    return
  }
  await self.clients.openWindow(target)
}

self.addEventListener("push", (event) => {
  const note = readPush(event)
  const title = note.title?.trim() || "Ежедневник"
  const options: NotificationOptions = {
    body: note.body?.trim() || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: note.url?.trim() || "/" },
  }
  if (note.tag) options.tag = note.tag
  event.waitUntil(Promise.all([self.registration.showNotification(title, options), tellClients(note.date)]))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const data: unknown = event.notification.data
  const raw =
    data && typeof data === "object" && "url" in data && typeof data.url === "string" ? data.url : "/"
  event.waitUntil(openClient(sameOriginUrl(raw)))
})
