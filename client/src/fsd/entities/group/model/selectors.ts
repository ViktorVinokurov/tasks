import type { GroupsState } from "./slice"

export type WithGroups = { groups: GroupsState }

export function selectGroups(state: WithGroups) {
  return state.groups.items
}

export function selectGroupById(state: WithGroups, groupId: string | null) {
  if (!groupId) return null
  return state.groups.items.find((group) => group.id === groupId) ?? null
}
