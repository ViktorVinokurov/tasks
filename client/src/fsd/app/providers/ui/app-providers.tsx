"use client"

import { SerwistProvider } from "@serwist/turbopack/react"
import type { ReactNode } from "react"
import { Provider } from "react-redux"
import { PersistGate } from "redux-persist/integration/react"

import { persistor, store } from "@/app/model/store"
import { SessionGate } from "@/features/auth"

import { DiarySplash } from "./diary-splash"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/serwist/sw.js"
      disable={process.env.NODE_ENV !== "production"}
    >
      <Provider store={store}>
        <PersistGate loading={<DiarySplash />} persistor={persistor}>
          <SessionGate>{children}</SessionGate>
        </PersistGate>
      </Provider>
    </SerwistProvider>
  )
}
