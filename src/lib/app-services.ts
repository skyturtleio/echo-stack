import { Layer } from "effect"
import { ConfigServiceLayer } from "./config-service"
import { DatabaseServiceLayer } from "../server/db/database-service"
import { AuthServiceLayer } from "./auth-service"
import { LoggerLayer } from "./logger-service"
import { EmailServiceLayer } from "./email-service"

/**
 * Application Services Layer
 *
 * This module provides the main application layer that combines all services
 * with proper dependency injection and ensures services are started and stopped
 * in the correct order.
 */

/**
 * Main application layer that provides all services
 *
 * Dependencies are resolved explicitly:
 * - ConfigService has no dependencies (reads from environment)
 * - DatabaseService depends on ConfigService
 * - EmailService depends on ConfigService and Logger
 * - AuthService depends on ConfigService and DatabaseService
 */
export const AppLayer = Layer.mergeAll(
  LoggerLayer,
  ConfigServiceLayer,
  DatabaseServiceLayer.pipe(Layer.provide(ConfigServiceLayer)),
  EmailServiceLayer.pipe(
    Layer.provide(Layer.mergeAll(ConfigServiceLayer, LoggerLayer)),
  ),
  AuthServiceLayer.pipe(
    Layer.provide(
      Layer.mergeAll(
        ConfigServiceLayer,
        DatabaseServiceLayer.pipe(Layer.provide(ConfigServiceLayer)),
      ),
    ),
  ),
)
