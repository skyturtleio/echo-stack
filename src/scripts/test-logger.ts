#!/usr/bin/env bun

/**
 * Logger Test Script - Echo Stack
 *
 * Tests the Effect Logger service with different log levels and contexts
 * before replacing console.* statements across the codebase.
 */

import { Effect } from "effect"
import { Logger, LoggerLayer, takeoff, landing } from "../lib/logger-service"

const testLogger = Effect.gen(function* () {
  const logger = yield* Logger

  yield* logger.takeoff("Testing Echo Stack Logger Service", {
    service: "test-logger",
    operation: "initialization",
  })

  // Test all log levels
  yield* logger.debug("Debug information for development", {
    service: "test-logger",
    metadata: { debugLevel: "verbose" },
  })

  yield* logger.info("General information message", {
    service: "test-logger",
    operation: "info-test",
  })

  yield* logger.warn("Warning message about potential issue", {
    service: "test-logger",
    metadata: { warningType: "deprecation" },
  })

  yield* logger.success("Operation completed successfully", {
    service: "test-logger",
    operation: "success-test",
  })

  // Test aviation-themed logging
  yield* logger.cruise("Normal operation in progress", {
    service: "aviation-test",
    operation: "cruise-control",
  })

  yield* logger.clearskies("All systems nominal", {
    service: "aviation-test",
    metadata: { altitude: "30000ft", speed: "500kt" },
  })

  // Test error logging
  yield* logger.error("Standard error message", {
    service: "test-logger",
    operation: "error-test",
    metadata: { errorCode: "TEST_001" },
  })

  yield* logger.error("Critical system failure", {
    service: "aviation-test",
    operation: "emergency",
    metadata: { criticalError: true, requiresImmediate: true },
  })

  yield* logger.landing("Logger testing completed successfully", {
    service: "test-logger",
    operation: "finalization",
  })

  return { success: true }
})

// Test convenience functions without context
const testConvenienceFunctions = Effect.gen(function* () {
  yield* takeoff("Testing convenience functions")

  // These should work without explicit context
  yield* Effect.sleep("100 millis")

  yield* landing("Convenience functions test complete")

  return { success: true }
})

// Main test program
const testProgram = Effect.gen(function* () {
  console.log("🧪 Starting Effect Logger Tests...\n")

  yield* testLogger
  console.log("\n---\n")
  yield* testConvenienceFunctions

  console.log("\n✅ All logger tests passed!")
  return { success: true }
}).pipe(
  Effect.provide(LoggerLayer),
  Effect.catchAll((error) =>
    Effect.sync(() => {
      console.error("❌ Logger test failed:", error)
      return { success: false, error }
    }),
  ),
)

Effect.runPromise(testProgram).then(
  (result: { success: boolean; error?: unknown }) => {
    if (result.success) {
      console.log("\n🎉 Logger service is ready for integration!")
      process.exit(0)
    } else {
      console.log("\n💥 Logger service needs fixes before integration")
      process.exit(1)
    }
  },
)
