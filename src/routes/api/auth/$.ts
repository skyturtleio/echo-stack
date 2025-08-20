import { createServerFileRoute } from "@tanstack/react-start/server"
import { Effect } from "effect"
import { AuthService } from "~/lib/auth-service"
import { AppLayer } from "~/lib/app-services"

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
  GET: ({ request }) => {
    return Effect.gen(function* () {
      const authService = yield* AuthService
      return authService.auth.handler(request)
    }).pipe(Effect.provide(AppLayer), Effect.runPromise)
  },
  POST: ({ request }) => {
    return Effect.gen(function* () {
      const authService = yield* AuthService
      return authService.auth.handler(request)
    }).pipe(Effect.provide(AppLayer), Effect.runPromise)
  },
})
