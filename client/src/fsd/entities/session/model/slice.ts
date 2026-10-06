import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { SessionUser } from "./types"

export type SessionState = {
  token: string | null
  user: SessionUser | null
}

const initialState: SessionState = {
  token: null,
  user: null,
}

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<{ token: string; user: SessionUser }>) {
      state.token = action.payload.token
      state.user = action.payload.user
    },
    clearSession(state) {
      state.token = null
      state.user = null
    },
  },
})

export const sessionReducer = sessionSlice.reducer
export const { setSession, clearSession } = sessionSlice.actions
