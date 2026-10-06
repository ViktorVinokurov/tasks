"use client"

import { Plus } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Collapse } from "@/shared/ui/motion"
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

import { useAddTask } from "../model/use-add-task"

export function AddTaskForm({ date }: { date: string }) {
  const form = useAddTask(date)

  return (
    <form onSubmit={form.onSubmit} className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Label htmlFor="task-title" className="sr-only">
          Новое дело
        </Label>
        <Input
          id="task-title"
          value={form.title}
          onChange={(event) => form.setTitle(event.target.value)}
          placeholder="Что важно сделать?"
          maxLength={form.titleLimit}
          aria-invalid={Boolean(form.error)}
          className="h-10"
        />
        <Button type="submit" size="lg" className="w-full shrink-0 sm:w-auto" disabled={form.pending}>
          <Plus className="transition-transform duration-300 ease-out-soft group-hover/button:rotate-90" />
          Добавить
        </Button>
      </div>
      {form.error ? <p className="motion-rise text-sm text-destructive">{form.error}</p> : null}
      <div className="grid">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={form.groupId} onValueChange={form.setGroupId}>
          <SelectTrigger className="h-10 w-full sm:w-56" aria-label="Группа">
            <SelectValue placeholder="Группа" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={form.noneValue}>Без группы</SelectItem>
            {form.groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full sm:w-auto"
          onClick={() => form.setShowNote(!form.showNote)}
        >
          {form.showNote ? "Скрыть пометку" : "Добавить пометку"}
        </Button>
      </div>
      <Collapse open={form.showNote}>
        <Textarea
          value={form.note}
          onChange={(event) => form.setNote(event.target.value)}
          placeholder="Короткая пометка, если нужно"
          maxLength={form.noteLimit}
          className="mt-3 min-h-20"
        />
      </Collapse>
      </div>
    </form>
  )
}
