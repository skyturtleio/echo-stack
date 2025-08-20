#!/usr/bin/env bun

/**
 * Auth Service Demo
 *
 * This demo shows how the Effect-based AuthService works and provides
 * better resource management and testability compared to module-level initialization.
 */

import { Effect, Console } from "effect"
import { AppLayer } from "../lib/app-services"
import { AuthService, getAuthContext, requireAuth } from "../lib/auth-service"
import { createMockAuthService } from "../lib/auth-service-example"

/**
 * Demo: Auth Service Initialization
 */
const demoAuthServiceInit = Effect.gen(function* () {
  yield* Console.log("=== Auth Service Initialization Demo ===")

  try {
    const authService = yield* AuthService
    yield* Console.log("✅ AuthService initialized successfully")
    yield* Console.log("   - BetterAuth instance created with Effect services")
    yield* Console.log("   - Database connection managed by DatabaseService")
    yield* Console.log("   - Configuration loaded from ConfigService")
    return authService
  } catch (error) {
    yield* Console.log(`❌ AuthService initialization failed: ${error}`)
    throw error
  }
})

/**
 * Demo: Mock Authentication (for testing)
 */
const demoMockAuth = Effect.gen(function* () {
  yield* Console.log("\n=== Mock Authentication Demo ===")

  const mockRequest = new Request("http://localhost:3000/protected")

  const result = yield* getAuthContext(mockRequest).pipe(
    Effect.catchAll((error) =>
      Effect.succeed({
        user: null,
        session: null,
        jwt: null,
        error: String(error),
      }),
    ),
  )

  if (result.user) {
    yield* Console.log(`✅ Mock user authenticated: ${result.user.email}`)
    yield* Console.log(`   JWT Token: ${result.jwt?.substring(0, 20)}...`)
  } else {
    yield* Console.log("❌ No authentication (expected in this demo)")
    if ("error" in result) {
      yield* Console.log(`   Error: ${result.error}`)
    }
  }
})

/**
 * Demo: Service Composition Benefits
 */
const demoServiceComposition = Effect.gen(function* () {
  yield* Console.log("\n=== Service Composition Benefits Demo ===")

  yield* Console.log("🏗️  Architecture Benefits:")
  yield* Console.log("   • Lazy initialization - services created when needed")
  yield* Console.log(
    "   • Resource safety - database connections managed automatically",
  )
  yield* Console.log(
    "   • Environment awareness - different configs for dev/prod",
  )
  yield* Console.log("   • Testability - easy to inject mock services")
  yield* Console.log("   • Type safety - full TypeScript integration")
  yield* Console.log("   • Error handling - structured errors with recovery")
})

/**
 * Demo: Testing with Mock Service
 */
const demoWithMockService = Effect.gen(function* () {
  yield* Console.log("\n=== Testing with Mock Service Demo ===")

  const mockRequest = new Request("http://localhost:3000/protected")

  // This would use the mock service instead of real BetterAuth
  const authContext = yield* getAuthContext(mockRequest)

  yield* Console.log("✅ Mock service provides predictable test data:")
  yield* Console.log(`   User: ${authContext.user?.name || "None"}`)
  yield* Console.log(`   Email: ${authContext.user?.email || "None"}`)
  yield* Console.log(`   JWT: ${authContext.jwt ? "Present" : "None"}`)
})

/**
 * Demo: Error Handling
 */
const demoErrorHandling = Effect.gen(function* () {
  yield* Console.log("\n=== Error Handling Demo ===")

  const invalidRequest = new Request("http://localhost:3000/invalid")

  const result = yield* requireAuth(invalidRequest).pipe(
    Effect.either, // Convert error to Either for safe handling
  )

  if (result._tag === "Left") {
    yield* Console.log("✅ Error handled gracefully:")
    yield* Console.log(`   ${result.left}`)
    yield* Console.log("   Application continues running safely")
  } else {
    yield* Console.log("✅ Authentication successful")
  }
})

/**
 * Main demo program
 */
const program = Effect.gen(function* () {
  yield* Console.log("🚀 Starting Auth Service Demo\n")

  yield* demoAuthServiceInit
  yield* demoMockAuth
  yield* demoServiceComposition
  yield* demoErrorHandling

  yield* Console.log("\n✅ Auth Service Demo completed!")
  yield* Console.log("\n🔄 Comparison with old approach:")
  yield* Console.log(
    "   OLD: Module-level initialization, hardcoded config, difficult testing",
  )
  yield* Console.log(
    "   NEW: Service-based, environment-aware, easy testing, resource safe",
  )
})

/**
 * Run the demo with real services
 */
const mainWithRealServices = program.pipe(
  Effect.provide(AppLayer),
  Effect.catchAll((error) =>
    Console.log(`❌ Demo failed with real services: ${error}`),
  ),
)

/**
 * Run the demo with mock services for testing
 */
const mainWithMockServices = demoWithMockService.pipe(
  Effect.provideService(AuthService, createMockAuthService()),
  Effect.catchAll((error) => Console.log(`❌ Mock demo failed: ${error}`)),
)

// Run both demos
Promise.all([
  Effect.runPromise(mainWithRealServices),
  Effect.runPromise(
    mainWithMockServices.pipe(
      Effect.andThen(() =>
        Console.log("\n🧪 Mock service demo completed successfully!"),
      ),
    ),
  ),
]).then(() => {
  console.log("\n🎉 All auth service demos completed!")
})
