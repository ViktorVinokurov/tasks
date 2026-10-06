export type SessionUser = {
  id: string
  email: string
  name: string
}

export type AuthResponse = {
  accessToken: string
  user: SessionUser
}
