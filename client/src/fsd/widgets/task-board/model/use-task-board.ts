"use client"

import { useRouter } from "next/navigation"
import { useDispatch } from "react-redux"

import { groupFilteredTasks, useTaskFilters } from "@/features/filter-tasks"
import { setSelectedDate } from "@/features/pick-date"
import { formatDayShort, relativeDayLabel } from "@/shared/lib/date"

export function useTaskBoard() {
  const filters = useTaskFilters()
  const dispatch = useDispatch()
  const router = useRouter()
  const groups = groupFilteredTasks(filters.filtered).map((group) => ({
    ...group,
    title: formatDayShort(group.date),
    relative: relativeDayLabel(group.date),
  }))

  let emptyMessage = "Дел пока нет. Они появятся, когда добавите первое в дневнике."
  if (filters.query.trim()) {
    emptyMessage = "Ничего не нашлось. Попробуйте другое слово или снимите фильтр."
  } else if (filters.status === "active" && filters.counts.all > 0) {
    emptyMessage = "Активных дел нет. Можно выдохнуть."
  } else if (filters.status === "completed") {
    emptyMessage = "Завершённых дел пока нет. Отметьте галочкой то, что уже сделано."
  }

  return {
    filters,
    groups,
    emptyMessage,
    openDay(date: string) {
      dispatch(setSelectedDate(date))
      router.push("/")
    },
  }
}
