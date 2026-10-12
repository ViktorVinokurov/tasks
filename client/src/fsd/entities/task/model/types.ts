export type Subtask = {
  id: string
  title: string
  completed: boolean
}

export type Task = {
  id: string
  title: string
  note: string
  date: string
  groupId: string | null
  completed: boolean
  subtasks: Subtask[]
  createdAt: string
  updatedAt: string
}

export type TaskDraft = {
  title: string
  note: string
  date: string
  groupId: string | null
  subtasks: Subtask[]
}
