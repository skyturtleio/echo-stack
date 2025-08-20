import { Effect } from "effect"

/**
 * Graceful Shutdown Handler
 *
 * This module provides utilities for handling graceful application shutdown
 * with proper resource cleanup using Effect's structured concurrency.
 */

export interface GracefulShutdownConfig {
  readonly gracePeriodMs: number
  readonly forceExitTimeoutMs: number
}

const defaultConfig: GracefulShutdownConfig = {
  gracePeriodMs: 10000, // 10 seconds
  forceExitTimeoutMs: 15000, // 15 seconds
}

/**
 * Set up graceful shutdown handlers for the current process
 */
export const setupGracefulShutdown = (
  config: GracefulShutdownConfig = defaultConfig,
) => {
  let isShuttingDown = false

  const shutdown = (signal: string, exitCode: number = 0) => {
    if (isShuttingDown) {
      console.log(`⚠️  Shutdown already in progress, ignoring ${signal}`)
      return
    }

    isShuttingDown = true
    console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`)

    // Set a force exit timeout
    const forceExitTimer = setTimeout(() => {
      console.log(`💥 Force exit after ${config.forceExitTimeoutMs}ms timeout`)
      process.exit(1)
    }, config.forceExitTimeoutMs)

    // Allow some time for cleanup
    setTimeout(() => {
      console.log("✅ Graceful shutdown completed")
      clearTimeout(forceExitTimer)
      process.exit(exitCode)
    }, config.gracePeriodMs)
  }

  // Handle different shutdown signals
  process.on("SIGTERM", () => shutdown("SIGTERM", 0))
  process.on("SIGINT", () => shutdown("SIGINT", 0))
  process.on("SIGUSR2", () => shutdown("SIGUSR2", 0)) // Nodemon restart

  // Handle uncaught exceptions and unhandled rejections
  process.on("uncaughtException", (error) => {
    console.error("💥 Uncaught Exception:", error)
    shutdown("uncaughtException", 1)
  })

  process.on("unhandledRejection", (reason, promise) => {
    console.error("💥 Unhandled Rejection at:", promise, "reason:", reason)
    shutdown("unhandledRejection", 1)
  })

  console.log("🛡️  Graceful shutdown handlers registered")
}

/**
 * Run an Effect program with graceful shutdown
 */
export const runWithGracefulShutdown = <A, E>(
  program: Effect.Effect<A, E, never>,
  config?: GracefulShutdownConfig,
) => {
  setupGracefulShutdown(config)
  return Effect.runPromise(program)
}

/**
 * Create a shutdown effect that can be composed with other effects
 */
export const createShutdownEffect = (
  message: string = "Application shutting down...",
) =>
  Effect.sync(() => {
    console.log(`🛑 ${message}`)
    process.exit(0)
  })

/**
 * Add graceful shutdown to an existing program
 */
export const withGracefulShutdown = <A, E, R>(
  program: Effect.Effect<A, E, R>,
  config?: GracefulShutdownConfig,
) => {
  setupGracefulShutdown(config)
  return program
}
