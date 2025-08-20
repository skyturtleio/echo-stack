import { Effect } from "effect"
import {
  loadConfig,
  loadValidatedConfig,
  defaultProvider,
  testProvider,
  createTestProvider,
  getEmailConfig,
  isDevelopment,
  isProduction,
} from "./effect-config"
import { Logger, LoggerLayer, aviationMessages } from "./logger-service"

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

  yield* logger.takeoff("Loading basic configuration", {
    service: "config-example",
    operation: "basic-config",
  })

  const config = yield* loadConfig

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

  yield* logger.takeoff("Loading validated configuration", {
    service: "config-example",
    operation: "validated-config",
  })

  const config = yield* loadValidatedConfig

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

  yield* logger.takeoff("Checking environment-specific configuration", {
    service: "config-example",
    operation: "environment-check",
  })

  const isDev = yield* isDevelopment
  const isProd = yield* isProduction

  yield* logger.info("Environment modes", {
    service: "config-example",
    operation: "environment-check",
    metadata: { development: isDev, production: isProd },
  })

  const emailConfig = yield* getEmailConfig
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

  yield* logger.takeoff("Using custom test provider", {
    service: "config-example",
    operation: "test-provider",
  })

  const config = yield* loadConfig

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

  yield* logger.takeoff("Testing error handling", {
    service: "config-example",
    operation: "error-handling",
  })

  // This will fail validation if BETTER_AUTH_SECRET is too short
  const result = yield* loadValidatedConfig.pipe(
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

  yield* logger.takeoff("Checking production configuration", {
    service: "config-example",
    operation: "production-check",
  })

  const config = yield* loadValidatedConfig

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
    createTestProvider(
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
        ["RESEND.API_KEY", "re_123456789"],
        ["RESEND.FROM_EMAIL", "hello@example.com"],
      ]),
    ),
  ),
)

/**
 * Run all examples
 */
export const runAllExamples = Effect.gen(function* () {
  const logger = yield* Logger

  yield* logger.takeoff("Running all configuration examples", {
    service: "config-example",
    operation: "run-all-examples",
  })

  // Run basic example with default provider (reads from .env)
  yield* basicExample.pipe(
    Effect.withConfigProvider(defaultProvider),
    Effect.provide(LoggerLayer),
  )

  // Run validated example
  yield* validatedExample.pipe(
    Effect.withConfigProvider(defaultProvider),
    Effect.provide(LoggerLayer),
  )

  // Run environment example
  yield* environmentExample.pipe(
    Effect.withConfigProvider(defaultProvider),
    Effect.provide(LoggerLayer),
  )

  // Run test provider example
  yield* testProviderExample.pipe(Effect.provide(LoggerLayer))

  // Run error handling example
  yield* errorHandlingExample.pipe(
    Effect.withConfigProvider(defaultProvider),
    Effect.provide(LoggerLayer),
  )

  // Run production check example
  yield* productionCheckExample.pipe(Effect.provide(LoggerLayer))

  yield* logger.landing("All examples completed!", {
    service: "config-example",
    operation: "run-all-examples",
  })
})

// Export a simple function to run the examples
export const runExamples = () => {
  return Effect.runPromise(runAllExamples.pipe(Effect.provide(LoggerLayer)))
}
