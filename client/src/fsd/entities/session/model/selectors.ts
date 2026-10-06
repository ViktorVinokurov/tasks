import type { SessionState } from "./slice"

export type WithSession = { session: SessionState }

export function selectToken(state: WithSession) {
  return state.session.token
}

export function selectUser(state: WithSession) {
  return state.session.user
}
