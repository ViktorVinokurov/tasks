"use client"

import { Search } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"

import { useTaskFilters, type TaskStatusFilter } from "../model/use-task-filters"

const STATUSES: { value: TaskStatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершённые" },
]

export function TaskFilters({
  filters,
}: {
  filters: ReturnType<typeof useTaskFilters>
}) {
  return (
    <div className="grid gap-4">
      <Tabs
        value={filters.status}
        onValueChange={(value) => filters.setStatus(value as TaskStatusFilter)}
      >
        <TabsList>
          {STATUSES.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              <span className="inline-flex items-center gap-1.5 leading-none">
                {item.label}
                <span className="text-xs leading-none tabular-nums">{filters.counts[item.value]}</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.query}
          onChange={(event) => filters.setQuery(event.target.value)}
          placeholder="Найти по словам"
          className="pl-9"
          aria-label="Поиск дел"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filters.groupId === "all"}
          onClick={() => filters.setGroupId("all")}
        >
          Все группы
        </FilterChip>
        {filters.groups.map((group) => (
          <FilterChip
            key={group.id}
            active={filters.groupId === group.id}
            onClick={() => filters.setGroupId(group.id)}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: group.color }}
              aria-hidden
            />
            {group.name}
          </FilterChip>
        ))}
        {filters.hasUngrouped ? (
          <FilterChip
            active={filters.groupId === "none"}
            onClick={() => filters.setGroupId("none")}
          >
            Без группы
          </FilterChip>
        ) : null}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className={cn("h-8 gap-1.5 rounded-full", !active && "bg-card")}
    >
      {children}
    </Button>
  )
}
