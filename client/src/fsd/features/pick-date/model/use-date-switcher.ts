"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import {
  addDays,
  buildMonthCells,
  formatDayTitle,
  formatMonthTitle,
  parseISODate,
  relativeDayLabel,
  shiftMonth,
  todayISO,
  WEEKDAY_LABELS,
} from "@/shared/lib/date"

import { selectSelectedDate } from "./selectors"
import { setSelectedDate } from "./slice"

export function useDateSwitcher() {
  const dispatch = useDispatch()
  const selectedDate = useSelector(selectSelectedDate)
  const today = todayISO()
  const parsed = parseISODate(selectedDate)
  const [open, setOpenState] = useState(false)
  const [monthOverride, setMonthOverride] = useState<{ year: number; month: number } | null>(null)
  const cursor = monthOverride ?? { year: parsed.year, month: parsed.month }

  function setOpen(next: boolean) {
    if (!next) setMonthOverride(null)
    setOpenState(next)
  }

  function selectDate(iso: string) {
    dispatch(setSelectedDate(iso))
    setOpen(false)
  }

  return {
    selectedDate,
    title: formatDayTitle(selectedDate),
    relative: relativeDayLabel(selectedDate, today),
    isToday: selectedDate === today,
    weekdayLabels: WEEKDAY_LABELS,
    monthTitle: formatMonthTitle(cursor.year, cursor.month),
    monthKey: `${cursor.year}-${String(cursor.month).padStart(2, "0")}`,
    cells: buildMonthCells(cursor.year, cursor.month),
    open,
    setOpen,
    goPrev() {
      dispatch(setSelectedDate(addDays(selectedDate, -1)))
    },
    goNext() {
      dispatch(setSelectedDate(addDays(selectedDate, 1)))
    },
    goToday() {
      dispatch(setSelectedDate(today))
    },
    showPreviousMonth() {
      setMonthOverride(shiftMonth(cursor.year, cursor.month, -1))
    },
    showNextMonth() {
      setMonthOverride(shiftMonth(cursor.year, cursor.month, 1))
    },
    selectDate,
  }
}
