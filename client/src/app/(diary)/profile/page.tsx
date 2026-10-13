import type { Metadata } from "next"

import { ProfilePage } from "@/pages/profile"

export const metadata: Metadata = {
  title: "Профиль",
}

export default function Page() {
  return <ProfilePage />
}
