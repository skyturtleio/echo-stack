# Echo Stack Service Patterns

Common patterns for creating and using Effect.ts services in Echo Stack applications.

## Creating a New Service

### 1. Basic Service Structure

```typescript
// src/lib/my-service.ts
import { Context, Effect, Layer } from "effect"
import { ConfigService } from "./config-service"
import { Logger } from "./logger-service"

// Define the service interface
export class MyService extends Context.Tag("MyService")<
  MyService,
  {
    readonly processData: (
      input: string,
    ) => Effect.Effect<ProcessedData, MyServiceError>
    readonly getStatus: () => Effect.Effect<ServiceStatus>
  }
>() {}

// Define service-specific errors
export type MyServiceError =
  | { readonly _tag: "InvalidInput"; readonly input: string }
  | { readonly _tag: "ProcessingFailed"; readonly reason: string }

// Define return types
export interface ProcessedData {
  readonly id: string
  readonly result: string
  readonly timestamp: Date
}

export interface ServiceStatus {
  readonly healthy: boolean
  readonly lastProcessed: Date | null
}

// Implement the service
export const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    const { config } = yield* ConfigService
    const logger = yield* Logger

    let lastProcessed: Date | null = null

    return {
      processData: (input: string) =>
        Effect.gen(function* () {
          yield* logger.info(`🛫 Taking off: data processing`, {
            service: "my-service",
            operation: "process-data",
            metadata: { inputLength: input.length },
          })

          // Validate input
          if (input.length === 0) {
            return yield* Effect.fail({
              _tag: "InvalidInput" as const,
              input,
            })
          }

          // Process the data
          const result = yield* Effect.try({
            try: () => {
              // Your processing logic here
              const processed = input.toUpperCase()
              lastProcessed = new Date()
              return {
                id: crypto.randomUUID(),
                result: processed,
                timestamp: new Date(),
              }
            },
            catch: (error) => ({
              _tag: "ProcessingFailed" as const,
              reason: String(error),
            }),
          })

          yield* logger.success(`🛬 Landing: data processing completed`, {
            service: "my-service",
            operation: "process-data",
            metadata: { resultId: result.id },
          })

          return result
        }),

      getStatus: () =>
        Effect.gen(function* () {
          return {
            healthy: true,
            lastProcessed,
          }
        }),
    }
  }),
)
```

### 2. Service with Database Integration

```typescript
// src/lib/user-service.ts
import { Context, Effect, Layer } from "effect"
import { eq } from "drizzle-orm"
import { DatabaseService } from "../server/db/database-service"
import { users } from "../server/db/schema"
import { Logger } from "./logger-service"

export class UserService extends Context.Tag("UserService")<
  UserService,
  {
    readonly createUser: (
      data: CreateUserData,
    ) => Effect.Effect<User, UserServiceError>
    readonly getUserById: (
      id: string,
    ) => Effect.Effect<User | null, UserServiceError>
    readonly updateUser: (
      id: string,
      data: UpdateUserData,
    ) => Effect.Effect<User, UserServiceError>
  }
>() {}

export interface CreateUserData {
  readonly name: string
  readonly email: string
}

export interface UpdateUserData {
  readonly name?: string
  readonly email?: string
}

export type UserServiceError =
  | { readonly _tag: "DatabaseError"; readonly error: unknown }
  | { readonly _tag: "UserNotFound"; readonly id: string }
  | { readonly _tag: "EmailAlreadyExists"; readonly email: string }

export const UserServiceLive = Layer.effect(
  UserService,
  Effect.gen(function* () {
    const { db } = yield* DatabaseService
    const logger = yield* Logger

    return {
      createUser: (data: CreateUserData) =>
        Effect.gen(function* () {
          yield* logger.info("🚀 Taking off: user creation", {
            service: "user-service",
            operation: "create-user",
            metadata: { email: data.email },
          })

          // Check if email already exists
          const existingUser = yield* Effect.tryPromise({
            try: () =>
              db.select().from(users).where(eq(users.email, data.email)),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          if (existingUser.length > 0) {
            return yield* Effect.fail({
              _tag: "EmailAlreadyExists" as const,
              email: data.email,
            })
          }

          // Create new user
          const newUser = yield* Effect.tryPromise({
            try: () =>
              db
                .insert(users)
                .values({
                  id: crypto.randomUUID(),
                  name: data.name,
                  email: data.email,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })
                .returning(),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          yield* logger.success("🌤️ Clear skies: user created successfully", {
            service: "user-service",
            operation: "create-user",
            metadata: { userId: newUser[0]!.id },
          })

          return newUser[0]!
        }),

      getUserById: (id: string) =>
        Effect.gen(function* () {
          const users = yield* Effect.tryPromise({
            try: () => db.select().from(users).where(eq(users.id, id)),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          return users[0] || null
        }),

      updateUser: (id: string, data: UpdateUserData) =>
        Effect.gen(function* () {
          yield* logger.info("✈️ In flight: user update", {
            service: "user-service",
            operation: "update-user",
            metadata: { userId: id },
          })

          const updatedUser = yield* Effect.tryPromise({
            try: () =>
              db
                .update(users)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(users.id, id))
                .returning(),
            catch: (error) => ({ _tag: "DatabaseError" as const, error }),
          })

          if (updatedUser.length === 0) {
            return yield* Effect.fail({
              _tag: "UserNotFound" as const,
              id,
            })
          }

          yield* logger.success("🛬 Landing: user updated successfully", {
            service: "user-service",
            operation: "update-user",
            metadata: { userId: id },
          })

          return updatedUser[0]!
        }),
    }
  }),
)
```

