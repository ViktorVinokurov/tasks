"use client"

import { BookOpen } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Collapse, MotionSwap } from "@/shared/ui/motion"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs"

import { useAuthForm } from "../model/use-auth-form"

export function AuthScreen() {
  const form = useAuthForm()

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="motion-rise w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <BookOpen className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-6">Ежедневник</span>
            <span className="block text-sm text-muted-foreground">дела и мысли только ваши</span>
          </span>
        </div>
        <Card>
          <CardHeader>
            <MotionSwap id={form.mode} axis="y" className="grid gap-1">
              <CardTitle>{form.mode === "login" ? "Вход" : "Новый аккаунт"}</CardTitle>
              <CardDescription>
                {form.mode === "login"
                  ? "Почта и пароль от вашего дневника."
                  : "После регистрации появятся группы Личное, Работа и Здоровье."}
              </CardDescription>
            </MotionSwap>
          </CardHeader>
          <CardContent>
            <Tabs
              value={form.mode}
              onValueChange={(value) => form.setMode(value === "register" ? "register" : "login")}
            >
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="login" className="flex-1">
                  Вход
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1">
                  Регистрация
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <form onSubmit={form.onSubmit} className="grid">
              <Collapse open={form.mode === "register"}>
                <div className="grid gap-1.5 pb-3">
                  <Label htmlFor="auth-name">Имя</Label>
                  <Input
                    id="auth-name"
                    value={form.name}
                    onChange={(event) => form.setName(event.target.value)}
                    placeholder="Как к вам обращаться"
                    maxLength={form.nameLimit}
                    autoComplete="name"
                    className="h-10"
                  />
                </div>
              </Collapse>
              <div className="grid gap-1.5 pb-3">
                <Label htmlFor="auth-email">Почта</Label>
                <Input
                  id="auth-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => form.setEmail(event.target.value)}
                  placeholder="anna@example.com"
                  maxLength={form.emailLimit}
                  autoComplete="email"
                  required
                  className="h-10"
                />
              </div>
              <div className="grid gap-1.5 pb-3">
                <Label htmlFor="auth-password">Пароль</Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => form.setPassword(event.target.value)}
                  placeholder="Не короче 8 символов"
                  maxLength={form.passwordLimit}
                  autoComplete={form.mode === "login" ? "current-password" : "new-password"}
                  required
                  className="h-10"
                />
              </div>
              {form.error ? <p className="motion-rise pb-3 text-sm text-destructive">{form.error}</p> : null}
              <Button type="submit" size="lg" className="mt-1 w-full" disabled={form.pending}>
                {form.pending
                  ? "Секунду…"
                  : form.mode === "login"
                    ? "Войти"
                    : "Создать аккаунт"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
