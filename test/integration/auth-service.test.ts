/**
 * Auth Service Usage Examples
 *
 * This demonstrates why the Effect-based auth service is better
 * than the current module-level initialization.
 */

import { Effect } from "effect"
import { AuthService } from "../../src/lib/auth-service"

// PROBLEM WITH CURRENT APPROACH (auth.server.ts):
// ================================================

/*
// This happens at module import time - can't be controlled:
const client = postgres(process.env.DATABASE_URL!)  // ❌ Fixed at import
const db = drizzle(client, { schema })               // ❌ Fixed at import  
export const auth = betterAuth({                     // ❌ Fixed at import
  database: drizzleAdapter(db, { provider: "pg" }),
  trustedOrigins: ["http://localhost:3000"],         // ❌ Hardcoded
})
*/

// Issues:
// 1. Environment variables read at import time (can't be mocked for testing)
// 2. Database connection created immediately (potential resource leak)
// 3. Configuration is hardcoded (can't change based on environment)
// 4. Hard to test (everything is a singleton)
// 5. No dependency injection (can't swap implementations)

// SOLUTION WITH EFFECT SERVICES:
// ==============================

/**
 * Example: Testing with mock auth service
 */
export const createMockAuthService = () =>
  AuthService.of({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    auth: {} as any, // Mock BetterAuth instance
    getSession: () =>
      Effect.succeed({
        user: {
          id: "test-user",
          email: "test@example.com",
          emailVerified: true,
          name: "Test User",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "test-session",
          userId: "test-user",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          token: "test-token",
        },
      }),
    signJWT: () => Effect.succeed("mock-jwt-token"),
    getAuthContext: () =>
      Effect.succeed({
        user: {
          id: "test-user",
          email: "test@example.com",
          emailVerified: true,
          name: "Test User",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "test-session",
          userId: "test-user",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          token: "test-token",
        },
        jwt: "mock-jwt-token",
      }),
    requireAuth: () =>
      Effect.succeed({
        user: {
          id: "test-user",
          email: "test@example.com",
          emailVerified: true,
          name: "Test User",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "test-session",
          userId: "test-user",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          token: "test-token",
        },
        jwt: "mock-jwt-token",
      }),
  })

/**
 * Example: Using auth service in application code
 */
export const protectedOperation = Effect.gen(function* () {
  const authService = yield* AuthService
  const headers = new Headers()

  // Get session with proper error handling
  const session = yield* authService.getSession(headers)
  if (!session) {
    return yield* Effect.fail(new Error("Authentication required"))
  }

  // Generate JWT
  const jwt = yield* authService.signJWT({
    sub: session.user.id,
    userId: session.user.id,
    email: session.user.email,
  })

  return {
    user: session.user,
    jwt,
  }
})

// BENEFITS OF EFFECT APPROACH:
// =============================

export const benefits = {
  "Resource Safety": "Database connections managed by Effect.acquireRelease",
  Testability: "Easy to mock AuthService for testing",
  Configuration: "Uses ConfigService for environment-specific settings",
  "Error Handling": "Structured errors with recovery strategies",
  "Dependency Injection": "Proper service composition with layers",
  "Environment Flexibility":
    "Different configs for dev/test/prod automatically",
  "Resource Cleanup": "Automatic cleanup on shutdown",
  "Type Safety": "Full TypeScript integration with Effect types",
}

// KEY DIFFERENCES:
// ================

export const comparison = {
  current: {
    initialization: "Module import time (immediate)",
    configuration: "Hardcoded environment variables",
    database: "Direct postgres client creation",
    testing: "Difficult - global singleton",
    resources: "Manual management required",
    errors: "Promise-based error handling",
  },

  withEffect: {
    initialization: "Lazy - when service is first used",
    configuration: "ConfigService with validation",
    database: "DatabaseService with resource management",
    testing: "Easy - injectable mock services",
    resources: "Automatic cleanup with acquireRelease",
    errors: "Structured errors with recovery strategies",
  },
}

// MIGRATION PATH:
// ===============

/*
// Old way (current auth.server.ts):
import { auth } from "~/lib/auth.server"
const session = await auth.api.getSession({ headers })

// New way (with Effect services):
import { AuthService } from "~/lib/auth-service"
const authService = yield* AuthService
const session = yield* authService.getSession(headers)

// Or in server functions:
const session = await Effect.runPromise(
  Effect.gen(function* () {
    const authService = yield* AuthService
    return yield* authService.getSession(headers)
  }).pipe(Effect.provide(AppLayer))
)
*/
