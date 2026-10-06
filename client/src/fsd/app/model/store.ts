import { combineReducers, configureStore } from "@reduxjs/toolkit"
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist"
import createWebStorage from "redux-persist/lib/storage/createWebStorage"

import { groupsReducer } from "@/entities/group"
import { sessionReducer } from "@/entities/session"
import { tasksReducer } from "@/entities/task"
import { thoughtsReducer } from "@/entities/thought"
import { pickDateReducer } from "@/features/pick-date"

function createPersistStorage() {
  if (typeof window === "undefined") {
    return {
      getItem() {
        return Promise.resolve(null)
      },
      setItem() {
        return Promise.resolve()
      },
      removeItem() {
        return Promise.resolve()
      },
    }
  }

  return createWebStorage("local")
}

const rootReducer = combineReducers({
  session: sessionReducer,
  tasks: tasksReducer,
  thoughts: thoughtsReducer,
  groups: groupsReducer,
  pickDate: pickDateReducer,
})

const persistedReducer = persistReducer(
  {
    key: "ezhednevnik-session",
    storage: createPersistStorage(),
    whitelist: ["session"],
  },
  rootReducer,
)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
