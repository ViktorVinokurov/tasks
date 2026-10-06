"use client"

import type { Group } from "@/entities/group"
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

import { useDeleteGroup } from "../model/use-manage-group"

type DeleteGroupDialogProps = {
  group: Group | null
  onOpenChange: (open: boolean) => void
}

export function DeleteGroupDialog({ group, onOpenChange }: DeleteGroupDialogProps) {
  const deletion = useDeleteGroup(group, () => onOpenChange(false))

  return (
    <AlertDialog open={Boolean(group)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить группу «{group?.name}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Дела останутся в ежедневнике, только уже без этой группы.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Оставить</AlertDialogCancel>
          <AlertDialogAction onClick={deletion.confirm}>Удалить группу</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
