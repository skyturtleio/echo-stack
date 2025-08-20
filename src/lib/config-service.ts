import { Config, Context, Effect, Layer } from "effect"
import { ConfigurationError, ConfigurationValidationError } from "./errors"
import { getConfigProvider } from "./config-provider"

/**
 * Centralized Configuration Service
 *
 * This service provides type-safe access to configuration throughout the application
 * using Effect's service pattern. It centralizes config access and provides proper
 * error handling and validation.
 */

// Configuration interfaces
export interface DatabaseConfig {
  readonly url: string
}

export interface AuthConfig {
  readonly secret: string
  readonly url: string
}

export interface ServerConfig {
  readonly port: number
  readonly host: string
}

export interface SmtpConfig {
  readonly host: string
  readonly port: number
  readonly user: string
  readonly password: string
}

export interface ResendConfig {
  readonly apiKey: string
  readonly fromEmail: string
}

export interface EmailConfig {
  readonly provider: "smtp" | "resend"
  readonly smtp: SmtpConfig
  readonly resend: ResendConfig
}

export interface JWTConfig {
  readonly secret: string
  readonly issuer: string
}

export interface AppConfig {
  readonly environment: "development" | "production" | "test"
  readonly server: ServerConfig
  readonly database: DatabaseConfig
  readonly auth: AuthConfig
  readonly email: EmailConfig
  readonly jwt: JWTConfig
}

/**
 * Configuration Service interface
 */
export interface ConfigService {
  readonly getConfig: () => Effect.Effect<AppConfig, ConfigurationError>
  readonly getDatabaseConfig: () => Effect.Effect<
    DatabaseConfig,
    ConfigurationError
  >
  readonly getAuthConfig: () => Effect.Effect<AuthConfig, ConfigurationError>
  readonly getEmailConfig: () => Effect.Effect<EmailConfig, ConfigurationError>
  readonly getServerConfig: () => Effect.Effect<
    ServerConfig,
    ConfigurationError
  >
  readonly getJWTConfig: () => Effect.Effect<JWTConfig, ConfigurationError>
  readonly isProduction: () => Effect.Effect<boolean, ConfigurationError>
  readonly isDevelopment: () => Effect.Effect<boolean, ConfigurationError>
}

/**
 * Configuration Service tag
 */
export const ConfigService =
  Context.GenericTag<ConfigService>("@app/ConfigService")

/**
 * Validation helpers
 */
const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const validateDatabaseUrl = (url: string): boolean => {
  return url.startsWith("postgresql://") || url.startsWith("postgres://")
}

