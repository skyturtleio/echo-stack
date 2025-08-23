import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { sql } from "drizzle-orm"
import { Effect, Layer, Context, Schedule } from "effect"
import {
  DatabaseConnectionError,
  DatabaseTransactionError,
  DatabaseQueryError,
  DatabaseHealthCheckError,
} from "../../lib/errors"
import { ConfigService } from "../../lib/config-service"
import * as schema from "./schema"

/**
 * Enhanced Database Service with Resource Management
 *
 * This service provides safe database operations with proper resource management,
 * connection pooling, health monitoring, and structured error handling.
 */

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>
export type PostgresClient = ReturnType<typeof postgres>

/**
 * Database health status
 */
export interface DatabaseHealthStatus {
  readonly healthy: boolean
  readonly timestamp: Date
  readonly message: string
  readonly connectionCount?: number
  readonly latencyMs?: number
}

/**
 * Database Service interface
 */
export interface DatabaseService {
  readonly query: DrizzleDatabase
  readonly health: () => Effect.Effect<
    DatabaseHealthStatus,
    DatabaseHealthCheckError
  >
  readonly withTransaction: <A, E>(
    operation: (
      tx: Parameters<Parameters<DrizzleDatabase["transaction"]>[0]>[0],
    ) => Effect.Effect<A, E>,
  ) => Effect.Effect<A, DatabaseTransactionError | E>
  readonly runQuery: <A>(
    queryBuilder: (db: DrizzleDatabase) => Promise<A>,
  ) => Effect.Effect<A, DatabaseQueryError>
}

/**
 * Database Service tag
 */
export const DatabaseService = Context.GenericTag<DatabaseService>(
  "@app/DatabaseService",
)

/**
 * Connection configuration
 */
interface DatabaseConnectionConfig {
  readonly url: string
  readonly maxConnections: number
  readonly idleTimeoutMs: number
  readonly connectTimeoutMs: number
}

/**
 * Database health check with detailed metrics
 */
const performHealthCheck = (client: PostgresClient) =>
  Effect.gen(function* () {
    const startTime = Date.now()

    try {
      const result = yield* Effect.tryPromise({
        try: () => client`
          SELECT 
            1 as healthy,
            NOW() as timestamp,
            (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as connection_count
        `,
        catch: (error) =>
          new DatabaseHealthCheckError({
            cause: error,
            timestamp: new Date(),
          }),
      })

      const latency = Date.now() - startTime
      const row = result[0]

      if (!row) {
        return yield* Effect.fail(
          new DatabaseHealthCheckError({
            cause: "No result from health check query",
            timestamp: new Date(),
          }),
        )
      }

      return {
        healthy: true,
        timestamp: new Date(row.timestamp),
        message: "Database is healthy",
        connectionCount: Number(row.connection_count),
        latencyMs: latency,
      } as DatabaseHealthStatus
    } catch (error) {
      return yield* Effect.fail(
        new DatabaseHealthCheckError({
          cause: error,
          timestamp: new Date(),
        }),
      )
    }
  })

/**
 * Execute database transaction with proper error handling
 */
const executeTransaction = <A, E>(
  db: DrizzleDatabase,
  operation: (
    tx: Parameters<Parameters<DrizzleDatabase["transaction"]>[0]>[0],
  ) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    return yield* Effect.tryPromise({
      try: async () => {
        return await db.transaction(async (tx) => {
          const result = await Effect.runPromise(operation(tx))
          return result
        })
      },
      catch: (error) =>
        new DatabaseTransactionError({
          operation: "transaction",
          cause: error,
        }),
    })
  })

/**
 * Execute a database query with error handling
 */
const runDatabaseQuery = <A>(
  db: DrizzleDatabase,
  queryBuilder: (db: DrizzleDatabase) => Promise<A>,
) =>
  Effect.tryPromise({
    try: () => queryBuilder(db),
    catch: (error) =>
      new DatabaseQueryError({
        query: "custom-query",
        cause: error,
      }),
  })

/**
 * Global connection pool - created once and reused
 * This prevents the connection churn issue by maintaining a persistent pool
 */
