import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { createId } from "@/shared/lib/id"

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
    addThought: (state, action: PayloadAction<{ text: string; date: string }>) => {
      const text = action.payload.text.trim()
      if (!text) return

      const timestamp = new Date().toISOString()
      state.items.push({
        id: createId(),
        text,
        date: action.payload.date,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    },
    updateThought: (state, action: PayloadAction<{ id: string; text: string }>) => {
      const thought = state.items.find((item) => item.id === action.payload.id)
      const text = action.payload.text.trim()
      if (!thought || !text) return

      thought.text = text
      thought.updatedAt = new Date().toISOString()
    },
    deleteThought: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
  },
})

export const thoughtsReducer = thoughtsSlice.reducer
export const { addThought, updateThought, deleteThought } = thoughtsSlice.actions
export type { ThoughtsState }
