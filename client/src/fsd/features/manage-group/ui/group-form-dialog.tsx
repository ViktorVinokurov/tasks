"use client"

import type { Group } from "@/entities/group"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import { useGroupForm } from "../model/use-manage-group"

type GroupFormDialogProps = {
  open: boolean
  group: Group | null
  onOpenChange: (open: boolean) => void
}

export function GroupFormDialog({ open, group, onOpenChange }: GroupFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <GroupFormBody
            key={group?.id ?? "new"}
            group={group}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function GroupFormBody({
  group,
  onOpenChange,
}: {
  group: Group | null
  onOpenChange: (open: boolean) => void
}) {
  const form = useGroupForm(group, () => onOpenChange(false))

  return (
    <>
      <DialogHeader>
        <DialogTitle>{form.isEdit ? "Изменить группу" : "Новая группа"}</DialogTitle>
        <DialogDescription>Имя и цвет, по которым дела будет легко узнавать.</DialogDescription>
      </DialogHeader>
      <form onSubmit={form.onSubmit} className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="group-name">Название</Label>
          <Input
            id="group-name"
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            placeholder="Например, Дом"
            maxLength={form.limit}
          />
        </div>
        <div className="grid gap-2">
          <Label>Цвет</Label>
          <div className="flex flex-wrap gap-2">
            {form.colors.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Цвет ${color}`}
                aria-pressed={form.color === color}
                onClick={() => form.setColor(color)}
                className={cn(
                  "size-8 rounded-full ring-offset-2 ring-offset-popover",
                  form.color === color && "ring-2 ring-foreground",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        {form.error ? <p className="text-sm text-destructive">{form.error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="submit" disabled={form.pending}>
            {form.isEdit ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
