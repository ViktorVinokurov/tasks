import type { NextConfig } from "next"
import { withSerwist } from "@serwist/turbopack"

function apiOrigin() {
  return (process.env.API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")
}

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Прокси в app/api ходит через fetch и не поднимает WebSocket.
    // Этот rewrite обрабатывает сервер Next.js до маршрута.
    return {
      beforeFiles: [
        {
          source: "/api/ws",
          destination: `${apiOrigin()}/api/ws`,
        },
      ],
    }
  },
}

export default withSerwist(nextConfig)
