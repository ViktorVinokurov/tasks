import Link from "next/link"

import { ThemeSwitch } from "@/features/switch-theme"

export default function OfflinePage() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-6 text-center">
      <div className="absolute top-4 right-4">
        <ThemeSwitch />
      </div>
      <div className="motion-rise max-w-md">
        <p className="text-sm font-semibold text-primary">Ежедневник</p>
        <h1 className="mt-2 text-3xl font-bold">Сейчас нет сети</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Страница не загрузилась. Когда связь вернётся, откройте дневник снова.
        </p>
        <Link
          href="/"
          className="glass glass-tint mt-6 inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium"
        >
          На главную
        </Link>
      </div>
    </main>
  )
}
