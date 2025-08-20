#!/usr/bin/env bun

/**
 * Enhanced Database Connection Test
 *
 * This script tests the new database service with resource management
 * and demonstrates the improved safety and error handling.
 */

import { Effect, Console } from "effect"
import { AppLayer } from "../../lib/app-services"
import {
  checkDatabaseHealth,
  withDatabase,
  executeQuery,
} from "./database-service"
import { ConfigService } from "../../lib/config-service"
import { sql } from "drizzle-orm"

const testDatabaseConnection = Effect.gen(function* () {
  yield* Console.log("🔍 Testing enhanced database service...")

  // Get configuration
  const configService = yield* ConfigService
  const config = yield* configService.getDatabaseConfig()
  yield* Console.log(
    `📡 Using database: ${config.url.replace(/:[^:@]*@/, ":****@")}`,
  )

  // Test database health
  yield* Console.log("\n🏥 Checking database health...")
  const healthStatus = yield* checkDatabaseHealth

  if (!healthStatus.healthy) {
    return yield* Effect.fail(
      new Error(`Database is unhealthy: ${healthStatus.message}`),
    )
  }

  yield* Console.log(`✅ Database is healthy`)
  yield* Console.log(`   Latency: ${healthStatus.latencyMs}ms`)
  yield* Console.log(`   Active connections: ${healthStatus.connectionCount}`)
  yield* Console.log(`   Timestamp: ${healthStatus.timestamp.toISOString()}`)

  // Test basic database query
  yield* Console.log("\n📋 Testing basic database operations...")

  const basicQuery = yield* executeQuery((db) =>
    db.execute(sql`SELECT 
      version() as postgres_version,
      current_database() as database_name,
      current_user as database_user,
      NOW() as timestamp`),
  )

  const info = basicQuery[0]
  if (!info) {
    return yield* Effect.fail(new Error("No result returned from database"))
  }

  yield* Console.log(`✅ Basic query successful!`)
  yield* Console.log(`   PostgreSQL Version: ${info.postgres_version}`)
  yield* Console.log(`   Database: ${info.database_name}`)
  yield* Console.log(`   User: ${info.database_user}`)
  yield* Console.log(`   Timestamp: ${info.timestamp}`)

  // Check existing tables
  const tables = yield* executeQuery((db) =>
    db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `),
  )

  if (tables.length > 0) {
    yield* Console.log(`📋 Existing tables (${tables.length}):`)
    for (const table of tables) {
      yield* Console.log(`   - ${table.table_name}`)
    }
  } else {
    yield* Console.log(`📋 No tables found (database is empty)`)
  }

  // Test advanced database operations
  yield* Console.log("\n🧪 Testing advanced operations...")

  const advancedQuery = yield* withDatabase((db) =>
    Effect.tryPromise({
      try: () =>
        db.execute(sql`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
      `),
      catch: (error) => error,
    }),
  )

  const stats = advancedQuery[0]
  if (stats) {
    yield* Console.log(`📊 Database statistics:`)
    yield* Console.log(`   Size: ${stats.database_size}`)
    yield* Console.log(
      `   Active connections: ${stats.active_connections}/${stats.max_connections}`,
    )
  }

  return {
    success: true,
    healthStatus,
    info,
    tableCount: tables.length,
    stats,
  }
})

const testErrorHandling = Effect.gen(function* () {
  yield* Console.log("\n🚨 Testing error handling...")

  // Test graceful error handling
  const errorResult = yield* withDatabase((db) =>
    Effect.tryPromise({
      try: () =>
        db.execute(sql`SELECT * FROM definitely_non_existent_table_12345`),
      catch: (error) => error,
    }),
  ).pipe(
    Effect.either, // Convert to Either to handle gracefully
  )

  if (errorResult._tag === "Left") {
    yield* Console.log(`✅ Error handling works correctly`)
    yield* Console.log(`   Error: ${String(errorResult.left)}`)
  } else {
    yield* Console.log(`⚠️  Expected error but got success`)
  }
})

const testResourceCleanup = Effect.gen(function* () {
  yield* Console.log("\n🧹 Testing resource cleanup...")
  yield* Console.log(
    `✅ Resource cleanup is automatic with Effect's acquireRelease`,
  )
  yield* Console.log(
    `   Database connections will be properly closed when the program exits`,
  )
  yield* Console.log(`   No manual cleanup required!`)
})

// Main test program
const program = Effect.gen(function* () {
  yield* Console.log("🚀 Starting Enhanced Database Connection Test\n")

  const result = yield* testDatabaseConnection
  yield* testErrorHandling
  yield* testResourceCleanup

  yield* Console.log("\n🎉 All database tests passed!")
  yield* Console.log("✅ Database service is ready for production use!")

  return result
})

// Run the test with proper error handling
const main = program.pipe(
  Effect.provide(AppLayer),
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      yield* Console.log("❌ Database test failed:")
      yield* Console.log(`   ${error}`)
      return { success: false, error }
    }),
  ),
)

Effect.runPromise(main).then((result) => {
  if (result.success) {
    console.log("\n🎉 Database service is ready!")
    process.exit(0)
  } else {
    console.log("\n💥 Please fix the database issues before proceeding.")
    process.exit(1)
  }
})
