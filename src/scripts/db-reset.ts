#!/usr/bin/env bun

/**
 * Database Reset Script - Complete database reset with Bun APIs and Effect
 *
 * This script performs a complete database reset:
 * 1. Drops the entire database
 * 2. Recreates the database
 * 3. Runs all migrations
 * 4. Seeds with development data
 *
 * ⚠️  WARNING: This will completely destroy all data in the database!
 * Only use this in development environments.
 *
 * Uses Bun's native APIs and Effect for structured concurrency and resource management
 *
 * Usage: bun run db:reset
 */

import { Effect, Config } from "effect"
import { defaultProvider } from "../lib/config-provider"
import { AutoDatabaseConfig } from "~/lib/database-naming"
import { psqlCommand, drizzleCommand, execWithTimeout } from "./utils/bun-exec"

// Phoenix-style database config with auto-naming
const loadDatabaseConfig = Effect.gen(function* () {
  const dbConfig = yield* AutoDatabaseConfig
  const environment = yield* Config.withDefault(
    Config.literal("development", "production", "test")("NODE_ENV"),
    "development" as const,
  )
  const host = yield* Config.withDefault(Config.string("HOST"), "localhost")
  const port = yield* Config.withDefault(Config.number("PORT"), 3000)

  return {
    database: dbConfig,
    server: { host, port },
    environment,
  }
})

const resetDatabase = Effect.gen(function* () {
  console.log("🔥 Resetting database (Echo Stack with Bun + Effect)...")
  console.log("⚠️  WARNING: This will destroy ALL data in the database!")

  // Load and validate configuration
  console.log("\n📋 Loading database configuration...")
  const config = yield* loadDatabaseConfig

  // Safety check - only allow reset in development
  if (config.server.host !== "localhost" && config.server.port !== 3000) {
    yield* Effect.fail(
      new Error("Database reset is only allowed in development environment"),
    )
  }

  console.log(`   Environment: ${config.server.host}:${config.server.port}`)
  console.log(`   Database: ${config.database.name} (auto-generated)`)
  console.log(
    `   URL: ${config.database.url.replace(/\/\/.*@/, "//<credentials>@")}`,
  )

  try {
    // Step 1: Drop database
    console.log("\n🗑️  Step 1: Dropping database...")
    yield* dropDatabase(config.database)

    // Step 2: Create database
    console.log("\n📦 Step 2: Creating fresh database...")
    yield* createDatabase(config.database)

    // Step 3: Run migrations
    console.log("\n📦 Step 3: Running database migrations...")
    yield* runMigrations()

    // Step 4: Seed database
    console.log("\n📦 Step 4: Seeding database with development data...")
    yield* seedDatabase()

    console.log("\n✅ Database reset complete!")
    console.log("\n🎯 Next steps:")
    console.log("   • Start the dev server: bun run takeoff")
    console.log("   • View database: bun run db:studio")
    console.log("   • Test database: bun run db:test")
  } catch (error) {
    console.error("\n❌ Database reset failed:")
    yield* Effect.fail(error)
  }
})

const dropDatabase = (dbConfig: { name: string; adminUrl: string }) =>
  Effect.gen(function* () {
    console.log(`   Dropping database '${dbConfig.name}'...`)

    // Terminate active connections first
    const terminateQuery = `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${dbConfig.name}' AND pid <> pg_backend_pid();
    `

    const dropDbQuery = `DROP DATABASE IF EXISTS "${dbConfig.name}";`

    try {
      // First terminate connections
      yield* psqlCommand(dbConfig.adminUrl, terminateQuery)

      // Then drop database
      yield* psqlCommand(dbConfig.adminUrl, dropDbQuery)

      console.log(`   ✅ Database '${dbConfig.name}' dropped successfully`)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      console.log(`   ⚠️  Could not drop database: ${errorMessage}`)
      throw error
    }
  })

const createDatabase = (dbConfig: { name: string; adminUrl: string }) =>
  Effect.gen(function* () {
    console.log(`   Creating database '${dbConfig.name}'...`)

    const createDbQuery = `CREATE DATABASE "${dbConfig.name}";`

    yield* psqlCommand(dbConfig.adminUrl, createDbQuery)
    console.log(`   ✅ Database '${dbConfig.name}' created successfully`)
  })

const runMigrations = () =>
  Effect.gen(function* () {
    console.log("   Running Drizzle migrations...")

    const result = yield* drizzleCommand("migrate")

    console.log("   ✅ Migrations completed successfully")
    if (result.stdout) console.log(`   ${result.stdout}`)
    if (result.stderr) console.log(`   ⚠️  ${result.stderr}`)
  })

const seedDatabase = () =>
  Effect.gen(function* () {
    console.log("   Running database seeds...")

    try {
      const result = yield* execWithTimeout(
        "bun run src/scripts/db-seed.ts",
        30000,
      )
      console.log("   ✅ Database seeded successfully")
      if (result.stdout) console.log(`   ${result.stdout}`)
    } catch {
      console.log("   ⚠️  Seeding skipped (seed script not found or failed)")
      console.log("       You can create seeds at src/scripts/db-seed.ts")
    }
  })

// Main execution with safety prompts
const program = Effect.gen(function* () {
  console.log("🚨 DANGER ZONE: Database Reset")
  console.log("This will permanently delete all data!")
  console.log("Press Ctrl+C to cancel, or wait 3 seconds to continue...")

  // Wait 3 seconds to give user time to cancel
  yield* Effect.sleep("3 seconds")

  yield* resetDatabase
}).pipe(
  Effect.withConfigProvider(defaultProvider),
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      console.error(`\n❌ Reset failed: ${error}`)
      console.error("\n🔧 Troubleshooting:")
      console.error("   • Ensure PostgreSQL is running")
      console.error("   • Check DATABASE_URL in .env file")
      console.error("   • Verify database credentials")
      console.error("   • Close all database connections")
      console.error("   • Try: bun run db:test")
      yield* Effect.fail(new Error("Database reset failed"))
    }),
  ),
)

Effect.runPromise(program).catch(() => process.exit(1))
