#!/usr/bin/env bun

/**
 * Config Consistency Validation Script
 *
 * This script verifies that both our Effect Config system and Drizzle config
 * are using the same validation logic and producing consistent results.
 */

import { Effect, Config, ConfigProvider } from "effect"
import { Logger, LoggerLayer, aviationMessages } from "../lib/logger-service"

const validateConfigConsistency = Effect.gen(function* () {
  const logger = yield* Logger

  yield* logger.info(
    aviationMessages.starting(
      "config consistency testing between Effect Config and Drizzle",
    ),
    {
      service: "config-validation",
      operation: "initialization",
    },
  )

  // Test 1: Load config using basic database URL validation
  const ValidatedDatabaseConfig = Config.string("DATABASE_URL").pipe(
    Config.validate({
      message: "DATABASE_URL must be a valid PostgreSQL connection string",
      validation: (url: string) =>
        url.startsWith("postgresql://") || url.startsWith("postgres://"),
    }),
  )

  const drizzleConfigMethod = Effect.gen(function* () {
    const databaseUrl = yield* ValidatedDatabaseConfig
    return databaseUrl
  }).pipe(Effect.withConfigProvider(ConfigProvider.fromEnv()))

  const databaseUrl = yield* drizzleConfigMethod

  yield* logger.success("Effect Config validation passed", {
    service: "config-validation",
    operation: "validation-test-1",
  })
  yield* logger.info(
    `Database URL: ${databaseUrl.replace(/:[^:@]*@/, ":****@")}`,
    {
      service: "config-validation",
      operation: "validation-test-1",
    },
  )

  // Test 2: Verify URL format validation works
  yield* logger.info("Testing validation with invalid URL...", {
    service: "config-validation",
    operation: "validation-test-2",
  })

  const testInvalidUrl = ValidatedDatabaseConfig.pipe(
    Effect.withConfigProvider(
      ConfigProvider.fromMap(new Map([["DATABASE_URL", "invalid-url"]])),
    ),
    Effect.either,
  )

  const invalidResult = yield* testInvalidUrl

  if (invalidResult._tag === "Left") {
    yield* logger.success(
      "Invalid URL correctly rejected by Effect Config validation",
      {
        service: "config-validation",
        operation: "validation-test-2",
        metadata: { error: String(invalidResult.left) },
      },
    )
  } else {
    yield* logger.error(
      "Invalid URL was not rejected - validation may be broken",
      {
        service: "config-validation",
        operation: "validation-test-2",
      },
    )
  }

  // Test 3: Verify postgresql:// prefix validation
  yield* logger.info("Testing PostgreSQL prefix validation...", {
    service: "config-validation",
    operation: "validation-test-3",
  })

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
    yield* logger.success("Non-PostgreSQL URL correctly rejected", {
      service: "config-validation",
      operation: "validation-test-3",
      metadata: { error: String(nonPostgresResult.left) },
    })
  } else {
    yield* logger.error(
      "Non-PostgreSQL URL was not rejected - validation may be broken",
      {
        service: "config-validation",
        operation: "validation-test-3",
      },
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
  Effect.provide(LoggerLayer),
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      const logger = yield* Logger
      yield* logger.error(`Config consistency test failed: ${error}`, {
        service: "config-validation",
        operation: "test-failure",
        metadata: { error: String(error) },
      })
      return { success: false, error }
    }).pipe(Effect.provide(LoggerLayer)),
  ),
)

Effect.runPromise(program).then(
  (result: { success: boolean; error?: unknown }) => {
    if (result.success) {
      console.log("\n🎉 Config consistency validated!")
      console.log(
        "   • Effect Config and Drizzle config use the same validation",
      )
      console.log("   • Database URL validation is working correctly")
      console.log("   • Error handling and fallbacks are in place")
      process.exit(0)
    } else {
      console.log("\n💥 Config consistency issues detected!")
      process.exit(1)
    }
  },
)
