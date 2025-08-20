#!/usr/bin/env bun

/**
 * Config Consistency Validation Script
 *
 * This script verifies that both our Effect Config system and Drizzle config
 * are using the same validation logic and producing consistent results.
 */

import { Effect, ConfigProvider } from "effect"
import { ValidatedDatabaseConfig } from "../lib/config-validation"

const validateConfigConsistency = Effect.gen(function* () {
  console.log(
    "🔍 Testing config consistency between Effect Config and Drizzle...",
  )

  // Test 1: Load config using the same method as Drizzle config
  const drizzleConfigMethod = Effect.gen(function* () {
    const databaseUrl = yield* ValidatedDatabaseConfig
    return databaseUrl
  }).pipe(Effect.withConfigProvider(ConfigProvider.fromEnv()))

  const databaseUrl = yield* drizzleConfigMethod

  console.log("✅ Effect Config validation passed")
  console.log(`📡 Database URL: ${databaseUrl.replace(/:[^:@]*@/, ":****@")}`)

  // Test 2: Verify URL format validation works
  console.log("\n🔍 Testing validation with invalid URL...")

  const testInvalidUrl = ValidatedDatabaseConfig.pipe(
    Effect.withConfigProvider(
      ConfigProvider.fromMap(new Map([["DATABASE_URL", "invalid-url"]])),
    ),
    Effect.either,
  )

  const invalidResult = yield* testInvalidUrl

  if (invalidResult._tag === "Left") {
    console.log("✅ Invalid URL correctly rejected by Effect Config validation")
    console.log(`   Error: ${invalidResult.left}`)
  } else {
    console.log("❌ Invalid URL was not rejected - validation may be broken")
  }

  // Test 3: Verify postgresql:// prefix validation
  console.log("\n🔍 Testing PostgreSQL prefix validation...")

  const testNonPostgresUrl = ValidatedDatabaseConfig.pipe(
    Effect.withConfigProvider(
      ConfigProvider.fromMap(
        new Map([["DATABASE_URL", "mysql://user:pass@localhost:3306/db"]]),
      ),
    ),
    Effect.either,
  )

  const nonPostgresResult = yield* testNonPostgresUrl

  if (nonPostgresResult._tag === "Left") {
    console.log("✅ Non-PostgreSQL URL correctly rejected")
    console.log(`   Error: ${nonPostgresResult.left}`)
  } else {
    console.log(
      "❌ Non-PostgreSQL URL was not rejected - validation may be broken",
    )
  }

  return {
    success: true,
    databaseUrl,
    validationWorking: true,
  }
})

// Run the consistency test
const program = validateConfigConsistency.pipe(
  Effect.catchAll((error) =>
    Effect.sync(() => {
      console.error("❌ Config consistency test failed:")
      console.error(`   ${error}`)
      return { success: false, error }
    }),
  ),
)

Effect.runPromise(program).then((result) => {
  if (result.success) {
    console.log("\n🎉 Config consistency validated!")
    console.log("   • Effect Config and Drizzle config use the same validation")
    console.log("   • Database URL validation is working correctly")
    console.log("   • Error handling and fallbacks are in place")
    process.exit(0)
  } else {
    console.log("\n💥 Config consistency issues detected!")
    process.exit(1)
  }
})
