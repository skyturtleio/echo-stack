# 🛩️ Echo Stack Architecture - Flight Systems Manual

> **"Understanding Your Aircraft's Systems"**  
> A comprehensive guide to Echo Stack's Effect.ts-powered architecture for single-seat developers.

## Architecture Philosophy ✈️

Echo Stack follows a **pragmatic hybrid approach** that balances the power of Effect.ts with ecosystem familiarity:

- **Effect.ts for Infrastructure** - Configuration, services, resource management, observability
- **Ecosystem Standards for Application** - React, TanStack Router, familiar patterns
- **Single-Seat Operation** - One developer can understand and maintain the entire stack

## High-Level Architecture 🗺️

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   React App     │  │  TanStack Query │  │  Auth Client │ │
│  │   Components    │  │    & Router     │  │  BetterAuth  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                               HTTP
                                │
┌─────────────────────────────────────────────────────────────┐
│                  TanStack Start Server                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   API Routes    │  │   Server Side   │  │   Static     │ │
│  │   + Functions   │  │   Rendering     │  │   Assets     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                        Effect.ts Services
                                │
┌─────────────────────────────────────────────────────────────┐
│                  Effect Services Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Config Service  │  │  Auth Service   │  │ Email Service│ │
│  │   (Flight       │  │  (Navigation)   │  │ (Comms)      │ │
│  │   Computer)     │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Logger Service  │  │ Database Service│  │ Validation   │ │
│  │ (Radar/Sensors) │  │ (Engine Mgmt)   │  │ (Instruments)│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                        Database & External
                                │
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   PostgreSQL    │  │     Resend      │  │   File       │ │
│  │   + Drizzle     │  │   (Production)  │  │   System     │ │
│  │     ORM         │  │   Mailpit (Dev) │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Flight Systems (Effect.ts Services) 🛠️

### 1. Configuration Service (Flight Computer) - `src/lib/config.ts`

The configuration service is the mission-critical brain of your application, handling environment-based configuration with complete type safety.

**Architecture Pattern:**

```typescript
// Configuration Schema Definition
const ConfigSchema = Config.struct({
  database: Config.nested("DATABASE")(DatabaseConfigSchema),
  auth: Config.nested("BETTER_AUTH")(AuthConfigSchema),
  email: Config.nested("EMAIL")(EmailConfigSchema),
  // ... other nested configs
})

// Service Composition
export class ConfigService extends Context.Tag("ConfigService")<
  ConfigService,
  {
    readonly config: Config.Config.Success<typeof ConfigSchema>
  }
>() {}
```

**Key Features:**

- **Environment Detection** - Automatic dev/test/production behavior
- **Nested Configuration** - Logical grouping with prefixes
- **Type Safety** - Compile-time validation of all config access
- **Production Validation** - Strict security requirements in production
- **Smart Defaults** - Sensible defaults for development

**Usage Pattern:**

```typescript
const myService = Effect.gen(function* () {
  const { config } = yield* ConfigService

  // Type-safe access to any configuration
  const dbUrl = config.database.url
  const authSecret = config.auth.secret
  const emailProvider = config.email.provider
})
```

### 2. Database Service (Engine Management) - `src/server/db/database-service.ts`

Handles database connections, pooling, and provides type-safe database operations through Drizzle ORM.

**Architecture Pattern:**

```typescript
export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  {
    readonly db: DrizzleDB
    readonly healthCheck: () => Effect.Effect<HealthStatus, DatabaseError>
  }
>() {}
```

**Key Features:**

- **Connection Pooling** - Efficient resource management
- **Auto-Naming** - Phoenix-style database naming by environment
- **Health Monitoring** - Built-in connection health checks
- **Type-Safe Queries** - Full TypeScript integration with Drizzle
- **Transaction Support** - Safe database operations

### 3. Logger Service (Radar/Sensors) - `src/lib/logger-service.ts`

Professional-grade structured logging that replaces all console methods with Effect-based logging.

**Architecture Pattern:**

