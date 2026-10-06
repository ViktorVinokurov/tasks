import type { Metadata } from "next"

import { GroupsPage } from "@/pages/groups"

export const metadata: Metadata = {
  title: "Группы",
}

export default function Page() {
  return <GroupsPage />
}
