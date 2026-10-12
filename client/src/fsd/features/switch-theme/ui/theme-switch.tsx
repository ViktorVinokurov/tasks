"use client"

import { Check, Monitor, Moon, Sun } from "lucide-react"

import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

import { useTheme } from "../model/use-theme"
import type { ThemeMode } from "../model/theme"

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "Системная" },
  { mode: "light", label: "Светлая" },
  { mode: "dark", label: "Тёмная" },
]

export function ThemeSwitch() {
  const theme = useTheme()
  const Icon = theme.mode === "system" ? Monitor : theme.dark ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" aria-label="Тема оформления">
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option.mode} onSelect={() => theme.setMode(option.mode)}>
            <Check className={option.mode === theme.mode ? "size-4 opacity-100" : "size-4 opacity-0"} />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
