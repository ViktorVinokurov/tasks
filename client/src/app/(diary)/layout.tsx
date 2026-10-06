import type { ReactNode } from "react"

import { AppShell } from "@/widgets/app-shell"

export default function DiaryLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
