"use client"

import { MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react"

import { SubtaskEditor, TaskRow } from "@/entities/task"
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
import { UserAvatar } from "@/shared/ui/user-avatar"
import { cn } from "@/shared/lib/utils"
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
        onSubtasksChange={(subtasks) => {
          void item.changeSubtasks(subtasks)
        }}
        subtasksDisabled={item.pending}
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
              <DropdownMenuItem onSelect={() => item.openTransfer()}>
                <Send />
                Передать
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
            <DialogDescription>Можно поправить текст, описание, подзадачи, дату и группу.</DialogDescription>
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
              <Label htmlFor={`task-note-${item.task.id}`}>Описание</Label>
              <Textarea
                id={`task-note-${item.task.id}`}
                value={item.note}
                onChange={(event) => item.setNote(event.target.value)}
                maxLength={item.noteLimit}
                placeholder="Что важно учесть"
              />
              <SubtaskEditor
                items={item.subtasks}
                onChange={item.setSubtasks}
                disabled={item.pending}
                startOpen
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

      <Dialog open={item.transferOpen} onOpenChange={item.setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Передать дело</DialogTitle>
            <DialogDescription>
              «{item.task.title}» появится у другого пользователя. Если у него нет такой группы, она создастся сама.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={item.transfer} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`task-transfer-${item.task.id}`}>Имя</Label>
              <Input
                id={`task-transfer-${item.task.id}`}
                value={item.query}
                onChange={(event) => item.setQuery(event.target.value)}
                placeholder="Начните вводить имя"
                autoComplete="off"
              />
            </div>
            {item.searching ? <p className="text-sm text-muted-foreground">Ищу…</p> : null}
            {item.query.trim() && !item.searching && item.people.length === 0 && !item.transferError ? (
              <p className="text-sm text-muted-foreground">Никого с таким именем нет</p>
            ) : null}
            {item.people.length > 0 ? (
              <ul className="grid max-h-60 gap-1 overflow-y-auto">
                {item.people.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      aria-pressed={item.selectedId === person.id}
                      onClick={() => item.selectPerson(person)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left",
                        item.selectedId === person.id ? "bg-foreground/8" : "hover:bg-foreground/5",
                      )}
                    >
                      <UserAvatar name={person.name} avatar={person.avatar} />
                      <span className="min-w-0 truncate text-sm font-semibold">{person.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {item.transferError ? <p className="text-sm text-destructive">{item.transferError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => item.setTransferOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={item.pending || !item.selectedId}>
                Передать
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
