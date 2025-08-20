# Resource Management & Safety Improvements

This document describes the resource management and safety improvements implemented using Effect's structured concurrency features.

## Overview

The improvements focus on two key areas:

1. **Proper Resource Management** - Using Effect's `acquireRelease` for safe database connections
2. **Centralized Configuration** - Type-safe configuration service with dependency injection

## What's New

### 1. Structured Error Types (`src/lib/errors.ts`)

All errors are now structured using Effect's `Data.TaggedError`:

```typescript
export class DatabaseConnectionError extends Data.TaggedError(
  "DatabaseConnectionError",
)<{
  readonly cause: unknown
  readonly connectionString?: string
}> {}

export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly field: string
  readonly reason: string
  readonly value?: unknown
}> {}
```

**Benefits:**

- Type-safe error handling
- Better debugging information
- Structured error recovery strategies

### 2. Enhanced Database Service (`src/server/db/database-service.ts`)

The new database service provides:

#### Resource Management

```typescript
const client =
  yield *
  Effect.acquireRelease(
    Effect.try(() => postgres(config.url, options)),
    (client) => Effect.sync(() => client.end()),
  )
```

**Benefits:**

- Automatic connection cleanup
- No resource leaks
- Guaranteed cleanup even on errors

#### Health Monitoring

```typescript
const healthStatus = yield * checkDatabaseHealth
// Returns: { healthy: boolean, latencyMs: number, connectionCount: number }
```

#### Structured Transactions

```typescript
const result =
  yield *
  withTransaction((tx) =>
    Effect.gen(function* () {
      // Multiple operations in transaction
      const step1 = yield* Effect.tryPromise(() => tx.execute(sql`...`))
      const step2 = yield* Effect.tryPromise(() => tx.execute(sql`...`))
      return { step1, step2 }
    }),
  )
```

### 3. Centralized Configuration Service (`src/lib/config-service.ts`)

#### Service-Based Configuration

```typescript
const configService = yield * ConfigService
const dbConfig = yield * configService.getDatabaseConfig()
const isProduction = yield * configService.isProduction()
```

**Benefits:**

- Centralized configuration access
- Type-safe configuration
- Environment-specific validation
- Dependency injection ready

#### Validation

```typescript
const AuthConfigSchema = Config.all({
  secret: Config.string("BETTER_AUTH_SECRET").pipe(
    Config.validate({
      message: "BETTER_AUTH_SECRET must be at least 32 characters long",
      validation: (secret) => secret.length >= 32,
    }),
  ),
  // ...
})
```

### 4. Application Layer (`src/lib/app-services.ts`)

Provides proper dependency injection:

```typescript
export const AppLayer = Layer.mergeAll(
  ConfigServiceLayer,
  DatabaseServiceLayer.pipe(Layer.provide(ConfigServiceLayer)),
)
```

**Benefits:**

- Automatic dependency resolution
- Service composition
- Environment-specific configurations

### 5. Graceful Shutdown (`src/lib/graceful-shutdown.ts`)

Handles application shutdown gracefully:

```typescript
setupGracefulShutdown({
  gracePeriodMs: 10000,
  forceExitTimeoutMs: 15000,
})
```

**Benefits:**

- Proper resource cleanup on shutdown
- Configurable grace periods
- Signal handling (SIGTERM, SIGINT, etc.)

## Usage Examples

### Running the Demo

```bash
# Test the new database service
bun run db:test:new

# Run the resource management demo
bun run demo:resources
```

### Using in Your Code

#### Database Operations

```typescript
import {
  withDatabase,
  withTransaction,
  checkDatabaseHealth,
} from "~/server/db/database-service"

// Simple query
const users =
  yield *
  withDatabase((db) => Effect.tryPromise(() => db.select().from(usersTable)))

// Transaction
const result =
  yield *
  withTransaction((tx) =>
    Effect.gen(function* () {
      yield* Effect.tryPromise(() => tx.insert(usersTable).values(newUser))
      yield* Effect.tryPromise(() =>
        tx.insert(profilesTable).values(newProfile),
      )
      return { success: true }
    }),
  )

// Health check
const health = yield * checkDatabaseHealth
if (!health.healthy) {
  yield * Effect.fail(new DatabaseConnectionError({ cause: health.message }))
}
```

#### Configuration Access

```typescript
import { ConfigService } from "~/lib/config-service"

const program = Effect.gen(function* () {
  const configService = yield* ConfigService
  const dbConfig = yield* configService.getDatabaseConfig()
  const isProduction = yield* configService.isProduction()

  // Use configuration...
})

// Run with services
Effect.runPromise(program.pipe(Effect.provide(AppLayer)))
```

#### Complete Application Setup

```typescript
import { AppLayer } from "~/lib/app-services"
import { setupGracefulShutdown } from "~/lib/graceful-shutdown"

const main = Effect.gen(function* () {
  // Your application logic here
  yield* Console.log("Application started")

  // Database operations
  const health = yield* checkDatabaseHealth
  yield* Console.log(`Database: ${health.healthy ? "✅" : "❌"}`)

  // Configuration access
  const configService = yield* ConfigService
  const config = yield* configService.getConfig()
  yield* Console.log(`Environment: ${config.environment}`)
})

// Setup graceful shutdown
setupGracefulShutdown()

// Run application
Effect.runPromise(main.pipe(Effect.provide(AppLayer)))
```

## Safety Improvements

### Before (Problems)

- Database connections without cleanup
- Manual resource management
- Generic error handling
- Configuration scattered across files
- No structured dependency injection

### After (Solutions)

- ✅ **Automatic resource cleanup** with `acquireRelease`
- ✅ **Structured error types** with proper error recovery
- ✅ **Centralized configuration** with validation
- ✅ **Service dependency injection** with proper composition
- ✅ **Graceful shutdown** with signal handling
- ✅ **Health monitoring** with detailed metrics
- ✅ **Transaction safety** with automatic rollback

## Key Benefits

1. **No Resource Leaks** - All database connections are automatically cleaned up
2. **Better Error Handling** - Structured errors with recovery strategies
3. **Type Safety** - Configuration and services are fully typed
4. **Testability** - Easy to mock services for testing
5. **Observability** - Health checks and monitoring built-in
6. **Production Ready** - Graceful shutdown and error recovery

## Migration Guide

To migrate existing code:

1. **Replace direct database usage**:

   ```typescript
   // Old
   const db = drizzle(postgres(url))
   const result = await db.select().from(table)

   // New
   const result =
     yield *
     withDatabase((db) => Effect.tryPromise(() => db.select().from(table)))
   ```

2. **Replace configuration access**:

   ```typescript
   // Old
   const config = await Effect.runPromise(AppConfig)

   // New
   const configService = yield * ConfigService
   const config = yield * configService.getConfig()
   ```

3. **Add service layer to your app**:
   ```typescript
   // Add to your main application
   Effect.runPromise(yourApp.pipe(Effect.provide(AppLayer)))
   ```

## Testing

The improvements include comprehensive testing utilities:

- `src/demo/resource-management-demo.ts` - Complete demonstration
- `src/server/db/test-connection-new.ts` - Enhanced database testing
- Built-in health checks and monitoring

Run tests:

```bash
bun run demo:resources    # Full demo
bun run db:test:new      # Database service test
```

This establishes a solid foundation for building robust, scalable applications with proper resource management and safety guarantees.