```typescript
export class Logger extends Context.Tag("Logger")<
  Logger,
  {
    readonly debug: (message: string, meta?: LogMeta) => Effect.Effect<void>
    readonly info: (message: string, meta?: LogMeta) => Effect.Effect<void>
    readonly warn: (message: string, meta?: LogMeta) => Effect.Effect<void>
    readonly error: (message: string, meta?: LogMeta) => Effect.Effect<void>
    readonly success: (message: string, meta?: LogMeta) => Effect.Effect<void>
  }
>() {}
```

**Key Features:**

- **Structured Logging** - JSON output in production, colorized in development
- **Aviation Messages** - Fun operational logging with professional error handling
- **Context Propagation** - Automatic service, operation, and correlation ID tracking
- **Environment Aware** - Console logging in dev, JSON in production
- **Metadata Support** - Rich context and correlation tracking

### 4. Auth Service (Navigation) - `src/lib/auth-service.ts`

Wraps BetterAuth with Effect.ts patterns for type-safe authentication management.

**Architecture Pattern:**

```typescript
export class AuthService extends Context.Tag("AuthService")<
  AuthService,
  {
    readonly auth: BetterAuth
    readonly getUser: (
      request: Request,
    ) => Effect.Effect<User | null, AuthError>
  }
>() {}
```

**Key Features:**

- **BetterAuth Integration** - Production-ready authentication
- **Effect Composition** - Composable with other services
- **Type Safety** - Proper TypeScript interfaces for users and sessions
- **Email Verification** - Built-in verification workflow

### 5. Email Service (Communications) - `src/lib/email.server.ts`

Environment-aware email service with development and production providers.

**Architecture Pattern:**

```typescript
export class EmailService extends Context.Tag("EmailService")<
  EmailService,
  {
    readonly sendEmail: (
      options: EmailOptions,
    ) => Effect.Effect<EmailResult, EmailError>
  }
>() {}
```

**Key Features:**

- **Environment Switching** - Mailpit for dev, Resend for production
- **Effect Integration** - Retry logic and error handling
- **Template Support** - HTML and text email templates
- **Type Safety** - Validated email options and responses

## Service Composition Patterns 🔧

### Dependency Injection

Echo Stack uses Effect.ts's built-in dependency injection system:

```typescript
// Service Definition
export class MyService extends Context.Tag("MyService")<
  MyService,
  {
    readonly doSomething: () => Effect.Effect<Result, Error>
  }
>() {}

// Service Implementation
const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    const { config } = yield* ConfigService
    const logger = yield* Logger

    return {
      doSomething: () =>
        Effect.gen(function* () {
          yield* logger.info("Starting operation")
          // ... implementation
        }),
    }
  }),
)

// Usage in Route/Function
export async function myApiRoute() {
  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const myService = yield* MyService
      return yield* myService.doSomething()
    }).pipe(
      Effect.provide(AppLive), // Provides all services
    ),
  )

  return result
}
```

### Service Layers

Services are organized in layers from most fundamental to most dependent:

```typescript
// Layer 1: Configuration (no dependencies)
export const ConfigLive = Layer.effect(...)

// Layer 2: Infrastructure services (depend on config)
export const LoggerLive = Layer.effect(...)
export const DatabaseLive = Layer.effect(...)

// Layer 3: Application services (depend on infrastructure)
export const AuthLive = Layer.effect(...)
export const EmailLive = Layer.effect(...)

// Combined Application Layer
export const AppLive = Layer.mergeAll(
  ConfigLive,
  LoggerLive,
  DatabaseLive,
  AuthLive,
  EmailLive
)
```

## Frontend Integration 🎯

### TanStack Start Server Functions

Echo Stack uses TanStack Start's server functions to bridge the gap between frontend and Effect services:

