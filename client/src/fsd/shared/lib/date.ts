export function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseISODate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return { year, month: month - 1, day }
}

export function dateFromISO(iso: string) {
  const { year, month, day } = parseISODate(iso)
  return new Date(year, month, day)
}

export function todayISO() {
  return toISODate(new Date())
}

export function addDays(iso: string, amount: number) {
  const date = dateFromISO(iso)
  date.setDate(date.getDate() + amount)
  return toISODate(date)
}

export function capitalize(value: string) {
  if (!value) return value
  return value.charAt(0).toLocaleUpperCase("ru-RU") + value.slice(1)
}

export function formatDayTitle(iso: string) {
  return capitalize(
    new Intl.DateTimeFormat("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(dateFromISO(iso)),
  )
}

export function formatDayShort(iso: string) {
  return capitalize(
    new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      weekday: "short",
    }).format(dateFromISO(iso)),
  )
}

export function formatMonthTitle(year: number, month: number) {
  return capitalize(
    new Intl.DateTimeFormat("ru-RU", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month, 1)),
  )
}

export function formatTime(isoDateTime: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDateTime))
}

export function relativeDayLabel(iso: string, today = todayISO()) {
  if (iso === today) return "Сегодня"
  if (iso === addDays(today, -1)) return "Вчера"
  if (iso === addDays(today, 1)) return "Завтра"
  return ""
}

export function shiftMonth(year: number, month: number, amount: number) {
  const date = new Date(year, month + amount, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
}

export const WEEKDAY_LABELS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]

export function buildMonthCells(year: number, month: number) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const cursor = new Date(year, month, 1 - firstWeekday)

  return Array.from({ length: 42 }, () => {
    const iso = toISODate(cursor)
    const inMonth = cursor.getMonth() === month
    const day = cursor.getDate()
    cursor.setDate(cursor.getDate() + 1)
    return { iso, inMonth, day }
  })
}
