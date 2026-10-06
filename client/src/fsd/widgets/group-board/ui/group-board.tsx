"use client"

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"

import { DeleteGroupDialog, GroupFormDialog } from "@/features/manage-group"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { MotionList } from "@/shared/ui/motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

import { useGroupBoard } from "../model/use-group-board"

export function GroupBoard() {
  const board = useGroupBoard()

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Группы</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Раскладывайте дела по полочкам. Цвет помогает узнавать группу с первого взгляда.
          </p>
        </div>
        <Button type="button" size="lg" className="shrink-0" onClick={board.startCreate}>
          <Plus className="transition-transform duration-300 ease-out-soft group-hover/button:rotate-90" />
          Новая группа
        </Button>
      </section>

      <MotionList
        className="grid gap-3 sm:grid-cols-2"
        items={board.cards.map(({ group, caption }) => ({
          id: group.id,
          content: (
            <Card className="transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(62,48,32,0.45)]">
              <CardHeader className="flex-row items-center justify-between gap-3 pb-5">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: group.color }}
                      aria-hidden
                    />
                    <span className="truncate">{group.name}</span>
                  </CardTitle>
                  <CardDescription className="mt-2">{caption}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Действия для группы ${group.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => board.startEdit(group)}>
                      <Pencil />
                      Изменить
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => board.startDelete(group)}>
                      <Trash2 />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
            </Card>
          ),
        }))}
        empty={
          <Card>
            <CardContent className="py-5">
              <p className="text-sm leading-6 text-muted-foreground">
                Групп пока нет. Создайте первую — например, «Дом» или «Учёба».
              </p>
            </CardContent>
          </Card>
        }
      />

      <GroupFormDialog
        open={board.formOpen}
        group={board.editingGroup}
        onOpenChange={(open) => {
          if (!open) board.closeForm()
        }}
      />
      <DeleteGroupDialog
        group={board.deletingGroup}
        onOpenChange={(open) => {
          if (!open) board.closeDelete()
        }}
      />
    </div>
  )
}