```typescript
// In a route file
import { createServerFn } from "@tanstack/start"

export const getUserProfile = createServerFn("GET", async (userId: string) => {
  return await Effect.runPromise(
    Effect.gen(function* () {
      const db = yield* DatabaseService
      const logger = yield* Logger

      yield* logger.info("Fetching user profile", { userId })

      // Type-safe database query
      const user = yield* Effect.tryPromise(() =>
        db.db.select().from(users).where(eq(users.id, userId)),
      )

      return user[0] || null
    }).pipe(
      Effect.provide(AppLive),
      Effect.catchAll((error) => {
        // Structured error handling
        return Effect.fail({ type: "UserNotFound", userId })
      }),
    ),
  )
})
```

### React Component Integration

Components consume server functions using TanStack Query:

```typescript
import { useQuery } from "@tanstack/react-query"
import { getUserProfile } from "./user-profile.server"

export function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserProfile(userId),
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading user</div>
  if (!user) return <div>User not found</div>

  return <div>Welcome, {user.name}!</div>
}
```

## API Validation & Error Handling 🛡️

### Input Validation with Zod

```typescript
import { z } from "zod"
import { createServerFn } from "@tanstack/start"

const CreateUserSchema = z.object({
  name: z.string().min(1).transform(sanitizeText),
  email: z.string().email().transform(sanitizeEmail),
})

export const createUser = createServerFn("POST", async (input: unknown) => {
  return await Effect.runPromise(
    Effect.gen(function* () {
      const logger = yield* Logger
      const db = yield* DatabaseService

      // Validate input
      const validInput = yield* Effect.try(
        () => CreateUserSchema.parse(input),
        (error) => ({ type: "ValidationError", error }),
      )

      yield* logger.info("Creating user", { email: validInput.email })

      // Create user in database
      const user = yield* Effect.tryPromise(() =>
        db.db.insert(users).values(validInput).returning(),
      )

      yield* logger.success("User created successfully", {
        userId: user[0]?.id,
      })

      return user[0]
    }).pipe(
      Effect.provide(AppLive),
      Effect.mapError((error) => ({
        status: 400,
        message: "Failed to create user",
        error,
      })),
    ),
  )
})
```

### Structured Error Responses

```typescript
// src/lib/errors.ts
export const ApiError = {
  validation: (details: unknown) => ({
    type: "VALIDATION_ERROR" as const,
    status: 400,
    message: "Invalid input provided",
    details,
  }),

  notFound: (resource: string) => ({
    type: "NOT_FOUND" as const,
    status: 404,
    message: `${resource} not found`,
  }),

  unauthorized: () => ({
    type: "UNAUTHORIZED" as const,
    status: 401,
    message: "Authentication required",
  }),
}
```

## Database Patterns 🗄️

### Schema Definition

```typescript
// src/server/db/schema.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### Database Operations

```typescript
const getUserByEmail = (email: string) =>
  Effect.gen(function* () {
    const { db } = yield* DatabaseService
    const logger = yield* Logger

    yield* logger.debug("Querying user by email", { email })

    const users = yield* Effect.tryPromise({
      try: () =>
        db.select().from(usersTable).where(eq(usersTable.email, email)),
      catch: (error) => ({ type: "DatabaseError", error }),
    })

    return users[0] || null
  })
```

## Testing Patterns 🧪

### Integration Tests

```typescript
// test/integration/user-service.test.ts
import { describe, test, expect } from "bun:test"
import { Effect } from "effect"

describe("User Service Integration", () => {
  test("should create and retrieve user", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const userService = yield* UserService

        const newUser = yield* userService.create({
          name: "Test User",
          email: "test@example.com",
        })

        const retrievedUser = yield* userService.getByEmail("test@example.com")

        expect(retrievedUser?.id).toBe(newUser.id)
        return retrievedUser
      }).pipe(Effect.provide(TestAppLive)),
    )

    expect(result?.name).toBe("Test User")
  })
})
```

### Test Layer Configuration

```typescript
// test/helpers/test-layers.ts
export const TestConfigLive = Layer.succeed(ConfigService, {
  config: {
    database: { url: "postgresql://test:test@localhost:5432/test_db" },
    logger: { level: "error", format: "console" },
    // ... test configuration
  },
})

