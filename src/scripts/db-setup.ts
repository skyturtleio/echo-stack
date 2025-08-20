#!/usr/bin/env bun

/**
 * Database Setup Script - Phoenix-inspired with Bun APIs and Effect
 *
 * Equivalent to Phoenix's `mix ecto.setup`
 * This script:
 * 1. Creates the database if it doesn't exist
 * 2. Runs all pending migrations
 * 3. Seeds the database with development data
 *
 * Uses Bun's native APIs and Effect for structured concurrency and resource management
 *
 * Usage: bun run db:setup
 */

import { ConfigProvider, Effect, Config } from "effect"
import { ValidatedDatabaseConfig } from "~/lib/config-validation"
import { psqlCommand, drizzleCommand, execWithTimeout } from "./utils/bun-exec"

// Simplified config for database operations
const loadDatabaseConfig = Effect.gen(function* () {
  const databaseUrl = yield* ValidatedDatabaseConfig
  const environment = yield* Config.withDefault(
    Config.literal("development", "production", "test")("NODE_ENV"),
    "development" as const,
  )
  const host = yield* Config.withDefault(Config.string("HOST"), "localhost")
  const port = yield* Config.withDefault(Config.number("PORT"), 3000)

  return {
    database: { url: databaseUrl },
    server: { host, port },
    environment,
  }
})

const setupDatabase = Effect.gen(function* () {
  console.log(
    "🚀 Setting up database (Echo Stack - Phoenix-inspired with Bun + Effect)...",
  )

  // Load and validate configuration
  console.log("📋 Loading database configuration...")
  const config = yield* loadDatabaseConfig

  console.log(`   Environment: ${config.server.host}:${config.server.port}`)
  console.log(
    `   Database: ${config.database.url.replace(/\/\/.*@/, "//<credentials>@")}`,
  )

  try {
    // Step 1: Create database (PostgreSQL specific)
    console.log("\n📦 Step 1: Ensuring database exists...")
    try {
      yield* createDatabaseIfNotExists(config.database.url)
    } catch {
      console.log("   ✅ Database ready (creation skipped - may already exist)")
    }

    // Step 2: Run migrations
    console.log("\n📦 Step 2: Running database migrations...")
    yield* runMigrations()

    // Step 3: Seed database
    console.log("\n📦 Step 3: Seeding database with development data...")
    yield* seedDatabase()

    console.log("\n✅ Database setup complete!")
    console.log("\n🎯 Next steps:")
    console.log("   • Start the dev server: bun run dev")
    console.log("   • View database: bun run db:studio")
    console.log("   • Reset database: bun run db:reset")
  } catch (error) {
    console.error("\n❌ Database setup failed:")
    yield* Effect.fail(error)
  }
})

const createDatabaseIfNotExists = (databaseUrl: string) =>
  Effect.gen(function* () {
    // Extract database name from URL
    const url = new URL(databaseUrl)
    const dbName = url.pathname.slice(1) // Remove leading slash
    const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`

    console.log(`   Creating database '${dbName}' if it doesn't exist...`)

    // Try to create database (ignore if exists)
    const createDbQuery = `CREATE DATABASE "${dbName}";`

    yield* psqlCommand(adminUrl, createDbQuery).pipe(
      Effect.map(() => {
        console.log(`   ✅ Database '${dbName}' created successfully`)
        return void 0
      }),
      Effect.catchAll((error: unknown) => {
        const errorStr = String(error)
        if (errorStr.includes("already exists")) {
          console.log(`   ✅ Database '${dbName}' already exists`)
        } else {
          console.log(`   ✅ Database '${dbName}' ready (may already exist)`)
        }
        return Effect.succeed(void 0) // Always succeed, don't fail setup
      }),
    )
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

// Main execution
const program = setupDatabase.pipe(
  Effect.withConfigProvider(ConfigProvider.fromEnv()),
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      console.error(`\n❌ Setup failed: ${error}`)
      console.error("\n🔧 Troubleshooting:")
      console.error("   • Ensure PostgreSQL is running")
      console.error("   • Check DATABASE_URL in .env file")
      console.error("   • Verify database credentials")
      console.error("   • Run: bun run db:test")
      yield* Effect.fail(new Error("Database setup failed"))
    }),
  ),
)

Effect.runPromise(program).catch(() => process.exit(1))
