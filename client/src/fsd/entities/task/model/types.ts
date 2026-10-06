export type Task = {
  id: string
  title: string
  note: string
  date: string
  groupId: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type TaskDraft = {
  title: string
  note: string
  date: string
  groupId: string | null
}
