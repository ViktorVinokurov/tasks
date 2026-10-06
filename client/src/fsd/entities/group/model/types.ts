export type Group = {
  id: string
  name: string
  color: string
  createdAt: string
}

export type GroupDraft = {
  name: string
  color: string
}

export const GROUP_COLORS = [
  "#3e6b56",
  "#d08a4c",
  "#6a8caf",
  "#c46b7a",
  "#8a6aad",
  "#4f8f8b",
  "#c47b4a",
  "#b08968",
] as const
