#!/usr/bin/env bun

/**
 * Logger Test Script - Echo Stack
 *
 * Tests the Effect Logger service with standard methods and aviation-themed messages
 * for operational logging while keeping traditional error/warning terminology.
 */

import { Effect } from "effect"
import {
  Logger,
  LoggerLayer,
  aviationMessages,
} from "../../src/lib/logger-service"

const testLogger = Effect.gen(function* () {
  const logger = yield* Logger

  yield* logger.info(
    aviationMessages.starting("Echo Stack Logger Service testing"),
    {
      service: "test-logger",
      operation: "initialization",
    },
  )

  // Test all standard log levels
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

  // Test aviation-themed messages for operations
  yield* logger.debug(aviationMessages.processing("user data validation"), {
    service: "aviation-test",
    operation: "cruise-control",
  })

  yield* logger.success(aviationMessages.success("all systems"), {
    service: "aviation-test",
    metadata: { altitude: "30000ft", speed: "500kt" },
  })

  // Test error logging (traditional messaging)
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

  yield* logger.success(aviationMessages.completing("Logger testing"), {
    service: "test-logger",
    operation: "finalization",
  })

  return { success: true }
})

// Test convenience functions without context
const testConvenienceFunctions = Effect.gen(function* () {
  const logger = yield* Logger

  yield* logger.info(aviationMessages.starting("convenience functions testing"))

  // These should work without explicit context
  yield* Effect.sleep("100 millis")

  yield* logger.success(aviationMessages.success("convenience functions test"))

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
