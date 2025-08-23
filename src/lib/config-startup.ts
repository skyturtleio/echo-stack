import { Effect } from "effect"
import { loadConfig, validateEnvironmentVariables } from "./config"
import { getConfigProvider } from "./config-provider"

/**
 * Startup Configuration Validation
 *
 * This module provides startup validation to ensure the application
 * has all required configuration before starting up.
 */

/**
 * Validate configuration at application startup
 * This should be called before the app starts to ensure all config is valid
 */
export const validateStartupConfig = Effect.gen(function* () {
  console.log("🔧 Validating application configuration...")

  try {
    // Step 1: Check environment variables are present
    yield* validateEnvironmentVariables
    console.log("✅ Environment variables validation passed")

    // Step 2: Load and validate full configuration
    const config = yield* loadConfig
    console.log("✅ Configuration schema validation passed")

    // Step 3: Log successful startup config (without secrets)
    console.log(
      `✅ Configuration loaded successfully for ${config.environment} environment`,
    )
    console.log(`   Server: ${config.server.host}:${config.server.port}`)
    console.log(`   Database: ${config.database.url.substring(0, 30)}...`)
    console.log(`   Auth URL: ${config.auth.url}`)

    if (config.environment === "development") {
      console.log(
        `   Email: SMTP (${config.email.smtp.host}:${config.email.smtp.port})`,
      )
    } else if (config.environment === "production") {
      console.log(`   Email: Resend (${config.email.resend.fromEmail})`)
    }

    return config
  } catch (error) {
    console.error("\n💥 Configuration validation failed!")
    console.error(
      "   The application cannot start with invalid configuration.\n",
    )

    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error("Unknown configuration error:", error)
    }

    console.error("\n🔧 Quick fix:")
    console.error("   1. Ensure .env file exists (copy from .env.example)")
    console.error("   2. Fill in all required environment variables")
    console.error("   3. Restart the application")
    console.error(
      "   4. Run 'bun run src/scripts/config-demo.ts' to test configuration\n",
    )

    return yield* Effect.fail(error)
  }
})

/**
 * Initialize configuration for TanStack Start
 * This provides the config to the application context
 */
export const initializeConfig = Effect.gen(function* () {
  const provider = getConfigProvider()

  const configProgram = Effect.gen(function* () {
    return yield* validateStartupConfig
  })

  return yield* Effect.withConfigProvider(configProgram, provider)
})

/**
 * Safe config checker for demos (allows fallback values)
 */
export const validateDemoConfig = Effect.gen(function* () {
  console.log("🎯 Loading demo configuration (allows fallbacks)...")

  try {
    const config = yield* loadConfig
    console.log("✅ Demo configuration loaded successfully")
    return config
  } catch (error) {
    console.warn(
      "⚠️  Demo configuration failed, this is expected if .env is not set up",
    )
    if (error instanceof Error) {
      console.warn(`   Error: ${error.message}`)
    }
    return yield* Effect.fail(error)
  }
})