## Using Services in Routes

### 1. Basic Server Function

```typescript
// src/routes/api/users.ts
import { createServerFn } from "@tanstack/start"
import { Effect } from "effect"
import { AppLive } from "~/lib/app-services"
import { UserService } from "~/lib/user-service"
import { CreateUserSchema } from "~/lib/validation"

export const createUser = createServerFn("POST", async (input: unknown) => {
  return await Effect.runPromise(
    Effect.gen(function* () {
      const userService = yield* UserService

      // Validate input
      const validInput = yield* Effect.try(
        () => CreateUserSchema.parse(input),
        (error) => ({ type: "ValidationError", error }),
      )

      // Create user
      const user = yield* userService.createUser(validInput)

      return { success: true, user }
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

### 2. Authenticated Route

```typescript
// src/routes/api/profile.ts
import { createServerFn } from "@tanstack/start"
import { Effect } from "effect"
import { AppLive } from "~/lib/app-services"
import { UserService } from "~/lib/user-service"
import { AuthService } from "~/lib/auth-service"

export const getProfile = createServerFn("GET", async (request: Request) => {
  return await Effect.runPromise(
    Effect.gen(function* () {
      const authService = yield* AuthService
      const userService = yield* UserService

      // Get authenticated user
      const authUser = yield* authService.getUser(request)
      if (!authUser) {
        return yield* Effect.fail({ status: 401, message: "Unauthorized" })
      }

      // Get full user profile
      const user = yield* userService.getUserById(authUser.id)
      if (!user) {
        return yield* Effect.fail({ status: 404, message: "User not found" })
      }

      return { user }
    }).pipe(
      Effect.provide(AppLive),
      Effect.mapError((error) => ({
        status: error.status || 500,
        message: error.message || "Internal server error",
      })),
    ),
  )
})
```

## Error Handling Patterns

### 1. Service-Level Error Handling

```typescript
const handleUserServiceError = (error: UserServiceError) =>
  Effect.gen(function* () {
    const logger = yield* Logger

    switch (error._tag) {
      case "UserNotFound":
        yield* logger.warn(`User not found: ${error.id}`)
        return { status: 404, message: "User not found" }

      case "EmailAlreadyExists":
        yield* logger.warn(`Email already exists: ${error.email}`)
        return { status: 409, message: "Email already exists" }

      case "DatabaseError":
        yield* logger.error("Database error in user service", {
          error: error.error,
        })
        return { status: 500, message: "Internal server error" }
    }
  })
```

### 2. Global Error Handling

```typescript
// src/lib/error-handler.ts
import { Effect } from "effect"
import { Logger } from "./logger-service"

export const handleApiError = (error: unknown) =>
  Effect.gen(function* () {
    const logger = yield* Logger

    // Log the error
    yield* logger.error("API error occurred", { error })

    // Return appropriate response
    if (error && typeof error === "object" && "status" in error) {
      return error as { status: number; message: string }
    }

    return { status: 500, message: "Internal server error" }
  })
