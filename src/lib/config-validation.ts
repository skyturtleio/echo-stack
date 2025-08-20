import { Config, Effect, Redacted } from "effect"

/**
 * Configuration Validation Utilities
 *
 * This module provides validation functions for configuration values
 * to ensure they meet specific requirements and formats.
 */

/**
 * Validate that a URL is properly formatted
 */
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate that a database URL has the correct format
 */
export const validateDatabaseUrl = (url: string): boolean => {
  return url.startsWith("postgresql://") || url.startsWith("postgres://")
}

/**
 * Validate that a port number is within valid range
 */
export const validatePort = (port: number): boolean => {
  return port > 0 && port <= 65535
}

/**
 * Validate that an email address has a basic valid format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Enhanced database configuration with validation (legacy single URL)
 */
export const ValidatedDatabaseConfig = Config.string("DATABASE_URL").pipe(
  Config.validate({
    message: "DATABASE_URL must be a valid PostgreSQL connection string",
    validation: validateDatabaseUrl,
  }),
)

/**
 * Enhanced database configuration with Phoenix-style auto-naming
 */
export const ValidatedDatabaseBaseConfig = Config.string(
  "DATABASE_BASE_URL",
).pipe(
  Config.validate({
    message:
      "DATABASE_BASE_URL must be a valid PostgreSQL connection string without database name",
    validation: (url: string) => {
      try {
        const parsed = new URL(url)

        // Must be PostgreSQL
        if (
          !parsed.protocol.startsWith("postgresql") &&
          !parsed.protocol.startsWith("postgres")
        ) {
          return false
        }

        // Must have host
        if (!parsed.hostname) {
          return false
        }

        // Should not include a specific database name in the path (or should be empty/postgres)
        const path = parsed.pathname
        return path === "/" || path === "" || path === "/postgres"
      } catch {
        return false
      }
    },
  }),
)

/**
 * Enhanced auth URL configuration with validation - NO DEFAULTS
 */
export const ValidatedAuthConfig = Config.all({
  secret: Config.redacted("BETTER_AUTH_SECRET").pipe(
    Config.validate({
      message: "BETTER_AUTH_SECRET must be at least 32 characters long",
      validation: (secret) => Redacted.value(secret).length >= 32,
    }),
  ),
  url: Config.string("BETTER_AUTH_URL").pipe(
    Config.validate({
      message: "BETTER_AUTH_URL must be a valid URL",
      validation: validateUrl,
    }),
  ),
})

/**
 * Enhanced server configuration with port validation - NO DEFAULTS
 */
export const ValidatedServerConfig = Config.all({
  port: Config.number("PORT").pipe(
    Config.validate({
      message: "PORT must be between 1 and 65535",
      validation: validatePort,
    }),
  ),
  host: Config.string("HOST").pipe(
    Config.validate({
      message: "HOST must be a valid hostname",
      validation: (host) => host.length > 0 && !host.includes(" "),
    }),
  ),
})

/**
 * Enhanced email configuration with validation - NO DEFAULTS
 */
export const ValidatedEmailConfig = Config.all({
  smtp: Config.nested(
    Config.all({
      host: Config.string("HOST"),
      port: Config.number("PORT").pipe(
        Config.validate({
          message: "SMTP_PORT must be a valid port number",
          validation: validatePort,
        }),
      ),
      user: Config.string("USER"),
      password: Config.redacted("PASSWORD"),
    }),
    "SMTP",
  ),

  resend: Config.nested(
    Config.all({
      apiKey: Config.redacted("API_KEY"),
      fromEmail: Config.string("FROM_EMAIL").pipe(
        Config.validate({
          message: "RESEND_FROM_EMAIL must be a valid email address",
          validation: validateEmail,
        }),
      ),
    }),
    "RESEND",
  ),
})

/**
 * Complete validated application configuration - NO DEFAULTS
 */
export const ValidatedAppConfig = Config.all({
  environment: Config.literal("development", "production", "test")("NODE_ENV"), // NO DEFAULT - must be explicitly set
  server: ValidatedServerConfig,
  database: ValidatedDatabaseConfig,
  auth: ValidatedAuthConfig,
  email: ValidatedEmailConfig,
})

/**
 * Load configuration with comprehensive validation
 */
export const loadValidatedConfig = Effect.gen(function* () {
  const config = yield* ValidatedAppConfig

  // Cross-field validation
  if (config.environment === "production") {
    const authSecret = Redacted.value(config.auth.secret)
    if (authSecret.length < 32) {
      return yield* Effect.fail(
        new Error(
          "Production requires BETTER_AUTH_SECRET to be at least 32 characters",
        ),
      )
    }

    if (config.auth.url.includes("localhost")) {
      return yield* Effect.fail(
        new Error("Production cannot use localhost URLs"),
      )
    }
  }

  return config
})

/**
 * Validate configuration and provide helpful error messages
 */
export const validateConfiguration = Effect.gen(function* () {
  try {
    const config = yield* loadValidatedConfig
    console.log("✅ Configuration validation passed")
    return config
  } catch (error) {
    console.error("❌ Configuration validation failed:")
    if (error instanceof Error) {
      console.error(`   ${error.message}`)
    }
    return yield* Effect.fail(error)
  }
})
