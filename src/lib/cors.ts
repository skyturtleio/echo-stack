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
  origin:
    | string[]
    | string
    | boolean
    | ((
        origin: string,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => void)
  methods: string[]
  allowedHeaders: string[]
  credentials: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

// =============================================================================
// CORS Utilities
// =============================================================================

const createCorsHeaders = (request: Request, options: CorsOptions): Headers => {
  const headers = new Headers()

  // Handle origin
  if (typeof options.origin === "boolean" && options.origin) {
    headers.set("Access-Control-Allow-Origin", "*")
  } else if (typeof options.origin === "string") {
    headers.set("Access-Control-Allow-Origin", options.origin)
  } else if (Array.isArray(options.origin)) {
    const requestOrigin = request.headers.get("origin")
    if (requestOrigin && options.origin.includes(requestOrigin)) {
      headers.set("Access-Control-Allow-Origin", requestOrigin)
    }
  }

  // Handle methods
  if (options.methods.length > 0) {
    headers.set("Access-Control-Allow-Methods", options.methods.join(", "))
  }

  // Handle allowed headers
  if (options.allowedHeaders.length > 0) {
    headers.set(
      "Access-Control-Allow-Headers",
      options.allowedHeaders.join(", "),
    )
  }

  // Handle credentials
  if (options.credentials) {
    headers.set("Access-Control-Allow-Credentials", "true")
  }

  // Handle max age
  if (options.maxAge) {
    headers.set("Access-Control-Max-Age", options.maxAge.toString())
  }

  return headers
}

// =============================================================================
// CORS Service
// =============================================================================

export const CorsService = () =>
  Effect.gen(function* () {
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
        // Production: Restrict to specific trusted origins
        return {
          origin: (
            origin: string,
            callback: (err: Error | null, allow?: boolean) => void,
          ) => {
            // Allow requests with no origin (like mobile apps or Postman)
            if (!origin) return callback(null, true)

            const allowedOrigins = [
              config.auth.url,
              // Add other trusted origins here
              "https://yourdomain.com",
            ]

            if (allowedOrigins.indexOf(origin) !== -1) {
              callback(null, true)
            } else {
              callback(new Error("Not allowed by CORS"))
            }
          },
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization"],
          credentials: true,
          maxAge: 86400,
          optionsSuccessStatus: 200,
        }
      }

      // Test environment: similar to development but more restrictive
      return {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
        maxAge: 3600, // 1 hour
        optionsSuccessStatus: 200,
      }
    }

    const validateOrigin = (request: Request): boolean => {
      const origin = request.headers.get("origin")
      const options = getCorsOptions()

      if (typeof options.origin === "boolean") return options.origin
      if (typeof options.origin === "string") return options.origin === origin
      if (Array.isArray(options.origin))
        return origin ? options.origin.includes(origin) : false

      return false
    }

    const handleCorsRequest = (request: Request): Response | null => {
      const method = request.method

      if (method === "OPTIONS") {
        // Handle preflight request
        const options = getCorsOptions()
        const corsHeaders = createCorsHeaders(request, options)

        return new Response(null, {
          status: options.optionsSuccessStatus || 204,
          headers: corsHeaders,
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
export const createCorsMiddleware = () =>
  Effect.gen(function* () {
    const corsService = yield* CorsService()

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
    const corsService = yield* CorsService()
    return corsService.addCorsHeaders(request, response)
  })
