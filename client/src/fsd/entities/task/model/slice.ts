import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { Task } from "./types"

type TasksState = {
  items: Task[]
}

const initialState: TasksState = {
  items: [],
}

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks(state, action: PayloadAction<Task[]>) {
      state.items = action.payload
    },
    addTask(state, action: PayloadAction<Task>) {
      state.items.push(action.payload)
    },
    updateTask(state, action: PayloadAction<Task>) {
      const index = state.items.findIndex((item) => item.id === action.payload.id)
      if (index >= 0) state.items[index] = action.payload
    },
    deleteTask(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    detachGroup(state, action: PayloadAction<string>) {
      for (const task of state.items) {
        if (task.groupId === action.payload) task.groupId = null
      }
    },
    clearTasks(state) {
      state.items = []
    },
  },
})

export const tasksReducer = tasksSlice.reducer
export const { setTasks, addTask, updateTask, deleteTask, detachGroup, clearTasks } =
  tasksSlice.actions
export type { TasksState }

export function compareTasks(left: Task, right: Task) {
  if (left.completed !== right.completed) return left.completed ? 1 : -1
  return left.createdAt.localeCompare(right.createdAt)
}
