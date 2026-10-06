"use client"

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { todayISO } from "@/shared/lib/date"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

import { useDateSwitcher } from "../model/use-date-switcher"

export function DateSwitcher() {
  const date = useDateSwitcher()
  const today = todayISO()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="shrink-0"
          onClick={date.goPrev}
          aria-label="Предыдущий день"
        >
          <ChevronLeft />
        </Button>
        <div className="min-w-0 flex-1 sm:flex-none">
          <p className="truncate text-xl leading-tight font-bold sm:text-2xl">{date.title}</p>
          <p
            className={cn(
              "mt-1 text-sm leading-none",
              date.relative ? "text-muted-foreground" : "invisible",
            )}
          >
            {date.relative || "сегодня"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="shrink-0"
          onClick={date.goNext}
          aria-label="Следующий день"
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <Button
          type="button"
          variant="secondary"
          className="h-10"
          onClick={date.goToday}
          disabled={date.isToday}
        >
          Сегодня
        </Button>
        <Popover open={date.open} onOpenChange={date.setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="h-10" aria-label="Открыть календарь">
              <CalendarDays />
              Календарь
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[19rem]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={date.showPreviousMonth}
                aria-label="Предыдущий месяц"
              >
                <ChevronLeft />
              </Button>
              <p className="text-sm font-semibold">{date.monthTitle}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={date.showNextMonth}
                aria-label="Следующий месяц"
              >
                <ChevronRight />
              </Button>
            </div>
            <div className="grid grid-cols-7 text-xs text-muted-foreground">
              {date.weekdayLabels.map((label) => (
                <span key={label} className="flex h-8 items-center justify-center">
                  {label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {date.cells.map((cell) => {
                const selected = cell.iso === date.selectedDate
                const isToday = cell.iso === today
                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => date.selectDate(cell.iso)}
                    className={cn(
                      "mx-auto flex size-8 items-center justify-center rounded-lg text-sm transition-colors",
                      cell.inMonth ? "text-foreground" : "text-muted-foreground/50",
                      selected && "bg-primary text-primary-foreground",
                      !selected && isToday && "ring-1 ring-primary/50",
                      !selected && "hover:bg-muted",
                    )}
                  >
                    {cell.day}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
