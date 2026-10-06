import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import { createId } from "@/shared/lib/id"

import type { Task, TaskDraft } from "./types"

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
    addTask: (state, action: PayloadAction<TaskDraft>) => {
      const title = action.payload.title.trim()
      if (!title) return

      const timestamp = new Date().toISOString()
      state.items.push({
        id: createId(),
        title,
        note: action.payload.note.trim(),
        date: action.payload.date,
        groupId: action.payload.groupId,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    },
    toggleTask: (state, action: PayloadAction<string>) => {
      const task = state.items.find((item) => item.id === action.payload)
      if (!task) return
      task.completed = !task.completed
      task.updatedAt = new Date().toISOString()
    },
    updateTask: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<TaskDraft> }>,
    ) => {
      const task = state.items.find((item) => item.id === action.payload.id)
      if (!task) return

      const { changes } = action.payload
      if (changes.title !== undefined) {
        const title = changes.title.trim()
        if (!title) return
        task.title = title
      }
      if (changes.note !== undefined) task.note = changes.note.trim()
      if (changes.date !== undefined) task.date = changes.date
      if (changes.groupId !== undefined) task.groupId = changes.groupId
      task.updatedAt = new Date().toISOString()
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    detachGroup: (state, action: PayloadAction<string>) => {
      for (const task of state.items) {
        if (task.groupId === action.payload) task.groupId = null
      }
    },
  },
})

export const tasksReducer = tasksSlice.reducer
export const { addTask, toggleTask, updateTask, deleteTask, detachGroup } = tasksSlice.actions
export type { TasksState }

export function compareTasks(left: Task, right: Task) {
  if (left.completed !== right.completed) return left.completed ? 1 : -1
  return left.createdAt.localeCompare(right.createdAt)
}
