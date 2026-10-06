import type { ThoughtsState } from "./slice"

export type WithThoughts = { thoughts: ThoughtsState }

export function selectThoughtsByDate(state: WithThoughts, date: string) {
  return state.thoughts.items
    .filter((thought) => thought.date === date)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}
