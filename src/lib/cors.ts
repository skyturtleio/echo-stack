/**
 * CORS Configuration - Echo Stack
 *
 * Provides secure CORS settings for both development and production environments.
 * Automatically configures based on environment and validates allowed origins.
 */

import { Effect } from "effect"
import { ConfigService } from "./config-service"

// =============================================================================
// CORS Types
// =============================================================================

export interface CorsOptions {
  origin: string[] | string | boolean
  methods: string[]
  allowedHeaders: string[]
  credentials: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

// =============================================================================
// CORS Service
// =============================================================================

export const CorsService = Effect.gen(function* () {
  const configService = yield* ConfigService
  const config = yield* configService.getConfig()

  const getCorsOptions = (): CorsOptions => {
    const isDevelopment = config.environment === "development"
    const isProduction = config.environment === "production"

    if (isDevelopment) {
      // Development: Allow all origins for ease of development
      return {
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Accept",
          "Origin",
        ],
        credentials: true,
        maxAge: 86400, // 24 hours
        optionsSuccessStatus: 200,
      }
    }

    if (isProduction) {
      // Production: Strict origin validation - get from environment directly
      const corsOriginsEnv = process.env.CORS_ALLOWED_ORIGINS

      if (!corsOriginsEnv) {
        throw new Error("CORS_ALLOWED_ORIGINS must be configured in production")
      }

      const allowedOrigins = corsOriginsEnv
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)

      return {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Accept",
        ],
        credentials: true,
        maxAge: 86400,
        optionsSuccessStatus: 204,
      }
    }

    // Test environment: Minimal CORS for testing
    return {
      origin: false,
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
      maxAge: 0,
    }
  }

  const validateOrigin = (
    origin: string,
    allowedOrigins: string[],
  ): boolean => {
    if (!origin) return false

    for (const allowed of allowedOrigins) {
      // Support wildcard subdomains (e.g., "*.example.com")
      if (allowed.startsWith("*.")) {
        const domain = allowed.slice(2)
        if (origin.endsWith(`.${domain}`) || origin === domain) {
          return true
        }
      } else if (origin === allowed) {
        return true
      }
    }

    return false
  }

  const createCorsHeaders = (
    request: Request,
    options: CorsOptions,
  ): Headers => {
    const headers = new Headers()
    const origin = request.headers.get("origin")

    // Handle origin
    if (options.origin === true) {
      headers.set("Access-Control-Allow-Origin", origin || "*")
    } else if (typeof options.origin === "string") {
      headers.set("Access-Control-Allow-Origin", options.origin)
    } else if (Array.isArray(options.origin) && origin) {
      if (validateOrigin(origin, options.origin)) {
        headers.set("Access-Control-Allow-Origin", origin)
      }
    }

    // Set credentials
    if (options.credentials) {
      headers.set("Access-Control-Allow-Credentials", "true")
    }

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      headers.set("Access-Control-Allow-Methods", options.methods.join(", "))
      headers.set(
        "Access-Control-Allow-Headers",
        options.allowedHeaders.join(", "),
      )

      if (options.maxAge !== undefined) {
        headers.set("Access-Control-Max-Age", options.maxAge.toString())
      }
    }

    // Set vary header to ensure proper caching
    headers.set("Vary", "Origin")

    return headers
  }

  const handleCorsRequest = (request: Request): Response | null => {
    const options = getCorsOptions()

    if (request.method === "OPTIONS") {
      // Handle preflight request
      const headers = createCorsHeaders(request, options)
      return new Response(null, {
        status: options.optionsSuccessStatus || 204,
        headers,
      })
    }

    return null // Let the request continue
  }

  const addCorsHeaders = (request: Request, response: Response): Response => {
    const options = getCorsOptions()
    const corsHeaders = createCorsHeaders(request, options)

    // Add CORS headers to existing response
    corsHeaders.forEach((value, key) => {
      response.headers.set(key, value)
    })

    return response
  }

  return {
    getCorsOptions,
    handleCorsRequest,
    addCorsHeaders,
    validateOrigin,
  } as const
})

// =============================================================================
// Middleware Helper
// =============================================================================

/**
 * Creates a CORS middleware function for use with TanStack Start
 */
export const createCorsMiddleware = Effect.gen(function* () {
  const corsService = yield* CorsService

  return (request: Request): Response | null => {
    return corsService.handleCorsRequest(request)
  }
})

// =============================================================================
// Response Helper
// =============================================================================

/**
 * Adds CORS headers to a response
 */
export const withCorsHeaders = (request: Request, response: Response) =>
  Effect.gen(function* () {
    const corsService = yield* CorsService
    return corsService.addCorsHeaders(request, response)
  })
