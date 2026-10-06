export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type ApiOptions = {
  method?: string
  token?: string | null
  body?: unknown
}

function detailMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) {
    return "Не удалось выполнить запрос"
  }

  const detail = payload.detail
  if (typeof detail === "string" && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const first = detail[0]
    if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string") {
      return first.msg.replace(/^Value error,\s*/i, "")
    }
  }
  return "Проверьте введённые данные"
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers()
  if (options.body !== undefined) headers.set("Content-Type", "application/json")
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`)

  let response: Response
  try {
    response = await fetch(path, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError("Нет связи с дневником", 0)
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(detailMessage(payload), response.status)
  return payload as T
}