const validatePort = (port: number): boolean => {
  return port > 0 && port <= 65535
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Configuration schema with validation
 */
const DatabaseConfigSchema = Config.all({
  url: Config.string("DATABASE_URL").pipe(
    Config.validate({
      message: "DATABASE_URL must be a valid PostgreSQL connection string",
      validation: validateDatabaseUrl,
    }),
  ),
})

const AuthConfigSchema = Config.all({
  secret: Config.string("BETTER_AUTH_SECRET").pipe(
    Config.validate({
      message: "BETTER_AUTH_SECRET must be at least 32 characters long",
      validation: (secret) => secret.length >= 32,
    }),
  ),
  url: Config.string("BETTER_AUTH_URL").pipe(
    Config.validate({
      message: "BETTER_AUTH_URL must be a valid URL",
      validation: validateUrl,
    }),
  ),
})

const ServerConfigSchema = Config.all({
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

const SmtpConfigSchema = Config.nested(
  Config.all({
    host: Config.string("HOST"),
    port: Config.number("PORT").pipe(
      Config.validate({
        message: "SMTP_PORT must be a valid port number",
        validation: validatePort,
      }),
    ),
    user: Config.string("USER").pipe(Config.withDefault("")),
    password: Config.string("PASSWORD").pipe(Config.withDefault("")),
  }),
  "SMTP",
)

const ResendConfigSchema = Config.nested(
  Config.all({
    apiKey: Config.string("API_KEY"),
    fromEmail: Config.string("FROM_EMAIL").pipe(
      Config.validate({
        message: "RESEND_FROM_EMAIL must be a valid email address",
        validation: validateEmail,
      }),
    ),
  }),
  "RESEND",
)

const JWTConfigSchema = Config.all({
  secret: Config.string("JWT_SECRET"),
  issuer: Config.string("JWT_ISSUER"),
})

const AppConfigSchema = Config.all({
  environment: Config.literal("development", "production", "test")("NODE_ENV"),
  server: ServerConfigSchema,
  database: DatabaseConfigSchema,
  auth: AuthConfigSchema,
  smtp: SmtpConfigSchema,
  resend: ResendConfigSchema,
  jwt: JWTConfigSchema,
})

/**
 * Load and transform configuration
 */
const loadConfiguration = Effect.gen(function* () {
  try {
    const config = yield* AppConfigSchema

    // Determine email provider based on environment
    const emailProvider =
      config.environment === "development" ? "smtp" : "resend"

    const emailConfig: EmailConfig = {
      provider: emailProvider,
      smtp: config.smtp,
      resend: config.resend,
    }

    // Cross-environment validation
    if (config.environment === "production") {
      if (!config.resend.apiKey.startsWith("re_")) {
        return yield* Effect.fail(
          new ConfigurationValidationError({
            field: "RESEND_API_KEY",
            message:
              "Production requires valid Resend API key starting with 're_'",
            receivedValue: config.resend.apiKey,
          }),
        )
      }

      if (config.auth.url.includes("localhost")) {
        return yield* Effect.fail(
          new ConfigurationValidationError({
            field: "BETTER_AUTH_URL",
            message: "Production cannot use localhost URLs",
            receivedValue: config.auth.url,
          }),
        )
      }
    }

    const appConfig: AppConfig = {
      environment: config.environment,
      server: config.server,
      database: config.database,
      auth: config.auth,
      email: emailConfig,
      jwt: config.jwt,
    }

    return appConfig
  } catch (error) {
    return yield* Effect.fail(
      new ConfigurationError({
        field: "global",
        reason: "Failed to load configuration",
        value: error,
      }),
    )
  }
})

/**
 * Configuration Service implementation
 */
const ConfigServiceLive = Effect.gen(function* () {
  // Load configuration once at service creation
  const config = yield* loadConfiguration.pipe(
    Effect.withConfigProvider(getConfigProvider()),
  )

  return ConfigService.of({
    getConfig: () => Effect.succeed(config),

    getDatabaseConfig: () => Effect.succeed(config.database),

    getAuthConfig: () => Effect.succeed(config.auth),

    getEmailConfig: () => Effect.succeed(config.email),

    getServerConfig: () => Effect.succeed(config.server),

    getJWTConfig: () => Effect.succeed(config.jwt),

    isProduction: () => Effect.succeed(config.environment === "production"),

    isDevelopment: () => Effect.succeed(config.environment === "development"),
  })
})

/**
 * Configuration Service Layer
 */
export const ConfigServiceLayer = Layer.effect(ConfigService, ConfigServiceLive)

/**
 * Utility functions for accessing config
 */
export const getConfig = ConfigService.pipe(
  Effect.andThen((_) => _.getConfig()),
)

export const getDatabaseConfig = ConfigService.pipe(
  Effect.andThen((_) => _.getDatabaseConfig()),
)

export const getAuthConfig = ConfigService.pipe(
  Effect.andThen((_) => _.getAuthConfig()),
)

export const getEmailConfig = ConfigService.pipe(
  Effect.andThen((_) => _.getEmailConfig()),
)

export const getServerConfig = ConfigService.pipe(
  Effect.andThen((_) => _.getServerConfig()),
)

export const getJWTConfig = ConfigService.pipe(
  Effect.andThen((_) => _.getJWTConfig()),
)

export const isProduction = ConfigService.pipe(
  Effect.andThen((_) => _.isProduction()),
)

export const isDevelopment = ConfigService.pipe(
  Effect.andThen((_) => _.isDevelopment()),
)
