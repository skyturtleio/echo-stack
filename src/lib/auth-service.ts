import { betterAuth, Session, User } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { reactStartCookies } from "better-auth/react-start"
import { jwt } from "better-auth/plugins"
import { Effect, Layer, Context } from "effect"
import { ConfigService } from "./config-service"
import { DatabaseService } from "../server/db/database-service"
import { sendVerificationEmail } from "./email.server"

/**
 * Enhanced Auth Service with Effect Integration
 *
 * This service creates BetterAuth instances using Effect services for
 * configuration and database connections, providing better resource
 * management and testability.
 */

export type Auth =
  | { isAuthenticated: false; user: null; session: null }
  | { isAuthenticated: true; user: User; session: Session }

export type BetterAuthInstance = ReturnType<typeof betterAuth>

/**
 * Auth Service interface
 */
export interface AuthService {
  readonly auth: BetterAuthInstance
  readonly getSession: (
    headers: Headers,
  ) => Effect.Effect<{ user: User; session: Session } | null, Error>
  readonly signJWT: (payload: {
    sub: string
    userId: string
    email: string
  }) => Effect.Effect<string, Error>
  readonly getAuthContext: (
    request: Request,
  ) => Effect.Effect<AuthContext, Error>
  readonly requireAuth: (request: Request) => Effect.Effect<AuthContext, Error>
}

export interface AuthContext {
  user: User | null
  session: Session | null
  jwt: string | null
}

/**
 * Auth Service tag
 */
export const AuthService = Context.GenericTag<AuthService>("@app/AuthService")

/**
 * Create BetterAuth instance with Effect services
 */
const createAuthInstance = Effect.gen(function* () {
  // Get services
  const configService = yield* ConfigService
  const dbService = yield* DatabaseService

  // Get configuration
  const config = yield* configService.getConfig()
  const authConfig = yield* configService.getAuthConfig()

  // Create BetterAuth instance with proper configuration
  const authInstance = betterAuth({
    trustedOrigins: [
      authConfig.url,
      // Add environment-specific origins
      config.environment === "development"
        ? ["http://localhost:3000", "http://localhost:3001"]
        : [],
    ].flat(),

    database: drizzleAdapter(dbService.query, {
      provider: "pg",
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },

    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: any
        url: string
      }) => {
        console.log(
          "🔄 BetterAuth calling sendVerificationEmail for:",
          user.email,
        )
        console.log("📧 Verification URL:", url)
        try {
          await sendVerificationEmail({
            to: user.email,
            name: user.name || user.email.split("@")[0],
            verificationUrl: url,
          })
          console.log("✅ Verification email sent successfully to:", user.email)
        } catch (error) {
          console.error("❌ Failed to send verification email:", error)
          throw new Error("Failed to send verification email")
        }
      },
    },

    plugins: [
      jwt({
        jwks: {
          keyPairConfig: {
            alg: "EdDSA",
            crv: "Ed25519",
          },
        },
        jwt: {
          issuer: "echo-stack-app",
        },
      }),
      reactStartCookies(),
    ],
  })

  return authInstance
})

/**
 * Auth Service implementation
 */
const AuthServiceLive = Layer.effect(
  AuthService,
  Effect.gen(function* () {
    const authInstance = yield* createAuthInstance

    return AuthService.of({
      auth: authInstance,

      getSession: (headers: Headers) =>
        Effect.tryPromise({
          try: () => authInstance.api.getSession({ headers }),
          catch: (error) => new Error(`Failed to get session: ${error}`),
        }),

      signJWT: (payload: { sub: string; userId: string; email: string }) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: () =>
              authInstance.api.signJWT({
                body: { payload },
              }),
            catch: (error) => new Error(`Failed to sign JWT: ${error}`),
          })

          // Extract token from result - BetterAuth returns { token: string } or string
          return typeof result === "string" ? result : result.token
        }),

      getAuthContext: (request: Request) =>
        Effect.gen(function* () {
          const session = yield* Effect.tryPromise({
            try: () =>
              authInstance.api.getSession({ headers: request.headers }),
            catch: (error) => new Error(`Failed to get session: ${error}`),
          })

          if (!session) {
            return {
              user: null,
              session: null,
              jwt: null,
            }
          }

          // Generate JWT for Triplit integration
          const jwt = yield* Effect.tryPromise({
            try: async () => {
              const jwtResult = await authInstance.api.signJWT({
                body: {
                  payload: {
                    sub: session.user.id,
                    userId: session.user.id,
                    email: session.user.email,
                  },
                },
              })
              return typeof jwtResult === "string" ? jwtResult : jwtResult.token
            },
            catch: (error) => new Error(`Failed to sign JWT: ${error}`),
          })

          return {
            user: session.user,
            session: session.session,
            jwt,
          }
        }),

      requireAuth: (request: Request) =>
        Effect.gen(function* () {
          const session = yield* Effect.tryPromise({
            try: () =>
              authInstance.api.getSession({ headers: request.headers }),
            catch: (error) => new Error(`Failed to get session: ${error}`),
          })

          if (!session) {
            return yield* Effect.fail(new Error("Authentication required"))
          }

          // Generate JWT for authenticated user
          const jwt = yield* Effect.tryPromise({
            try: async () => {
              const jwtResult = await authInstance.api.signJWT({
                body: {
                  payload: {
                    sub: session.user.id,
                    userId: session.user.id,
                    email: session.user.email,
                  },
                },
              })
              return typeof jwtResult === "string" ? jwtResult : jwtResult.token
            },
            catch: (error) => new Error(`Failed to sign JWT: ${error}`),
          })

          return {
            user: session.user,
            session: session.session,
            jwt,
          }
        }),
    })
  }),
)

/**
 * Auth Service Layer with dependencies
 */
export const AuthServiceLayer = AuthServiceLive

/**
 * Utility functions for auth operations
 */
export const getSession = (headers: Headers) =>
  Effect.gen(function* () {
    const authService = yield* AuthService
    return yield* authService.getSession(headers)
  })

export const getAuthContext = (request: Request) =>
  Effect.gen(function* () {
    const authService = yield* AuthService
    return yield* authService.getAuthContext(request)
  })

export const requireAuth = (request: Request) =>
  Effect.gen(function* () {
    const authService = yield* AuthService
    return yield* authService.requireAuth(request)
  })
