#!/usr/bin/env bun

/**
 * Database Connection Test
 *
 * This script tests the database connection and Effect Config integration
 * before applying migrations.
 */

import { Effect, ConfigProvider } from "effect"
import { AutoDatabaseConfig } from "../../lib/database-naming"
import postgres from "postgres"

const testDatabaseConnection = Effect.gen(function* () {
  console.log("🔍 Testing database connection...")

  // Get auto-generated database configuration
  const dbConfig = yield* AutoDatabaseConfig
  console.log(`📡 Connecting to: ${dbConfig.url.replace(/:[^:@]*@/, ":****@")}`)
  if (dbConfig.type === "auto") {
    console.log(`🔄 Auto-generated database name: ${dbConfig.name}`)
  }

  // Create postgres connection
  const client = postgres(dbConfig.url, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  })

  try {
    // Test the connection
    const result = yield* Effect.tryPromise({
      try: () => client`SELECT 
        version() as postgres_version,
        current_database() as database_name,
        current_user as database_user,
        NOW() as timestamp`,
      catch: (error) => new Error(`Database connection failed: ${error}`),
    })

    const info = result[0]
    if (!info) {
      return yield* Effect.fail(new Error("No result returned from database"))
    }

    console.log("✅ Database connection successful!")
    console.log(`   PostgreSQL Version: ${info.postgres_version}`)
    console.log(`   Database: ${info.database_name}`)
    console.log(`   User: ${info.database_user}`)
    console.log(`   Timestamp: ${info.timestamp}`)

    // Check if any tables exist
    const tables = yield* Effect.tryPromise({
      try: () => client`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `,
      catch: (error) => new Error(`Failed to list tables: ${error}`),
    })

    if (tables.length > 0) {
      console.log(`📋 Existing tables (${tables.length}):`)
      tables.forEach((table) => console.log(`   - ${table.table_name}`))
    } else {
      console.log("📋 No tables found (database is empty)")
    }

    return {
      success: true,
      info,
      existingTables: tables.length,
    }
  } finally {
    // Always close the connection
    yield* Effect.tryPromise({
      try: () => client.end(),
      catch: () => new Error("Failed to close database connection"),
    })
  }
})

// Run the test with config provider
const program = testDatabaseConnection.pipe(
  Effect.withConfigProvider(ConfigProvider.fromEnv()),
  Effect.catchAll((error) =>
    Effect.sync(() => {
      console.error("❌ Database connection test failed:")
      console.error(`   ${error}`)
      return { success: false, error }
    }),
  ),
)

Effect.runPromise(program).then((result) => {
  if (result.success) {
    console.log("\n🎉 Database is ready for migrations!")
    process.exit(0)
  } else {
    console.log("\n💥 Please fix the database connection before proceeding.")
    process.exit(1)
  }
})
