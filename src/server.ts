import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server"
import { createRouter } from "./router"
import { Effect } from "effect"
import { setupGracefulShutdown } from "./lib/graceful-shutdown"

/**
 * TanStack Start Server Entry Point with Effect Integration
 *
 * This server entry point uses Effect services with proper resource management.
 * Services like database connections and email transporters use singleton patterns
 * for efficiency, while business logic remains request-scoped.
 */

// Setup graceful shutdown handling
setupGracefulShutdown({
  gracePeriodMs: 10000,
  forceExitTimeoutMs: 15000,
})

// Initialize services and validate startup
const initializeServer = async () => {
  // Import services dynamically
  const { Logger } = await import("./lib/logger-service")
  const { ConfigService } = await import("./lib/config-service")
  const { checkDatabaseHealth } = await import("./server/db/database-service")

  const serverEffect = Effect.gen(function* () {
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

  const { AppLayer } = await import("./lib/app-services")
  return await Effect.runPromise(serverEffect.pipe(Effect.provide(AppLayer)))
}

// Guard against dual initialization in development (Vite runs both SSR and client processes)
const globalKey = "__ECHO_STACK_SERVER_INITIALIZED"
if (!(globalKey in globalThis)) {
  ;(globalThis as Record<string, unknown>)[globalKey] = true

  // Run initialization with proper error handling
  try {
    await initializeServer()
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
