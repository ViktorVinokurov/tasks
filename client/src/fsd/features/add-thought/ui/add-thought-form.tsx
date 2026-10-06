"use client"

import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

import { useAddThought } from "../model/use-add-thought"

export function AddThoughtForm({ date }: { date: string }) {
  const form = useAddThought(date)

  return (
    <form onSubmit={form.onSubmit} className="grid gap-3">
      <Label htmlFor="thought-text" className="sr-only">
        Новая мысль
      </Label>
      <Textarea
        id="thought-text"
        value={form.text}
        onChange={(event) => form.setText(event.target.value)}
        placeholder="Что на душе или что хочется запомнить?"
        maxLength={form.limit}
        className="min-h-28 font-serif text-base leading-7"
        aria-invalid={Boolean(form.error)}
      />
      {form.error ? <p className="motion-rise text-sm text-destructive">{form.error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" className="h-10 w-full sm:w-auto" disabled={form.pending}>
          Записать
        </Button>
      </div>
    </form>
  )
}
