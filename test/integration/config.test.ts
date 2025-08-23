import { Effect, ConfigProvider } from "effect"
import { ConfigService, ConfigServiceLayer } from "../../src/lib/config-service"
import { testProvider, defaultProvider } from "../../src/lib/config-provider"
import {
  Logger,
  LoggerLayer,
  aviationMessages,
} from "../../src/lib/logger-service"

/**
 * Example Usage of Effect Config
 *
 * This file demonstrates how to use the configuration system in your application.
 */

/**
 * Basic configuration loading example
 */
export const basicExample = Effect.gen(function* () {
  const logger = yield* Logger
  const configService = yield* ConfigService

  yield* logger.info(aviationMessages.starting("basic configuration"), {
    service: "config-example",
    operation: "basic-config",
  })

  const config = yield* configService.getConfig()

  yield* logger.info("Configuration loaded", {
    service: "config-example",
    operation: "basic-config",
    metadata: {
      environment: config.environment,
      server: `${config.server.host}:${config.server.port}`,
      database: config.database.url,
      authUrl: config.auth.url,
    },
  })

  return config
})

/**
 * Validated configuration loading example
 */
export const validatedExample = Effect.gen(function* () {
  const logger = yield* Logger
  const configService = yield* ConfigService

  yield* logger.info(aviationMessages.starting("validated configuration"), {
    service: "config-example",
    operation: "validated-config",
  })

  const config = yield* configService.getConfig()

  yield* logger.success("Configuration validation passed!", {
    service: "config-example",
    operation: "validated-config",
  })
  return config
})

/**
 * Environment-specific configuration example
 */
export const environmentExample = Effect.gen(function* () {
  const logger = yield* Logger
  const configService = yield* ConfigService

  yield* logger.info(
    aviationMessages.starting("environment-specific configuration"),
    {
      service: "config-example",
      operation: "environment-check",
    },
  )

  const isDev = yield* configService.isDevelopment()
  const isProd = yield* configService.isProduction()

  yield* logger.info("Environment modes", {
    service: "config-example",
    operation: "environment-check",
    metadata: { development: isDev, production: isProd },
  })

  const emailConfig = yield* configService.getEmailConfig()
  yield* logger.info(`Email provider: ${emailConfig.provider}`, {
    service: "config-example",
    operation: "environment-check",
    metadata: { emailProvider: emailConfig.provider },
  })

  return { isDev, isProd, emailConfig }
})

/**
 * Custom test provider example
 */
export const testProviderExample = Effect.gen(function* () {
  const logger = yield* Logger
  const configService = yield* ConfigService

  yield* logger.info(aviationMessages.starting("custom test provider"), {
    service: "config-example",
    operation: "test-provider",
  })

  const config = yield* configService.getConfig()

  yield* logger.info("Test configuration loaded", {
    service: "config-example",
    operation: "test-provider",
    metadata: {
      server: `${config.server.host}:${config.server.port}`,
      database: config.database.url,
    },
  })

  return config
}).pipe(Effect.withConfigProvider(testProvider))

/**
 * Error handling example
 */
export const errorHandlingExample = Effect.gen(function* () {
  const logger = yield* Logger
  const configService = yield* ConfigService

  yield* logger.info(aviationMessages.starting("error handling"), {
    service: "config-example",
    operation: "error-handling",
  })

  // This will fail validation if configuration is invalid
  const result = yield* configService.getConfig().pipe(
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        const innerLogger = yield* Logger
        yield* innerLogger.error(`Configuration error: ${error.message}`, {
          service: "config-example",
          operation: "error-handling",
          metadata: { error: error.message },
        })
        return null
      }),
    ),
  )

  if (result) {
    yield* logger.success("Configuration loaded successfully", {
      service: "config-example",
      operation: "error-handling",
    })
  } else {
    yield* logger.warn("Configuration failed validation", {
      service: "config-example",
      operation: "error-handling",
    })
  }

  return result
})

/**
 * Production configuration check example
 */
export const productionCheckExample = Effect.gen(function* () {
  const logger = yield* Logger
  const configService = yield* ConfigService

  yield* logger.info(aviationMessages.starting("production configuration"), {
    service: "config-example",
    operation: "production-check",
  })

  const config = yield* configService.getConfig()

  yield* logger.success("Production configuration valid", {
    service: "config-example",
    operation: "production-check",
    metadata: {
      environment: config.environment,
      server: `${config.server.host}:${config.server.port}`,
    },
  })

  return config
}).pipe(
  Effect.withConfigProvider(
    ConfigProvider.fromMap(
      new Map([
        ["NODE_ENV", "production"],
        ["HOST", "app.example.com"],
        ["PORT", "443"],
        ["DATABASE_URL", "postgresql://user:pass@prod-db:5432/hey_babe"],
        [
          "BETTER_AUTH_SECRET",
          "this-is-a-very-secure-secret-key-for-production",
        ],
        ["BETTER_AUTH_URL", "https://app.example.com"],
        ["JWT_SECRET", "jwt-secret-for-integrations-minimum-32-chars"],
        ["JWT_ISSUER", "example-app"],
        ["RESEND_API_KEY", "re_123456789"],
        ["RESEND_FROM_EMAIL", "hello@example.com"],
      ]),
    ).pipe(ConfigProvider.orElse(() => testProvider)),
  ),
)

/**
 * Run all examples
 */
export const runAllExamples = Effect.gen(function* () {
  const logger = yield* Logger

  yield* logger.info(aviationMessages.starting("all configuration examples"), {
    service: "config-example",
    operation: "run-all-examples",
  })

  // Run basic example with default provider (reads from .env)
  yield* basicExample.pipe(Effect.withConfigProvider(defaultProvider))

  // Run validated example
  yield* validatedExample.pipe(Effect.withConfigProvider(defaultProvider))

  // Run environment example
  yield* environmentExample.pipe(Effect.withConfigProvider(defaultProvider))

  // Run test provider example
  yield* testProviderExample

  // Run error handling example
  yield* errorHandlingExample.pipe(Effect.withConfigProvider(defaultProvider))

  // Run production check example
  yield* productionCheckExample

  yield* logger.success(aviationMessages.completing("all examples"), {
    service: "config-example",
    operation: "run-all-examples",
  })
})

// Export a simple function to run the examples
export const runExamples = () => {
  return Effect.runPromise(
    runAllExamples.pipe(
      Effect.provide(ConfigServiceLayer),
      Effect.provide(LoggerLayer),
    ),
  )
}

// Run if this file is executed directly
if (import.meta.main) {
  runExamples().catch((error) => {
    console.error("Config examples failed:", error)
    process.exit(1)
  })
}
