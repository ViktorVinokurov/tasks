export type SessionUser = {
  id: string
  email: string
  name: string
  avatar: string | null
}

export type DirectoryUser = {
  id: string
  name: string
  avatar: string | null
}

export type AuthResponse = {
  accessToken: string
  user: SessionUser
}
