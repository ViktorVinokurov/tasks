import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { createId } from "@/shared/lib/id"

import { GROUP_COLORS, type Group, type GroupDraft } from "./types"

export const INITIAL_GROUPS: Group[] = [
  {
    id: "personal",
    name: "Личное",
    color: GROUP_COLORS[0],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "work",
    name: "Работа",
    color: GROUP_COLORS[1],
    createdAt: "2026-01-01T00:00:01.000Z",
  },
  {
    id: "health",
    name: "Здоровье",
    color: GROUP_COLORS[2],
    createdAt: "2026-01-01T00:00:02.000Z",
  },
]

type GroupsState = {
  items: Group[]
}

const initialState: GroupsState = {
  items: INITIAL_GROUPS,
}

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    addGroup: (state, action: PayloadAction<GroupDraft>) => {
      const name = action.payload.name.trim()
      if (!name) return

      state.items.push({
        id: createId(),
        name,
        color: action.payload.color,
        createdAt: new Date().toISOString(),
      })
    },
    updateGroup: (
      state,
      action: PayloadAction<{ id: string; changes: GroupDraft }>,
    ) => {
      const group = state.items.find((item) => item.id === action.payload.id)
      const name = action.payload.changes.name.trim()
      if (!group || !name) return

      group.name = name
      group.color = action.payload.changes.color
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
  },
})

export const groupsReducer = groupsSlice.reducer
export const { addGroup, updateGroup, removeGroup } = groupsSlice.actions
export type { GroupsState }
