import Link from "next/link"

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-primary">Ежедневник</p>
        <h1 className="mt-2 text-3xl font-bold">Сейчас нет сети</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Страница не загрузилась. Когда связь вернётся, откройте дневник снова — записанные дни
          останутся на этом устройстве.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          На главную
        </Link>
      </div>
    </main>
  )
}
