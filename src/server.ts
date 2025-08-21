import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server"
import { createRouter } from "./router"
import { Effect, Console } from "effect"
import { AppLayer } from "./lib/app-services"
import { ConfigService } from "./lib/config-service"
import { checkDatabaseHealth } from "./server/db/database-service"
import { setupGracefulShutdown } from "./lib/graceful-shutdown"

/**
 * Enhanced Server Entry Point with Resource Management
 *
 * This server now uses Effect's service architecture for:
 * - Type-safe configuration validation
 * - Proper database resource management
 * - Health monitoring
 * - Graceful shutdown handling
 */

// Setup graceful shutdown handling
setupGracefulShutdown({
  gracePeriodMs: 10000,
  forceExitTimeoutMs: 15000,
})

// Initialize services and validate startup
const initializeServer = Effect.gen(function* () {
  yield* Console.log("🚀 Starting Echo Stack server...")

  // Validate configuration
  const configService = yield* ConfigService
  const config = yield* configService.getConfig()
  yield* Console.log(`📋 Environment: ${config.environment}`)
  yield* Console.log(`🌐 Server: ${config.server.host}:${config.server.port}`)

  // Check database health
  const health = yield* checkDatabaseHealth
  if (!health.healthy) {
    return yield* Effect.fail(
      new Error(`Database health check failed: ${health.message}`),
    )
  }

  yield* Console.log(
    `🏥 Database: ✅ healthy (${health.latencyMs}ms, ${health.connectionCount} connections)`,
  )

  yield* Console.log("✅ All services initialized successfully")
  return config
})

// Guard against dual initialization in development (Vite runs both SSR and client processes)
const globalKey = "__ECHO_STACK_SERVER_INITIALIZED"
if (!(globalKey in globalThis)) {
  ;(globalThis as Record<string, unknown>)[globalKey] = true

  // Run initialization with proper error handling
  try {
    await Effect.runPromise(initializeServer.pipe(Effect.provide(AppLayer)))
  } catch (error) {
    console.error("\n💥 Server failed to start:")
    console.error(`   ${error}`)
    process.exit(1)
  }
} else {
  console.log("🔄 Server already initialized (development dual-process)")
}

export default createStartHandler({
  createRouter,
})(defaultStreamHandler)