export const TestAppLive = Layer.mergeAll(
  TestConfigLive,
  LoggerLive,
  DatabaseLive,
  // ... other test services
)
```

## Development Workflow 🔄

### Adding a New Service

1. **Define the service interface:**

```typescript
export class MyService extends Context.Tag("MyService")<
  MyService,
  {
    readonly doSomething: () => Effect.Effect<Result, Error>
  }
>() {}
```

2. **Implement the service:**

```typescript
const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    const { config } = yield* ConfigService
    const logger = yield* Logger

    return {
      doSomething: () =>
        Effect.gen(function* () {
          // Implementation
        }),
    }
  }),
)
```

3. **Add to app layer:**

```typescript
export const AppLive = Layer.mergeAll(
  // ... existing services
  MyServiceLive,
)
```

4. **Use in routes:**

```typescript
export const myRoute = createServerFn("GET", async () => {
  return await Effect.runPromise(
    Effect.gen(function* () {
      const myService = yield* MyService
      return yield* myService.doSomething()
    }).pipe(Effect.provide(AppLive)),
  )
})
```

## Performance Considerations ⚡

### Connection Pooling

Database connections are automatically pooled using Drizzle's built-in pooling:

```typescript
const db = drizzle(pool, { schema })
```

### Service Memoization

Services are automatically memoized by Effect.ts, ensuring single instances per request context.

### Lazy Initialization

Services are initialized only when needed, reducing startup time and memory usage.

## Security Architecture 🔐

### Input Sanitization

All inputs go through Zod validation with automatic sanitization:

```typescript
const sanitizedInput = UserCreateSchema.parse(rawInput)
// Automatically sanitized and validated
```

### CORS Protection

Environment-based CORS policies:

```typescript
// Development: Permissive
// Production: Strict origin validation
const corsPolicy =
  yield *
  Effect.if(
    config.nodeEnv === "production",
    () => productionCorsPolicy,
    () => developmentCorsPolicy,
  )
```

### Error Information Leakage Prevention

```typescript
const handleError = (error: unknown) =>
  config.nodeEnv === "production"
    ? "Internal server error" // Generic message
    : error // Detailed error for development
```

## Monitoring & Observability 📊

### Structured Logging

```typescript
yield *
  logger.info("Operation starting", {
    service: "user-service",
    operation: "create-user",
    correlationId: generateId(),
    metadata: { userEmail: "user@example.com" },
  })
```

### Health Checks

```typescript
export const healthCheck = createServerFn("GET", async () => {
  return await Effect.runPromise(
    Effect.gen(function* () {
      const db = yield* DatabaseService
      const health = yield* db.healthCheck()

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: health.status,
        },
      }
    }).pipe(Effect.provide(AppLive)),
  )
})
```

## Best Practices 📚

### 1. Service Design

- **Single Responsibility** - Each service handles one domain
- **Dependency Injection** - Use Effect.ts's built-in DI system
- **Error Handling** - Use Effect's error channel for expected errors
- **Logging** - Include structured metadata for observability

### 2. Configuration

- **Environment Validation** - Fail fast on invalid configuration
- **Type Safety** - Use Effect Config for compile-time safety
- **Secrets Management** - Never log or expose secrets

### 3. Database Operations

- **Type Safety** - Use Drizzle's type-safe queries
- **Connection Management** - Use the provided database service
- **Migrations** - Use descriptive migration names
- **Health Checks** - Monitor database connectivity

### 4. Error Handling

- **Structured Errors** - Use typed error objects
- **User-Friendly Messages** - Hide implementation details
- **Logging** - Log all errors with context
- **Recovery** - Provide fallback behaviors where possible

### 5. Testing

- **Integration Tests** - Test service composition and real dependencies
- **Unit Tests** - Test pure functions and business logic
- **Test Layers** - Use separate configuration for testing
- **Cleanup** - Ensure tests clean up resources

---

This architecture provides a solid foundation for building production-ready applications with the power of Effect.ts while maintaining the simplicity needed for single-seat development.

_"Understanding your aircraft's systems enables confident flight in any conditions"_ ✈️
