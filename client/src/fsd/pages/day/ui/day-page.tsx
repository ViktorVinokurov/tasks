import { Suspense } from "react"

import { OpenLinkedDay } from "@/features/enable-push"
import { DayBoard } from "@/widgets/day-board"

export function DayPage() {
  return (
    <>
      <Suspense fallback={null}>
        <OpenLinkedDay />
      </Suspense>
      <DayBoard />
    </>
  )
}
