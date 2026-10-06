import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { Thought } from "./types"

type ThoughtsState = {
  items: Thought[]
}

const initialState: ThoughtsState = {
  items: [],
}

const thoughtsSlice = createSlice({
  name: "thoughts",
  initialState,
  reducers: {
    setThoughts(state, action: PayloadAction<Thought[]>) {
      state.items = action.payload
    },
    addThought(state, action: PayloadAction<Thought>) {
      state.items.push(action.payload)
    },
    updateThought(state, action: PayloadAction<Thought>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id)
      if (index >= 0) state.items[index] = action.payload
    },
    deleteThought(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    clearThoughts(state) {
      state.items = []
    },
  },
})

export const thoughtsReducer = thoughtsSlice.reducer
export const { setThoughts, addThought, updateThought, deleteThought, clearThoughts } =
  thoughtsSlice.actions
export type { ThoughtsState }
