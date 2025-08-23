import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server"
import { createRouter } from "./router"
import { Effect } from "effect"
import { AppLayer } from "./lib/app-services"
import { ConfigService } from "./lib/config-service"
import { checkDatabaseHealth } from "./server/db/database-service"
import { setupGracefulShutdown } from "./lib/graceful-shutdown"
import { Logger } from "./lib/logger-service"

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
  const logger = yield* Logger
  yield* logger.info("🚀 Starting Echo Stack server...")

  // Validate configuration
  const configService = yield* ConfigService
  const config = yield* configService.getConfig()
  yield* logger.info(`📋 Environment: ${config.environment}`)
  yield* logger.info(`🌐 Server: ${config.server.host}:${config.server.port}`)

  // Check database health
  const health = yield* checkDatabaseHealth()
  if (!health.healthy) {
    return yield* Effect.fail(
      new Error(`Database health check failed: ${health.message}`),
    )
  }

  yield* logger.success(
    `🏥 Database: ✅ healthy (${health.latencyMs}ms, ${health.connectionCount} connections)`,
  )

  yield* logger.success("✅ All services initialized successfully")
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
