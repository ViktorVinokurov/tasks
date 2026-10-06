import type { PickDateState } from "./slice"

export type WithPickDate = { pickDate: PickDateState }

export function selectSelectedDate(state: WithPickDate) {
  return state.pickDate.selectedDate
}
