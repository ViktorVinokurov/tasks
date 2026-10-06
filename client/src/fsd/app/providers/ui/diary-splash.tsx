import { BookOpen } from "lucide-react"

export function DiarySplash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="motion-rise">
        <span className="motion-breathe mx-auto grid size-14 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-sm">
          <BookOpen className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold tracking-wide text-primary uppercase">Ежедневник</p>
        <p className="mt-2 text-2xl font-bold">Открываю ваш день</p>
      </div>
    </div>
  )
}
