import type { Metadata } from "next"

import { TasksPage } from "@/pages/tasks"

export const metadata: Metadata = {
  title: "Все дела",
}

export default function Page() {
  return <TasksPage />
}
