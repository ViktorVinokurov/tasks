"use client"

import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"

import { ApiError, apiRequest } from "@/shared/api/client"

import { selectToken } from "./selectors"
import { clearSession } from "./slice"

export function useDiaryApi() {
  const token = useSelector(selectToken)
  const dispatch = useDispatch()

  return useCallback(
    async function request<T>(path: string, options: { method?: string; body?: unknown } = {}) {
      try {
        return await apiRequest<T>(path, { ...options, token })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) dispatch(clearSession())
        throw error
      }
    },
    [dispatch, token],
  )
}
