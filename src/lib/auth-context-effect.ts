import { Effect } from "effect"
import { AppLayer } from "./app-services"
import { getAuthContext, requireAuth } from "./auth-service"
import type { AuthContext } from "./auth-service"

/**
 * Enhanced Server-side Authentication Utilities using Effect Services
 *
 * These functions use the Effect-based AuthService for better resource
 * management, configuration handling, and testability.
 */

/**
 * Get authenticated user session from request headers using Effect services
 * Used in route loaders to provide auth context
 */
export async function getAuthContextEffect(
  request: Request,
): Promise<AuthContext> {
  try {
    return await Effect.runPromise(
      getAuthContext(request)().pipe(Effect.provide(AppLayer)),
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
 * Require authentication for a route using Effect services
 * Throws redirect to sign-in if not authenticated
 */
export async function requireAuthEffect(
  request: Request,
): Promise<AuthContext> {
  try {
    return await Effect.runPromise(
      requireAuth(request)().pipe(Effect.provide(AppLayer)),
    )
  } catch (error) {
    console.error("Authentication failed:", error)
    throw new Response("Unauthorized", {
      status: 302,
      headers: {
        Location: "/sign-in",
      },
    })
  }
}

/**
 * Effect-based auth context for use in server functions
 * This version returns an Effect that can be composed with other operations
 */
export const getAuthContextEffect_ = (request: Request) =>
  getAuthContext(request)()

/**
 * Alternative version that throws on auth failure
 * This version returns an Effect that can be composed with other operations
 */
export const requireAuthEffect_ = (request: Request) => requireAuth(request)()

/**
 * Helper to run auth operations with proper error handling
 */
export const runAuthOperation = <T>(
  operation: Effect.Effect<T, Error, never>,
): Promise<T> =>
  Effect.runPromise(
    operation.pipe(
      Effect.provide(AppLayer),
      Effect.catchAll((error) =>
        Effect.sync(() => {
          console.error("Auth operation failed:", error)
          throw error
        }),
      ),
    ),
  )

/**
 * Check if a request is authenticated (non-throwing version)
 */
export async function isAuthenticated(request: Request): Promise<boolean> {
  try {
    const authContext = await getAuthContextEffect(request)
    return authContext.user !== null
  } catch {
    return false
  }
}