/**
 * Global database connection (singleton pattern for server environments)
 */
let globalDbConnection: { client: PostgresClient; db: DrizzleDatabase } | null = null

/**
 * Get or create the global database connection
 */
const getGlobalConnection = (config: DatabaseConnectionConfig) =>
  Effect.gen(function* () {
    if (globalDbConnection === null) {
      console.log("🔌 Creating global database connection pool...")

      // Create postgres client with connection pooling
      const client = postgres(config.url, {
        max: config.maxConnections,
        idle_timeout: Math.floor(config.idleTimeoutMs / 1000),
        connect_timeout: Math.floor(config.connectTimeoutMs / 1000),
        transform: {
          undefined: null,
        },
        prepare: false,
        debug: process.env.NODE_ENV === "development",
      })

      // Create Drizzle instance
      const db = drizzle(client, { schema })

      // Test the connection
      yield* Effect.retry(
        Effect.tryPromise({
          try: () => client`SELECT 1 as connected, NOW() as timestamp`,
          catch: (error) =>
            new DatabaseConnectionError({
              cause: error,
              connectionString: config.url.replace(
                /:\/\/[^@]+@/,
                "://***:***@",
              ),
            }),
        }),
        Schedule.exponential("1 second").pipe(
          Schedule.intersect(Schedule.recurs(3)),
        ),
      )

      globalDbConnection = { client, db }
      console.log("✅ Global database connection pool established")
    }

    return globalDbConnection
  })

/**
 * Database Service Layer implementation with proper resource management
 *
 * This layer requires ConfigService and provides DatabaseService
 * Layer<DatabaseService, never, ConfigService>
 */
const DatabaseServiceLive = Layer.effect(
  DatabaseService,
  Effect.gen(function* () {
    // Get configuration from ConfigService
    const configService = yield* ConfigService
    const dbConfig = yield* configService.getDatabaseConfig()

    // Create connection configuration
    const connectionConfig: DatabaseConnectionConfig = {
      url: dbConfig.url,
      maxConnections: 10,
      idleTimeoutMs: 20000,
      connectTimeoutMs: 10000,
    }

    // Get or create the global connection
    const { client, db } = yield* getGlobalConnection(connectionConfig)

    // Return service implementation
    return DatabaseService.of({
      query: db,

      health: () => performHealthCheck(client),

      withTransaction: <A, E>(
        operation: (
          tx: Parameters<Parameters<DrizzleDatabase["transaction"]>[0]>[0],
        ) => Effect.Effect<A, E>,
      ) => executeTransaction(db, operation),

      runQuery: <A>(queryBuilder: (db: DrizzleDatabase) => Promise<A>) =>
        runDatabaseQuery(db, queryBuilder),
    })
  }),
)

/**
 * Database Service Layer - requires ConfigService dependency
 * Type: Layer<DatabaseService, never, ConfigService>
 */
export const DatabaseServiceLayer = DatabaseServiceLive

/**
 * Utility functions for database operations
 */
export const withDatabase = <A, E, R>(
  operation: (db: DrizzleDatabase) => Effect.Effect<A, E, R>,
) =>
  Effect.gen(function* () {
    const dbService = yield* DatabaseService
    return yield* operation(dbService.query)
  })

export const withTransaction = <A, E>(
  operation: (
    tx: Parameters<Parameters<DrizzleDatabase["transaction"]>[0]>[0],
  ) => Effect.Effect<A, E>,
) =>
  Effect.gen(function* () {
    const dbService = yield* DatabaseService
    return yield* dbService.withTransaction(operation)
  })

export const executeQuery = <A>(
  queryBuilder: (db: DrizzleDatabase) => Promise<A>,
) =>
  Effect.gen(function* () {
    const dbService = yield* DatabaseService
    return yield* dbService.runQuery(queryBuilder)
  })

export const checkDatabaseHealth = () =>
  Effect.gen(function* () {
    const dbService = yield* DatabaseService
    return yield* dbService.health()
  })

// Re-export for convenience
export { sql }
