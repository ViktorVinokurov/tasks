"use client"

import { Pencil, Trash2 } from "lucide-react"

import { ThoughtCard, type Thought } from "@/entities/thought"
import { Button } from "@/shared/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Textarea } from "@/shared/ui/textarea"

import { useThoughtItem } from "../model/use-thought-item"

export function ThoughtItem({ thought }: { thought: Thought }) {
  const item = useThoughtItem(thought)

  if (item.editing) {
    return (
      <form onSubmit={item.onSave} className="grid gap-2 rounded-2xl bg-background/80 p-3">
        <Textarea
          value={item.text}
          onChange={(event) => item.setText(event.target.value)}
          maxLength={item.limit}
          className="min-h-28 font-serif text-base leading-7"
          aria-label="Текст мысли"
        />
        {item.error ? <p className="text-sm text-destructive">{item.error}</p> : null}
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" size="lg" onClick={() => item.setEditing(false)}>
            Отмена
          </Button>
          <Button type="submit" size="lg">
            Сохранить
          </Button>
        </div>
      </form>
    )
  }

  return (
    <>
      <ThoughtCard
        thought={item.thought}
        menu={
          <div className="flex shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Изменить мысль"
              onClick={() => item.openEditor()}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Удалить мысль"
              onClick={() => item.setConfirmDelete(true)}
            >
              <Trash2 />
            </Button>
          </div>
        }
      />
      <AlertDialog open={item.confirmDelete} onOpenChange={item.setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить мысль?</AlertDialogTitle>
            <AlertDialogDescription>Запись пропадёт из этого дня.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Оставить</AlertDialogCancel>
            <AlertDialogAction onClick={item.remove}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
