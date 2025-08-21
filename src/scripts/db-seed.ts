#!/usr/bin/env bun

/**
 * Database Seed Script - Echo Stack
 *
 * This script provides information about test data for development.
 * BetterAuth users are created through the signup flow at /sign-up
 *
 * Usage: bun run db:seed
 */

import { Effect, ConfigProvider, Config } from "effect"
import { AutoDatabaseConfig } from "~/lib/database-naming"
import { Logger, LoggerLayer, aviationMessages } from "~/lib/logger-service"

// Load configuration for seed script
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

// Recommended test users for manual creation
const recommendedTestUsers = [
  {
    name: "Alice Demo",
    email: "alice@example.com",
    password: "password123",
  },
  {
    name: "Bob Demo",
    email: "bob@example.com",
    password: "password123",
  },
  {
    name: "Charlie Demo",
    email: "charlie@example.com",
    password: "password123",
  },
]

const seedDatabase = Effect.gen(function* () {
  const logger = yield* Logger

  yield* logger.info(
    aviationMessages.starting("database seeding with development data"),
    {
      service: "database-seed",
      operation: "initialization",
    },
  )

  // Load configuration
  const config = yield* loadDatabaseConfig
  yield* logger.info(
    `Environment: ${config.server.host}:${config.server.port}`,
    {
      service: "database-seed",
      metadata: { environment: config.environment },
    },
  )

  try {
    yield* logger.info("Echo Stack Authentication Setup", {
      service: "database-seed",
      operation: "auth-info",
    })

    yield* logger.info("Database tables ready for BetterAuth", {
      service: "database-seed",
      operation: "auth-info",
      metadata: {
        tables: [
          "user - User accounts",
          "session - User sessions",
          "account - OAuth accounts",
          "verification - Email verification tokens",
          "trustedToken - Password reset tokens",
          "jwks - JWT signing keys",
        ],
      },
    })

    yield* logger.info("Authentication system features:", {
      service: "database-seed",
      operation: "auth-info",
      metadata: {
        features: [
          "Email/password authentication",
          "Email verification flow",
          "JWT token generation",
          "Session management",
          "Password reset (ready for implementation)",
        ],
      },
    })

    yield* logger.success(aviationMessages.completing("Database seeding"), {
      service: "database-seed",
      operation: "completion",
    })

    // Provide test account information
    yield* logger.info("Test Account Recommendations:", {
      service: "database-seed",
      metadata: {
        note: "Create these accounts manually using /sign-up",
        accounts: recommendedTestUsers.map(
          (u) => `${u.name} (${u.email}) - password: ${u.password}`,
        ),
        signUpUrl: "/sign-up",
        signInUrl: "/sign-in",
      },
    })

    yield* logger.info("Development Testing Guide:", {
      service: "database-seed",
      metadata: {
        steps: [
          "1. Visit /sign-up to create test accounts",
          "2. Use recommended emails above with password 'password123'",
          "3. Check Mailpit at localhost:8025 for verification emails",
          "4. Complete email verification flow",
          "5. Test sign-in/out functionality",
          "6. Verify session management",
        ],
      },
    })

    yield* logger.info("Email Development Setup:", {
      service: "database-seed",
      metadata: {
        mailpit: "localhost:8025 - View all emails in development",
        verification: "Email verification links work automatically",
        production: "Switch to Resend in production with RESEND_API_KEY",
      },
    })
  } catch (error) {
    yield* logger.error(`Seeding failed: ${error}`, {
      service: "database-seed",
      operation: "failure",
      metadata: { error: String(error) },
    })
    yield* Effect.fail(error)
  }
})

// Main execution
const program = seedDatabase.pipe(
  Effect.provide(LoggerLayer),
  Effect.withConfigProvider(ConfigProvider.fromEnv()),
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      const logger = yield* Logger
      yield* logger.error(`Seeding failed: ${error}`, {
        service: "database-seed",
        operation: "failure",
        metadata: { error: String(error) },
      })
      yield* logger.error("Troubleshooting:", {
        service: "database-seed",
        metadata: {
          steps: [
            "Ensure database is running and migrated",
            "Check DATABASE_URL in .env file",
            "Try: bun run db:health",
            "Run: bun run db:setup (includes migration)",
          ],
        },
      })
      yield* Effect.fail(new Error("Database seeding failed"))
    }).pipe(Effect.provide(LoggerLayer)),
  ),
)

Effect.runPromise(program).catch(() => process.exit(1))
