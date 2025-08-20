#!/usr/bin/env bun

/**
 * Resource Management Demo
 *
 * This demo shows how the improved database service with resource management
 * and configuration service work together to provide safe, structured operations.
 */

import { Effect, Console } from "effect"
import { AppLayer } from "../lib/app-services"
import {
  checkDatabaseHealth,
  withDatabase,
  withTransaction,
} from "../server/db/database-service"
import { ConfigService } from "../lib/config-service"
import { sql } from "drizzle-orm"

/**
 * Demo: Configuration Service
 */
const demoConfigurationService = Effect.gen(function* () {
  yield* Console.log("=== Configuration Service Demo ===")

  const configService = yield* ConfigService
  const config = yield* configService.getConfig()

  yield* Console.log(`Environment: ${config.environment}`)
  yield* Console.log(`Server: ${config.server.host}:${config.server.port}`)
  yield* Console.log(
    `Database URL: ${config.database.url.replace(/:\/\/[^@]+@/, "://***:***@")}`,
  )
  yield* Console.log(`Email Provider: ${config.email.provider}`)

  const isProduction = yield* configService.isProduction()
  yield* Console.log(`Is Production: ${isProduction}`)
})

/**
 * Demo: Database Health Check
 */
const demoDatabaseHealth = Effect.gen(function* () {
  yield* Console.log("\n=== Database Health Check Demo ===")

  const healthStatus = yield* checkDatabaseHealth

  yield* Console.log(
    `Database Health: ${healthStatus.healthy ? "✅ Healthy" : "❌ Unhealthy"}`,
  )
  yield* Console.log(`Message: ${healthStatus.message}`)
  yield* Console.log(`Timestamp: ${healthStatus.timestamp.toISOString()}`)

  if (healthStatus.connectionCount) {
    yield* Console.log(`Active Connections: ${healthStatus.connectionCount}`)
  }

  if (healthStatus.latencyMs) {
    yield* Console.log(`Query Latency: ${healthStatus.latencyMs}ms`)
  }
})

/**
 * Demo: Database Query Operations
 */
const demoDatabaseOperations = Effect.gen(function* () {
  yield* Console.log("\n=== Database Operations Demo ===")

  // Simple query using withDatabase
  const simpleQuery = yield* withDatabase((db) =>
    Effect.tryPromise({
      try: () =>
        db.execute(
          sql`SELECT 'Hello from database!' as message, NOW() as timestamp`,
        ),
      catch: (error) => error,
    }),
  )

  yield* Console.log(
    `Simple Query Result: ${JSON.stringify(simpleQuery[0], null, 2)}`,
  )

  // Transaction example
  const transactionResult = yield* withTransaction((tx) =>
    Effect.gen(function* () {
      // Simulate a transaction with multiple operations
      const result1 = yield* Effect.tryPromise({
        try: () => tx.execute(sql`SELECT 1 as step`),
        catch: (error) => error,
      })

      const result2 = yield* Effect.tryPromise({
        try: () => tx.execute(sql`SELECT 2 as step`),
        catch: (error) => error,
      })

      return { result1: result1[0], result2: result2[0] }
    }),
  )

  yield* Console.log(
    `Transaction Result: ${JSON.stringify(transactionResult, null, 2)}`,
  )
})

/**
 * Demo: Error Handling
 */
const demoErrorHandling = Effect.gen(function* () {
  yield* Console.log("\n=== Error Handling Demo ===")

  // Intentionally cause an error to demonstrate structured error handling
  const errorResult = yield* withDatabase((db) =>
    Effect.tryPromise({
      try: () => db.execute(sql`SELECT * FROM non_existent_table`),
      catch: (error) => error,
    }),
  ).pipe(
    Effect.either, // Convert error to Either so we can handle it gracefully
  )

  if (errorResult._tag === "Left") {
    yield* Console.log(`✅ Error handled gracefully: ${errorResult.left}`)
  } else {
    yield* Console.log(
      `Unexpected success: ${JSON.stringify(errorResult.right)}`,
    )
  }
})

/**
 * Demo: Resource Cleanup
 */
const demoResourceCleanup = Effect.gen(function* () {
  yield* Console.log("\n=== Resource Cleanup Demo ===")
  yield* Console.log(
    "When this program exits, database connections will be automatically closed.",
  )
  yield* Console.log(
    "This is handled by Effect's resource management (acquireRelease).",
  )
  yield* Console.log("No manual cleanup required! 🎉")
})

/**
 * Main demo program
 */
const program = Effect.gen(function* () {
  yield* Console.log("🚀 Starting Resource Management Demo\n")

  yield* demoConfigurationService
  yield* demoDatabaseHealth
  yield* demoDatabaseOperations
  yield* demoErrorHandling
  yield* demoResourceCleanup

  yield* Console.log("\n✅ Demo completed successfully!")
})

/**
 * Run the demo with proper service provision
 */
const main = program.pipe(
  Effect.provide(AppLayer),
  Effect.catchAll((error) => Console.log(`❌ Demo failed: ${error}`)),
)

// Execute the demo
Effect.runPromise(main)
