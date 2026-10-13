"use client"

import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { useSearchParams } from "next/navigation"

import { setSelectedDate } from "@/features/pick-date"
import { isISODate } from "@/shared/lib/date"

export function OpenLinkedDay() {
  const params = useSearchParams()
  const dispatch = useDispatch()
  const date = params.get("date")

  useEffect(() => {
    if (date && isISODate(date)) dispatch(setSelectedDate(date))
  }, [date, dispatch])

  return null
}
