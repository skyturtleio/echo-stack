#!/usr/bin/env tsx

/**
 * Strict Configuration Demo Script
 *
 * This script demonstrates the NEW strict configuration approach.
 * Run with: `bun run src/config-strict-demo.ts`
 */

import { Effect } from "effect"
import { validateStartupConfig } from "./lib/config-startup"
import {
  getStrictProvider,
  getDevelopmentProviderWithFallbacks,
} from "./lib/config-provider"

async function main() {
  console.log("🎯 Echo Stack - Strict Config Demo")
  console.log("=".repeat(50))

  console.log("\n📋 Testing strict configuration (no defaults)...")

  // Test 1: Strict provider (reads from .env only)
  console.log("\n1️⃣  Testing strict provider (.env file required)")
  try {
    const strictConfigProgram = Effect.gen(function* () {
      return yield* validateStartupConfig
    })

    const strictProvider = getStrictProvider()
    await Effect.runPromise(
      Effect.withConfigProvider(strictConfigProgram, strictProvider),
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
    const fallbackConfigProgram = Effect.gen(function* () {
      return yield* validateStartupConfig
    })

    const fallbackProvider = getDevelopmentProviderWithFallbacks()
    await Effect.runPromise(
      Effect.withConfigProvider(fallbackConfigProgram, fallbackProvider),
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
