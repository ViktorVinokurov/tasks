import { ProfileForm } from "@/features/edit-profile"

export function ProfilePage() {
  return (
    <div className="mx-auto grid w-full max-w-lg gap-4">
      <h1 className="text-2xl font-bold">Профиль</h1>
      <ProfileForm />
    </div>
  )
}
