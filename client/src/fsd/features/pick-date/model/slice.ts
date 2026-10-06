import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { todayISO } from "@/shared/lib/date"

type PickDateState = {
  selectedDate: string
}

const initialState: PickDateState = {
  selectedDate: todayISO(),
}

const pickDateSlice = createSlice({
  name: "pickDate",
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload
    },
  },
})

export const pickDateReducer = pickDateSlice.reducer
export const { setSelectedDate } = pickDateSlice.actions
export type { PickDateState }
