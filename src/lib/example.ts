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

/**
 * Example Usage of Effect Config
 *
 * This file demonstrates how to use the configuration system in your application.
 */

/**
 * Basic configuration loading example
 */
export const basicExample = Effect.gen(function* () {
  console.log("🔧 Loading basic configuration...")

  const config = yield* loadConfig

  console.log(`Environment: ${config.environment}`)
  console.log(`Server: ${config.server.host}:${config.server.port}`)
  console.log(`Database: ${config.database.url}`)
  console.log(`Auth URL: ${config.auth.url}`)

  return config
})

/**
 * Validated configuration loading example
 */
export const validatedExample = Effect.gen(function* () {
  console.log("✅ Loading validated configuration...")

  const config = yield* loadValidatedConfig

  console.log("Configuration validation passed!")
  return config
})

/**
 * Environment-specific configuration example
 */
export const environmentExample = Effect.gen(function* () {
  console.log("🌍 Checking environment-specific configuration...")

  const isDev = yield* isDevelopment
  const isProd = yield* isProduction

  console.log(`Development mode: ${isDev}`)
  console.log(`Production mode: ${isProd}`)

  const emailConfig = yield* getEmailConfig
  console.log(`Email provider: ${emailConfig.provider}`)

  return { isDev, isProd, emailConfig }
})

/**
 * Custom test provider example
 */
export const testProviderExample = Effect.gen(function* () {
  console.log("🧪 Using custom test provider...")

  const config = yield* loadConfig

  console.log("Test configuration loaded:")
  console.log(`Server: ${config.server.host}:${config.server.port}`)
  console.log(`Database: ${config.database.url}`)

  return config
}).pipe(Effect.withConfigProvider(testProvider))

/**
 * Error handling example
 */
export const errorHandlingExample = Effect.gen(function* () {
  console.log("❌ Testing error handling...")

  // This will fail validation if BETTER_AUTH_SECRET is too short
  const result = yield* loadValidatedConfig.pipe(
    Effect.catchAll((error) => {
      console.error("Configuration error:", error.message)
      return Effect.succeed(null)
    }),
  )

  if (result) {
    console.log("Configuration loaded successfully")
  } else {
    console.log("Configuration failed validation")
  }

  return result
})

/**
 * Production configuration check example
 */
export const productionCheckExample = Effect.gen(function* () {
  console.log("🏭 Checking production configuration...")

  const config = yield* loadValidatedConfig

  console.log("Production configuration valid:")
  console.log(`Environment: ${config.environment}`)
  console.log(`Server: ${config.server.host}:${config.server.port}`)

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
  console.log("🚀 Running all configuration examples...\n")

  // Run basic example with default provider (reads from .env)
  yield* basicExample.pipe(Effect.withConfigProvider(defaultProvider))
  console.log()

  // Run validated example
  yield* validatedExample.pipe(Effect.withConfigProvider(defaultProvider))
  console.log()

  // Run environment example
  yield* environmentExample.pipe(Effect.withConfigProvider(defaultProvider))
  console.log()

  // Run test provider example
  yield* testProviderExample
  console.log()

  // Run error handling example
  yield* errorHandlingExample.pipe(Effect.withConfigProvider(defaultProvider))
  console.log()

  // Run production check example
  yield* productionCheckExample
  console.log()

  console.log("✅ All examples completed!")
})

// Export a simple function to run the examples
export const runExamples = () => {
  return Effect.runPromise(runAllExamples)
}
