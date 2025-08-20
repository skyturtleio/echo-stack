/**
 * Effect Config for Hey Babe Couples Todo App
 *
 * This module provides type-safe configuration management using Effect.ts Config.
 * It supports development, production, and test environments with proper validation.
 *
 * @example
 * ```typescript
 * import { loadConfig, withConfigProvider, developmentProvider } from "@/lib/config"
 *
 * const program = Effect.gen(function* () {
 *   const config = yield* loadConfig
 *   console.log(`Server running on ${config.server.host}:${config.server.port}`)
 * })
 *
 * // Run with development provider
 * Effect.runPromise(Effect.withConfigProvider(program, developmentProvider))
 * ```
 */

// Re-export main configuration types and functions
export {
  AppConfig,
  Environment,
  DatabaseConfig,
  AuthConfig,
  TriliptConfig,
  EmailConfig,
  ServerConfig,
  loadConfig,
  getDatabaseConfig,
  getAuthConfig,
  getEmailConfig,
  isDevelopment,
  isProduction,
} from "./config"

// Re-export configuration providers
export {
  defaultProvider,
  developmentProvider,
  testProvider,
  productionProvider,
  getConfigProvider,
  createTestProvider,
  constantCaseProvider,
  createNestedProvider,
  getDevelopmentProviderWithFallbacks,
  getStrictProvider,
} from "./config-provider"

// Re-export validation utilities
export {
  validateUrl,
  validateDatabaseUrl,
  validatePort,
  validateEmail,
  ValidatedDatabaseConfig,
  ValidatedAuthConfig,
  ValidatedServerConfig,
  ValidatedEmailConfig,
  ValidatedAppConfig,
  loadValidatedConfig,
  validateConfiguration,
} from "./config-validation"

// Re-export startup utilities
export {
  validateStartupConfig,
  initializeConfig,
  validateDemoConfig,
} from "./config-startup"

// Re-export Effect Config utilities for convenience
export { Config, ConfigProvider, Effect, Redacted } from "effect"
