/**
 * Rate Limiting Service - Echo Stack
 *
 * Basic in-memory rate limiting for API endpoints with configurable windows
 * and request limits. Suitable for single-instance deployments.
 */

import { Effect, Context, Layer, Ref, Clock } from "effect"
import { type RateLimitConfig } from "./validation"
import { createApiRateLimitError } from "./errors"

// Rate limit entry for tracking requests
interface RateLimitEntry {
  count: number
  resetTime: number
}

// Rate limiting service interface
export interface RateLimiter {
  checkLimit: (key: string) => Effect.Effect<void, unknown>
  getRemainingRequests: (key: string) => Effect.Effect<number>
  resetLimit: (key: string) => Effect.Effect<void>
}

// Rate limiter context
export const RateLimiter = Context.GenericTag<RateLimiter>(
  "@echo-stack/RateLimiter",
)

// Create in-memory rate limiter implementation
const createInMemoryRateLimiter = (config: RateLimitConfig) =>
  Effect.gen(function* () {
    const store = yield* Ref.make<Map<string, RateLimitEntry>>(new Map())

    const cleanupExpiredEntries = Effect.gen(function* () {
      const now = yield* Clock.currentTimeMillis
      const currentStore = yield* Ref.get(store)
      const cleanedStore = new Map()

      for (const [key, entry] of currentStore.entries()) {
        if (entry.resetTime > now) {
          cleanedStore.set(key, entry)
        }
      }

      yield* Ref.set(store, cleanedStore)
    })

    const checkLimit = (key: string) =>
      Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis
        const currentStore = yield* Ref.get(store)
        const entry = currentStore.get(key)

        // No previous requests or window expired
        if (!entry || entry.resetTime <= now) {
          const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + config.windowMs,
          }
          const newStore = new Map(currentStore)
          newStore.set(key, newEntry)
          yield* Ref.set(store, newStore)
          return
        }

        // Check if limit exceeded
        if (entry.count >= config.maxRequests) {
          const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
          yield* Effect.fail(
            createApiRateLimitError(
              config.windowMs,
              config.maxRequests,
              retryAfter,
            ),
          )
          return
        }

        // Increment count
        const updatedEntry: RateLimitEntry = {
          ...entry,
          count: entry.count + 1,
        }
        const newStore = new Map(currentStore)
        newStore.set(key, updatedEntry)
        yield* Ref.set(store, newStore)

        // Cleanup expired entries occasionally
        if (Math.random() < 0.01) {
          yield* Effect.fork(cleanupExpiredEntries)
        }
      })

    const getRemainingRequests = (key: string) =>
      Effect.gen(function* () {
        const now = yield* Clock.currentTimeMillis
        const currentStore = yield* Ref.get(store)
        const entry = currentStore.get(key)

        if (!entry || entry.resetTime <= now) {
          return config.maxRequests
        }

        return Math.max(0, config.maxRequests - entry.count)
      })

    const resetLimit = (key: string) =>
      Effect.gen(function* () {
        const currentStore = yield* Ref.get(store)
        const newStore = new Map(currentStore)
        newStore.delete(key)
        yield* Ref.set(store, newStore)
      })

    return RateLimiter.of({
      checkLimit,
      getRemainingRequests,
      resetLimit,
    })
  })

// Default rate limit configurations for different endpoints
export const authRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Conservative limit for auth operations
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

export const apiRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // General API operations
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

// Create rate limiter layer with specific configuration
export const createRateLimiterLayer = (config: RateLimitConfig) =>
  Layer.effect(RateLimiter, createInMemoryRateLimiter(config))

// Default rate limiter layers
export const AuthRateLimiterLayer = createRateLimiterLayer(authRateLimitConfig)
export const ApiRateLimiterLayer = createRateLimiterLayer(apiRateLimitConfig)

/**
 * Rate limiting utilities for different key strategies
 */

// Generate rate limit key from IP address
export const createIpKey = (ip: string, endpoint: string) =>
  `ip:${ip}:${endpoint}`

// Generate rate limit key from user ID
export const createUserKey = (userId: string, endpoint: string) =>
  `user:${userId}:${endpoint}`

// Generate rate limit key from email (for auth endpoints)
export const createEmailKey = (email: string, endpoint: string) =>
  `email:${email}:${endpoint}`

/**
 * Extract IP address from request (works with common proxy headers)
 */
export const extractIpAddress = (request: Request): string => {
  // Check common proxy headers
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // Take the first IP in the chain
    return forwarded.split(",")[0]?.trim() || "unknown"
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }

  // Fallback - this won't work in production behind proxies
  return "unknown"
}

/**
 * Higher-order function to wrap TanStack Start server functions with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  rateLimiter: Effect.Effect<RateLimiter>,
  keyGenerator: (request: Request, ...args: Parameters<T>) => string,
) {
  return (handler: T) =>
    (async (request: Request, ...args: Parameters<T>) => {
      const key = keyGenerator(request, ...args)

      // Run rate limit check
      const checkResult = await Effect.runPromise(
        Effect.gen(function* () {
          const limiter = yield* rateLimiter
          yield* limiter.checkLimit(key)
          return { success: true }
        }).pipe(
          Effect.catchAll((error) => Effect.succeed({ rateLimitError: error })),
        ),
      )

      // Check if rate limited
      if ("rateLimitError" in checkResult) {
        return Response.json(
          {
            success: false,
            error: "Too many requests",
            code: "RATE_LIMIT_EXCEEDED",
          },
          {
            status: 429,
            headers: {
              "Retry-After": "900", // 15 minutes in seconds
            },
          },
        )
      }

      // Call the actual handler
      return handler(request, ...args)
    }) as T
}

/**
 * Common rate limiting patterns
 */

// Rate limit by IP address
export const withIpRateLimit = (
  endpoint: string,
  config: RateLimitConfig = apiRateLimitConfig,
) =>
  withRateLimit(
    Effect.provide(RateLimiter, createRateLimiterLayer(config)),
    (request: Request) => createIpKey(extractIpAddress(request), endpoint),
  )

// Rate limit by email (for auth endpoints)
export const withEmailRateLimit = (
  endpoint: string,
  config: RateLimitConfig = authRateLimitConfig,
) =>
  withRateLimit(
    Effect.provide(RateLimiter, createRateLimiterLayer(config)),
    (request: Request) => {
      // Extract email from request body (for POST requests)
      // This would need to be adapted based on how the request data is passed
      const ip = extractIpAddress(request)
      return createIpKey(ip, endpoint) // Fallback to IP-based limiting
    },
  )