```

## Testing Patterns

### 1. Service Testing

```typescript
// test/unit/user-service.test.ts
import { describe, test, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { UserService, UserServiceLive } from "~/lib/user-service"
import {
  TestConfigLive,
  TestDatabaseLive,
  TestLoggerLive,
} from "../helpers/test-layers"

const TestAppLive = Layer.mergeAll(
  TestConfigLive,
  TestLoggerLive,
  TestDatabaseLive,
  UserServiceLive,
)

describe("UserService", () => {
  test("should create user successfully", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const userService = yield* UserService

        const user = yield* userService.createUser({
          name: "Test User",
          email: "test@example.com",
        })

        expect(user.name).toBe("Test User")
        expect(user.email).toBe("test@example.com")
        expect(user.id).toBeDefined()

        return user
      }).pipe(Effect.provide(TestAppLive)),
    )

    expect(result.name).toBe("Test User")
  })

  test("should handle duplicate email error", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const userService = yield* UserService

        // Create first user
        yield* userService.createUser({
          name: "First User",
          email: "duplicate@example.com",
        })

        // Try to create second user with same email
        const duplicateResult = yield* Effect.either(
          userService.createUser({
            name: "Second User",
            email: "duplicate@example.com",
          }),
        )

        return duplicateResult
      }).pipe(Effect.provide(TestAppLive)),
    )

    expect(result._tag).toBe("Left")
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("EmailAlreadyExists")
    }
  })
})
```

## Configuration Patterns

### 1. Service-Specific Configuration

```typescript
// src/lib/config.ts
import { Config } from "effect"

export const MyServiceConfigSchema = Config.struct({
  enabled: Config.boolean("ENABLED").pipe(Config.withDefault(true)),
  apiKey: Config.string("API_KEY"),
  timeout: Config.number("TIMEOUT").pipe(Config.withDefault(5000)),
  retries: Config.number("RETRIES").pipe(Config.withDefault(3)),
})

// Usage in service
export const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    const { config } = yield* ConfigService
    const myConfig = config.myService // Type-safe access

    return {
      // Use myConfig.enabled, myConfig.apiKey, etc.
    }
  }),
)
```

### 2. Environment-Specific Behavior

```typescript
const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    const { config } = yield* ConfigService
    const logger = yield* Logger

    const isDevelopment = config.nodeEnv === "development"
    const isProduction = config.nodeEnv === "production"

    return {
      processData: (input: string) =>
        Effect.gen(function* () {
          if (isDevelopment) {
            yield* logger.debug("Development mode: detailed logging enabled")
          }

          // Different behavior per environment
          const timeout = isProduction ? 30000 : 5000

          // ... implementation
        }),
    }
  }),
)
```

## Advanced Patterns

### 1. Service Composition

```typescript
// Compose multiple services for complex operations
export const createUserWithProfile = (
  userData: CreateUserData,
  profileData: ProfileData,
) =>
  Effect.gen(function* () {
    const userService = yield* UserService
    const profileService = yield* ProfileService
    const emailService = yield* EmailService
    const logger = yield* Logger

    yield* logger.info("🛫 Taking off: user creation with profile")

    // Create user
    const user = yield* userService.createUser(userData)

    // Create profile
    const profile = yield* profileService.createProfile(user.id, profileData)

    // Send welcome email
    yield* emailService.sendWelcomeEmail(user.email, user.name)

    yield* logger.success(
      "🌤️ Clear skies: user with profile created successfully",
    )

    return { user, profile }
  })
```

### 2. Resource Management

```typescript
// Service with resource cleanup
export const FileServiceLive = Layer.scoped(
  FileService,
  Effect.gen(function* () {
    const tempDir = yield* Effect.acquireRelease(
      Effect.sync(() => fs.mkdtempSync("/tmp/app-temp-")),
      (dir) => Effect.sync(() => fs.rmSync(dir, { recursive: true })),
    )

    return {
      processFile: (file: File) =>
        Effect.gen(function* () {
          // File processing using tempDir
          // Cleanup happens automatically when scope ends
        }),
    }
  }),
)
```

### 3. Concurrent Operations

```typescript
export const processMultipleUsers = (userIds: string[]) =>
  Effect.gen(function* () {
    const userService = yield* UserService
    const logger = yield* Logger

    yield* logger.info(`Processing ${userIds.length} users concurrently`)

    // Process all users concurrently
    const results = yield* Effect.all(
      userIds.map((id) => userService.processUser(id)),
      { concurrency: 5 }, // Limit concurrency
    )

    yield* logger.success(`Processed ${results.length} users successfully`)

    return results
  })
```
