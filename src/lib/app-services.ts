import { Layer } from "effect"
import { ConfigServiceLayer } from "./config-service"
import { DatabaseServiceLayer } from "../server/db/database-service"
import { AuthServiceLayer } from "./auth-service"
import { LoggerLayer } from "./logger-service"

/**
 * Application Services Layer
 *
 * This module provides the main application layer that combines all services
 * with proper dependency injection and ensures services are started and stopped
 * in the correct order.
 */

/**
 * Simple Layer composition - let Effect handle dependency resolution
 *
 * Layer.mergeAll will automatically resolve dependencies:
 * 1. ConfigService and Logger have no dependencies
 * 2. DatabaseService depends on ConfigService
 * 3. AuthService depends on ConfigService + DatabaseService
 */
export const AppLayer = Layer.mergeAll(
  LoggerLayer, // No dependencies
  ConfigServiceLayer, // No dependencies
  DatabaseServiceLayer, // Requires ConfigService
  AuthServiceLayer, // Requires ConfigService + DatabaseService
)

/**
 * Development layer with additional development-specific services
 */
export const DevAppLayer = AppLayer

/**
 * Production layer with production-optimized configuration
 */
export const ProdAppLayer = AppLayer

/**
 * Test layer with test-specific services and mocks
 */
export const TestAppLayer = AppLayer
