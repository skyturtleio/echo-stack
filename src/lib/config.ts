import { Config, Effect, Redacted } from "effect"

/**
 * Application Configuration Schema - Strict Mode
 *
 * This module defines type-safe configuration for the Hey Babe couples todo app.
 * It uses a STRICT approach - no defaults are provided. All environment variables
 * must be explicitly set, ensuring developers are aware of all required configuration.
 *
 * Philosophy: Fail fast with clear error messages rather than silent defaults.
 */

// Environment type for different deployment contexts
export const Environment = Config.literal(
  "development",
  "production",
  "test",
)("NODE_ENV")

// Database Configuration - NO DEFAULTS
export const DatabaseConfig = Config.all({
  url: Config.string("DATABASE_URL"),
})

// BetterAuth Configuration - NO DEFAULTS
export const AuthConfig = Config.all({
  secret: Config.redacted("BETTER_AUTH_SECRET"),
  url: Config.string("BETTER_AUTH_URL"),
})

// Triplit Configuration - NO DEFAULTS
export const TriliptConfig = Config.all({
  jwtSecret: Config.redacted("EXTERNAL_JWT_SECRET"),
  databaseUrl: Config.string("LOCAL_DATABASE_URL"),
  corsOrigin: Config.string("CORS_ORIGIN"),
})

// Email Configuration - NO DEFAULTS
export const EmailConfig = Config.all({
  // Development email settings (Mailpit)
  smtp: Config.nested(
    Config.all({
      host: Config.string("HOST"),
      port: Config.number("PORT"),
      user: Config.string("USER"),
      password: Config.redacted("PASSWORD"),
    }),
    "SMTP",
  ),

  // Production email settings (Resend)
  resend: Config.nested(
    Config.all({
      apiKey: Config.redacted("API_KEY"),
      fromEmail: Config.string("FROM_EMAIL"),
    }),
    "RESEND",
  ),
})

// Server Configuration - NO DEFAULTS
export const ServerConfig = Config.all({
  port: Config.number("PORT"),
  host: Config.string("HOST"),
})

// Complete Application Configuration - STRICT MODE
export const AppConfig = Config.all({
  environment: Environment, // NO DEFAULT - must be explicitly set
  server: ServerConfig,
  database: DatabaseConfig,
  auth: AuthConfig,
  triplit: TriliptConfig,
  email: EmailConfig,
})

export type AppConfig = Config.Config.Success<typeof AppConfig>

/**
 * Required Environment Variables by Environment
 */
const REQUIRED_VARS = {
  development: [
    "NODE_ENV",
    "HOST",
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "EXTERNAL_JWT_SECRET",
    "LOCAL_DATABASE_URL",
    "CORS_ORIGIN",
    "SMTP_HOST",
    "SMTP_PORT",
  ],
  production: [
    "NODE_ENV",
    "HOST",
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "EXTERNAL_JWT_SECRET",
    "LOCAL_DATABASE_URL",
    "CORS_ORIGIN",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
  ],
  test: [
    "NODE_ENV",
    "HOST",
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "EXTERNAL_JWT_SECRET",
    "LOCAL_DATABASE_URL",
    "CORS_ORIGIN",
    "SMTP_HOST",
    "SMTP_PORT",
  ],
} as const

/**
 * Variables that can be empty (but must exist)
 */
const OPTIONAL_EMPTY_VARS = {
  development: ["SMTP_USER", "SMTP_PASSWORD"],
  production: [],
  test: ["SMTP_USER", "SMTP_PASSWORD"],
} as const

/**
 * Check for missing environment variables and provide helpful guidance
 */
