"use client"

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { TaskRow } from "@/entities/task"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"

import { useTaskItem } from "../model/use-task-item"
import type { Task } from "@/entities/task"

export function TaskItem({ task }: { task: Task }) {
  const item = useTaskItem(task)

  return (
    <>
      <TaskRow
        task={item.task}
        group={item.group}
        onToggle={item.toggle}
        menu={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Действия с делом">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => item.openEditor()}>
                <Pencil />
                Изменить
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => item.setConfirmDelete(true)}>
                <Trash2 />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      {item.actionError && !item.confirmDelete ? (
        <p className="px-1 text-sm text-destructive">{item.actionError}</p>
      ) : null}

      <Dialog open={item.editing} onOpenChange={item.setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить дело</DialogTitle>
            <DialogDescription>Можно поправить текст, дату и группу.</DialogDescription>
          </DialogHeader>
          <form onSubmit={item.onSave} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`task-title-${item.task.id}`}>Название</Label>
              <Input
                id={`task-title-${item.task.id}`}
                value={item.title}
                onChange={(event) => item.setTitle(event.target.value)}
                maxLength={item.titleLimit}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`task-note-${item.task.id}`}>Пометка</Label>
              <Textarea
                id={`task-note-${item.task.id}`}
                value={item.note}
                onChange={(event) => item.setNote(event.target.value)}
                maxLength={item.noteLimit}
              />
            </div>
            <div className="grid items-end gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={`task-date-${item.task.id}`}>Дата</Label>
                <Input
                  id={`task-date-${item.task.id}`}
                  type="date"
                  value={item.date}
                  onChange={(event) => item.setDate(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Группа</Label>
                <Select value={item.groupId} onValueChange={item.setGroupId}>
                  <SelectTrigger aria-label="Группа">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={item.noneValue}>Без группы</SelectItem>
                    {item.groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {item.error ? <p className="text-sm text-destructive">{item.error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => item.setEditing(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={item.pending}>
                Сохранить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={item.confirmDelete} onOpenChange={item.setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить это дело?</AlertDialogTitle>
            <AlertDialogDescription>
              «{item.task.title}» исчезнет из ежедневника. Это нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {item.actionError ? <p className="text-sm text-destructive">{item.actionError}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Оставить</AlertDialogCancel>
            <AlertDialogAction
              disabled={item.pending}
              onClick={(event) => {
                event.preventDefault()
                void item.remove()
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
