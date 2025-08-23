import { createServerFileRoute } from "@tanstack/react-start/server"
import { Effect } from "effect"

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
  GET: async ({ request }) => {
    // Import services dynamically
    const { AuthService } = await import("~/lib/auth-service")
    const { AppLayer } = await import("~/lib/app-services")

    return Effect.gen(function* () {
      const authService = yield* AuthService
      return authService.auth.handler(request)
    }).pipe(Effect.provide(AppLayer), Effect.runPromise)
  },
  POST: async ({ request }) => {
    // Import services dynamically
    const { AuthService } = await import("~/lib/auth-service")
    const { AppLayer } = await import("~/lib/app-services")

    return Effect.gen(function* () {
      const authService = yield* AuthService
      return authService.auth.handler(request)
    }).pipe(Effect.provide(AppLayer), Effect.runPromise)
  },
})