export const validateEnvironmentVariables = Effect.gen(function* () {
  const env = process.env.NODE_ENV || "development"
  const requiredVars =
    REQUIRED_VARS[env as keyof typeof REQUIRED_VARS] ||
    REQUIRED_VARS.development
  const optionalEmptyVars =
    OPTIONAL_EMPTY_VARS[env as keyof typeof OPTIONAL_EMPTY_VARS] || []

  const missingVars: string[] = []
  const emptyVars: string[] = []

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (value === undefined) {
      missingVars.push(varName)
    } else if (value === "") {
      emptyVars.push(varName)
    }
  }

  // Check optional empty variables (must exist but can be empty)
  for (const varName of optionalEmptyVars) {
    const value = process.env[varName]
    if (value === undefined) {
      missingVars.push(varName)
    }
    // Remove from emptyVars if it's allowed to be empty
    const index = emptyVars.indexOf(varName)
    if (index > -1) {
      emptyVars.splice(index, 1)
    }
  }

  if (missingVars.length > 0 || emptyVars.length > 0) {
    const errorMessages = []

    if (missingVars.length > 0) {
      errorMessages.push(
        `❌ Missing environment variables:\n   ${missingVars.join(", ")}`,
      )
    }

    if (emptyVars.length > 0) {
      errorMessages.push(
        `⚠️  Empty environment variables:\n   ${emptyVars.join(", ")}`,
      )
    }

    errorMessages.push(`\n🔧 To fix this:`)
    errorMessages.push(`   1. Copy .env.example to .env`)
    errorMessages.push(
      `   2. Fill in all required values for ${env} environment`,
    )
    errorMessages.push(`   3. Restart the application`)
    errorMessages.push(
      `\n📖 See .env.example for the complete list of required variables`,
    )

    return yield* Effect.fail(new Error(errorMessages.join("\n")))
  }

  return Effect.succeed("✅ All required environment variables are set")
})

/**
 * Load and validate the complete application configuration with strict validation
 */
export const loadConfig = Effect.gen(function* () {
  // First, validate that all required environment variables are present
  yield* validateEnvironmentVariables

  // Then load and validate the configuration
  const config = yield* AppConfig

  // Additional validation based on environment
  if (config.environment === "production") {
    // Ensure critical production settings meet minimum requirements
    const authSecretLength = Redacted.value(config.auth.secret).length
    if (authSecretLength < 32) {
      return yield* Effect.fail(
        new Error(
          `BETTER_AUTH_SECRET must be at least 32 characters (current: ${authSecretLength})`,
        ),
      )
    }

    const jwtSecretLength = Redacted.value(config.triplit.jwtSecret).length
    if (jwtSecretLength < 32) {
      return yield* Effect.fail(
        new Error(
          `EXTERNAL_JWT_SECRET must be at least 32 characters (current: ${jwtSecretLength})`,
        ),
      )
    }

    if (!Redacted.value(config.email.resend.apiKey).startsWith("re_")) {
      return yield* Effect.fail(
        new Error(
          "RESEND_API_KEY must start with 're_' (invalid Resend API key format)",
        ),
      )
    }

    if (config.auth.url.includes("localhost")) {
      return yield* Effect.fail(
        new Error("Production BETTER_AUTH_URL cannot contain 'localhost'"),
      )
    }
  }

  if (config.environment === "development") {
    // Development-specific validation
    const authSecretLength = Redacted.value(config.auth.secret).length
    if (authSecretLength < 32) {
      console.warn(
        `⚠️  BETTER_AUTH_SECRET should be at least 32 characters (current: ${authSecretLength})`,
      )
    }
  }

  return config
})

/**
 * Utility function to get database configuration
 */
export const getDatabaseConfig = Effect.gen(function* () {
  const config = yield* AppConfig
  return config.database
})

/**
 * Utility function to get auth configuration
 */
export const getAuthConfig = Effect.gen(function* () {
  const config = yield* AppConfig
  return config.auth
})

/**
 * Utility function to get email configuration based on environment
 */
export const getEmailConfig = Effect.gen(function* () {
  const config = yield* AppConfig

  if (config.environment === "development") {
    return {
      provider: "smtp" as const,
      config: config.email.smtp,
    }
  } else {
    return {
      provider: "resend" as const,
      config: config.email.resend,
    }
  }
})

/**
 * Utility function to check if running in development
 */
export const isDevelopment = Effect.gen(function* () {
  const config = yield* AppConfig
  return config.environment === "development"
})

/**
 * Utility function to check if running in production
 */
export const isProduction = Effect.gen(function* () {
  const config = yield* AppConfig
  return config.environment === "production"
})
