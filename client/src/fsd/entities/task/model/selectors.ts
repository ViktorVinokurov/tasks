import { compareTasks, type TasksState } from "./slice"

export type WithTasks = { tasks: TasksState }

export function selectAllTasks(state: WithTasks) {
  return state.tasks.items
}

export function selectTasksByDate(state: WithTasks, date: string) {
  return state.tasks.items.filter((task) => task.date === date).sort(compareTasks)
}
