/**
 * Effect Logger Service - Echo Stack
 *
 * Structured logging with Effect.ts patterns, replacing console.* statements
 * with proper observability for both development and production environments.
 *
 * Features:
 * - Structured JSON logging for production
 * - Colorized console output for development
 * - Context-aware logging with metadata
 * - Aviation-themed operational levels (takeoff, cruise, landing, clearskies)
 * - Effect-integrated with proper resource management
 */

import { Effect, Context, Layer, Config } from "effect"
import { getProjectName } from "./project-utils"
import { ConfigProvider } from "effect"

// Standard log levels with optional aviation-themed operational messages
export type LogLevel = "debug" | "info" | "warn" | "error" | "success"

export interface LogContext {
  service?: string
  operation?: string
  userId?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

export interface LoggerConfig {
  level: LogLevel
  format: "console" | "json"
  enableColors: boolean
  enableTimestamp: boolean
}

// Logger service interface - standard methods only
export interface Logger {
  debug: (message: string, context?: LogContext) => Effect.Effect<void>
  info: (message: string, context?: LogContext) => Effect.Effect<void>
  warn: (message: string, context?: LogContext) => Effect.Effect<void>
  error: (message: string, context?: LogContext) => Effect.Effect<void>
  success: (message: string, context?: LogContext) => Effect.Effect<void>
}

// Logger context tag for dependency injection
export const Logger = Context.GenericTag<Logger>("@app/Logger")

// Console colors for development
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
}

// Emoji mappings for standard log levels
const emojis = {
  debug: "🔍",
  info: "📡",
  warn: "⚠️",
  error: "❌",
  success: "✅",
}

// Configuration loader with defaults
const LoggerConfigLoader = Config.all({
  level: Config.withDefault(
    Config.literal("debug", "info", "warn", "error", "success")("LOG_LEVEL"),
    "info" as const,
  ),
  format: Config.withDefault(
    Config.literal("console", "json")("LOG_FORMAT"),
    "console" as const,
  ),
  enableColors: Config.withDefault(Config.boolean("LOG_COLORS"), true),
  enableTimestamp: Config.withDefault(Config.boolean("LOG_TIMESTAMP"), true),
})

// Logger implementation
const LoggerLive = Layer.effect(
  Logger,
  Effect.gen(function* () {
    const config = yield* LoggerConfigLoader

    // Format log message based on configuration
    const formatMessage = (
      level: LogLevel | string,
      message: string,
      context?: LogContext,
    ): string => {
      const timestamp = config.enableTimestamp ? new Date().toISOString() : ""

      const emoji = emojis[level as keyof typeof emojis] || "📝"

      if (config.format === "json") {
        return JSON.stringify({
          timestamp,
          level,
          message,
          service: context?.service || getProjectName(),
          operation: context?.operation,
          userId: context?.userId,
          requestId: context?.requestId,
          metadata: context?.metadata,
        })
      }

      // Console format with colors
      let formattedMessage = ""

      if (config.enableColors) {
        const levelColors = {
          debug: colors.dim,
          info: colors.blue,
          warn: colors.yellow,
          error: colors.red,
          success: colors.green,
        }

        const color =
          levelColors[level as keyof typeof levelColors] || colors.white
        formattedMessage = `${color}${emoji} ${message}${colors.reset}`
      } else {
        formattedMessage = `${emoji} ${message}`
      }

      // Add context information if provided
      if (context?.service) {
        formattedMessage += ` [${context.service}]`
      }
      if (context?.operation) {
        formattedMessage += ` (${context.operation})`
      }
      if (context?.metadata) {
        formattedMessage += ` ${JSON.stringify(context.metadata)}`
      }

      return formattedMessage
    }

    // Create logging function
    const log = (
      level: LogLevel | string,
      message: string,
      context?: LogContext,
    ) =>
      Effect.sync(() => {
        const formattedMessage = formatMessage(level, message, context)

        // Use standard console methods based on level severity
        if (level === "error") {
          console.error(formattedMessage)
        } else if (level === "warn") {
          console.warn(formattedMessage)
        } else {
          console.log(formattedMessage)
        }
      })

    // Return logger implementation
    return Logger.of({
      debug: (message: string, context?: LogContext) =>
        log("debug", message, context),
      info: (message: string, context?: LogContext) =>
        log("info", message, context),
      warn: (message: string, context?: LogContext) =>
        log("warn", message, context),
      error: (message: string, context?: LogContext) =>
        log("error", message, context),
      success: (message: string, context?: LogContext) =>
        log("success", message, context),
    })
  }),
)

// Provide logger with environment configuration
export const LoggerLayer = LoggerLive.pipe(
  Layer.provide(Layer.setConfigProvider(ConfigProvider.fromEnv())),
)

// Convenience function for quick logging without context
export const useLogger = Effect.gen(function* () {
  return yield* Logger
})

// Aviation-themed message helpers for operational logging
export const aviationMessages = {
  starting: (operation: string) => `🚀 Taking off: ${operation}`,
  processing: (operation: string) => `✈️ In flight: ${operation}`,
  completing: (operation: string) => `🛬 Landing: ${operation} completed`,
  success: (operation: string) => `🌤️ Clear skies: ${operation} successful`,
  monitoring: (system: string) => `📡 Monitoring ${system} systems`,
}

// Quick logging functions for backward compatibility with console.*
export const log = (message: string, context?: LogContext) =>
  Effect.gen(function* () {
    const logger = yield* Logger
    yield* logger.info(message, context)
  })

export const logError = (message: string, context?: LogContext) =>
  Effect.gen(function* () {
    const logger = yield* Logger
    yield* logger.error(message, context)
  })

export const logWarn = (message: string, context?: LogContext) =>
  Effect.gen(function* () {
    const logger = yield* Logger
    yield* logger.warn(message, context)
  })

export const logSuccess = (message: string, context?: LogContext) =>
  Effect.gen(function* () {
    const logger = yield* Logger
    yield* logger.success(message, context)
  })
