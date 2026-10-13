"use client"

import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { UserAvatar } from "@/shared/ui/user-avatar"

import { useEditProfile } from "../model/use-edit-profile"

export function ProfileForm() {
  const form = useEditProfile()

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>Фото и ФИО видны при передаче дела.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.onSaveProfile} className="grid gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar name={form.name || "?"} avatar={form.avatar} className="size-20 text-lg" />
              <div className="flex flex-wrap gap-2">
                <Label className="glass inline-flex h-8 cursor-pointer items-center rounded-full px-3 text-sm font-medium">
                  Выбрать фото
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      void form.onAvatar(event)
                    }}
                  />
                </Label>
                {form.avatar ? (
                  <Button type="button" variant="outline" onClick={form.clearAvatar}>
                    Убрать
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-name">ФИО</Label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(event) => form.setName(event.target.value)}
                maxLength={form.nameLimit}
                autoComplete="name"
                placeholder="Фамилия Имя Отчество"
              />
            </div>
            {form.profileError ? <p className="text-sm text-destructive">{form.profileError}</p> : null}
            {form.profileSaved ? <p className="text-sm text-muted-foreground">Профиль сохранён</p> : null}
            <div>
              <Button type="submit" disabled={form.profilePending}>
                Сохранить
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Пароль</CardTitle>
          <CardDescription>Текущий пароль нужен, чтобы задать новый.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.onSavePassword} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="profile-current-password">Текущий пароль</Label>
              <Input
                id="profile-current-password"
                type="password"
                value={form.currentPassword}
                onChange={(event) => form.setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="profile-next-password">Новый пароль</Label>
              <Input
                id="profile-next-password"
                type="password"
                value={form.nextPassword}
                onChange={(event) => form.setNextPassword(event.target.value)}
                maxLength={form.passwordLimit}
                autoComplete="new-password"
              />
            </div>
            {form.passwordError ? <p className="text-sm text-destructive">{form.passwordError}</p> : null}
            {form.passwordSaved ? <p className="text-sm text-muted-foreground">Пароль изменён</p> : null}
            <div>
              <Button type="submit" disabled={form.passwordPending}>
                Сменить пароль
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
