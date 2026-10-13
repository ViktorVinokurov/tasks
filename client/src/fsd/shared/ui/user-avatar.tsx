import { cn } from "@/shared/lib/utils"
import { initialsOf } from "@/shared/lib/initials"

type UserAvatarProps = {
  name: string
  avatar?: string | null
  className?: string
}

export function UserAvatar({ name, avatar, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-xs font-semibold text-primary",
        className,
      )}
      aria-hidden
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="size-full object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}
