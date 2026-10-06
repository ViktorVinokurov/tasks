import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const SKIP_REQUEST = new Set(["host", "connection", "content-length", "transfer-encoding"])
const SKIP_RESPONSE = new Set(["connection", "content-encoding", "transfer-encoding", "keep-alive"])

function apiOrigin() {
  return (process.env.API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")
}

async function proxy(request: NextRequest, path: string[]) {
  const target = new URL(`${apiOrigin()}/api/${path.map(encodeURIComponent).join("/")}`)
  target.search = request.nextUrl.search

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (!SKIP_REQUEST.has(key.toLowerCase())) headers.set(key, value)
  })

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    })
    const responseHeaders = new Headers()
    response.headers.forEach((value, key) => {
      if (!SKIP_RESPONSE.has(key.toLowerCase())) responseHeaders.set(key, value)
    })
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders })
  } catch {
    return NextResponse.json({ detail: "Дневник сейчас недоступен" }, { status: 502 })
  }
}

type RouteContext = { params: Promise<{ path: string[] }> }

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params
  return proxy(request, path)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
