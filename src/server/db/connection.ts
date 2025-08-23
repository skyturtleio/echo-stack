import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { sql } from "drizzle-orm"
import { Effect, Layer, Context } from "effect"
import { ValidatedDatabaseConfig } from "../../lib/config-validation"
import * as schema from "./schema"

/**
 * Database Connection Management with Effect
 *
 * This module provides a type-safe, Effect-managed database connection
 * using Drizzle ORM with PostgreSQL.
 */

// Database connection interface
export interface DatabaseService {
  readonly query: ReturnType<typeof drizzle<typeof schema>>
}

// Database service tag for dependency injection
export const DatabaseService = Context.GenericTag<DatabaseService>(
  "@app/DatabaseService",
)

/**
 * Create a database connection using Effect Config
 */
const createDatabaseConnection = Effect.gen(function* () {
  // Get validated database URL from Effect Config
  const databaseUrl = yield* ValidatedDatabaseConfig

  // Create postgres connection
  const client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

  // Create Drizzle instance
  const db = drizzle(client, { schema })

  // Test the connection
  yield* Effect.tryPromise({
    try: () => client`SELECT 1 as connected`,
    catch: (error) => new Error(`Database connection failed: ${error}`),
  })

  console.log("✅ Database connection established")

  return {
    query: db,
    // Store the client for cleanup
    _client: client,
  }
})

/**
 * Database service layer for dependency injection
 */
export const DatabaseLive = Layer.effect(
  DatabaseService,
  createDatabaseConnection.pipe(
    Effect.map((connection) => ({
      query: connection.query,
    })),
  ),
)

/**
 * Simplified database access for one-off operations
 */
export const withDatabase = <R, E, A>(
  effect: (
    db: ReturnType<typeof drizzle<typeof schema>>,
  ) => Effect.Effect<A, E, R>,
) =>
  Effect.gen(function* () {
    const { query } = yield* DatabaseService
    return yield* effect(query)
  })

/**
 * Execute a database transaction
 */
export const withTransaction = <E, A>(
  effect: (
    tx: Parameters<
      Parameters<ReturnType<typeof drizzle<typeof schema>>["transaction"]>[0]
    >[0],
  ) => Effect.Effect<A, E, never>,
) =>
  Effect.gen(function* () {
    const { query } = yield* DatabaseService
    return yield* Effect.tryPromise({
      try: () => query.transaction((tx) => Effect.runPromise(effect(tx))),
      catch: (error) => new Error(`Transaction failed: ${error}`),
    })
  })

/**
 * Health check for database connection
 */
export const checkDatabaseHealth = () =>
  Effect.gen(function* () {
    const { query } = yield* DatabaseService

    return yield* Effect.tryPromise({
      try: async () => {
        const result = await query.execute(
          sql`SELECT 1 as healthy, NOW() as timestamp`,
        )
        return {
          healthy: true,
          timestamp: result[0]?.timestamp,
          message: "Database connection is healthy",
        }
      },
      catch: (error) => ({
        healthy: false,
        message: `Database health check failed: ${error}`,
        error,
      }),
    })
  })

// Re-export for convenience
export { sql }
