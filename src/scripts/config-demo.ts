#!/usr/bin/env tsx

/**
 * Strict Configuration Demo Script
 *
 * This script demonstrates the NEW strict configuration approach.
 * Run with: `bun run src/scripts/config-demo.ts`
 */

import { Effect } from "effect"
import { ConfigService, ConfigServiceLayer } from "../lib/config-service"
import { defaultProvider, developmentProvider } from "../lib/config-provider"

/**
 * Validate configuration and provide detailed startup-style logging
 */
const validateConfigWithLogging = Effect.gen(function* () {
  console.log("🔧 Validating application configuration...")

  try {
    // Load and validate full configuration
    const configService = yield* ConfigService
    const config = yield* configService.getConfig()
    console.log("✅ Configuration validation passed")

    // Log successful startup config (without secrets)
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

async function main() {
  console.log("🎯 Echo Stack - Strict Config Demo")
  console.log("=".repeat(50))

  console.log("\n📋 Testing strict configuration (no defaults)...")

  // Test 1: Strict provider (reads from .env only)
  console.log("\n1️⃣  Testing strict provider (.env file required)")
  try {
    await Effect.runPromise(
      validateConfigWithLogging.pipe(
        Effect.provide(ConfigServiceLayer),
        Effect.withConfigProvider(defaultProvider),
      ),
    )
    console.log("✅ Strict config validation passed!")
  } catch (error) {
    console.log(
      "❌ Strict config validation failed (expected if .env is incomplete):",
    )
    if (error instanceof Error) {
      console.log(error.message)
    }
  }

  // Test 2: Development provider with fallbacks
  console.log("\n2️⃣  Testing development provider (with fallbacks)")
  try {
    await Effect.runPromise(
      validateConfigWithLogging.pipe(
        Effect.provide(ConfigServiceLayer),
        Effect.withConfigProvider(developmentProvider),
      ),
    )
    console.log("✅ Fallback config validation passed!")
  } catch (error) {
    console.log("❌ Fallback config validation failed:")
    if (error instanceof Error) {
      console.log(error.message)
    }
  }

  console.log("\n🎉 Demo complete!")
  console.log("\n📝 Key changes in strict mode:")
  console.log("   • No Config.withDefault() calls")
  console.log("   • Environment variables are required")
  console.log("   • Clear error messages when vars are missing")
  console.log("   • App won't start with incomplete config")
  console.log("   • Forces developers to set up .env properly")

  console.log("\n🔧 To fix missing variables:")
  console.log("   1. Copy .env.example to .env")
  console.log("   2. Fill in ALL required values")
  console.log("   3. Restart the application")
}

// Run the demo
main().catch(console.error)
