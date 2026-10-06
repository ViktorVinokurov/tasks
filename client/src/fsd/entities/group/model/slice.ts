import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { Group } from "./types"

type GroupsState = {
  items: Group[]
}

const initialState: GroupsState = {
  items: [],
}

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    setGroups(state, action: PayloadAction<Group[]>) {
      state.items = action.payload
    },
    addGroup(state, action: PayloadAction<Group>) {
      state.items.push(action.payload)
    },
    updateGroup(state, action: PayloadAction<Group>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id)
      if (index >= 0) state.items[index] = action.payload
    },
    removeGroup(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    clearGroups(state) {
      state.items = []
    },
  },
})

export const groupsReducer = groupsSlice.reducer
export const { setGroups, addGroup, updateGroup, removeGroup, clearGroups } = groupsSlice.actions
export type { GroupsState }
