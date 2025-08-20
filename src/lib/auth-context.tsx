import { Effect } from "effect"
import type { Session, User } from "better-auth/types"
import {
  getAuthContext as getAuthContextEffect,
  requireAuth as requireAuthEffect,
} from "./auth-service"
import { AppLayer } from "./app-services"

/**
 * Server-side authentication utilities for TanStack Start
 *
 * These functions are used in route loaders and actions
 * to check authentication status and provide user data
 */

export interface AuthContext {
  user: User | null
  session: Session | null
  jwt: string | null
}

/**
 * Get authenticated user session from request headers
 * Used in route loaders to provide auth context
 */
export async function getAuthContext(request: Request): Promise<AuthContext> {
  try {
    return await getAuthContextEffect(request).pipe(
      Effect.provide(AppLayer),
      Effect.runPromise,
    )
  } catch (error) {
    console.error("Auth context error:", error)
    return {
      user: null,
      session: null,
      jwt: null,
    }
  }
}

/**
 * Require authentication for a route
 * Throws redirect to sign-in if not authenticated
 */
export async function requireAuth(request: Request): Promise<AuthContext> {
  try {
    return await requireAuthEffect(request).pipe(
      Effect.provide(AppLayer),
      Effect.runPromise,
    )
  } catch {
    throw new Response("Unauthorized", {
      status: 302,
      headers: {
        Location: "/sign-in",
      },
    })
  }
}
