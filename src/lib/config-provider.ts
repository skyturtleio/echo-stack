import { ConfigProvider } from "effect"
import {
  getProjectDatabaseUrl,
  getJWTIssuer,
  getTestJWTIssuer,
} from "./project-utils"

/**
 * Configuration Providers for Different Environments
 *
 * This module provides ConfigProvider instances for different deployment environments
 * and testing scenarios.
 */

/**
 * Default configuration provider that reads from environment variables
 * Uses underscore as path delimiter (e.g., SMTP_HOST, RESEND_API_KEY)
 */
export const defaultProvider = ConfigProvider.fromEnv({
  pathDelim: "_",
  seqDelim: ",",
})

/**
 * Demo configuration provider with fallback values
 * ONLY used for demos and special testing scenarios where .env is not available
 * NOT used for normal development - use .env file instead
 */
export const demoProvider = defaultProvider.pipe(
  ConfigProvider.orElse(() =>
    ConfigProvider.fromMap(
      new Map([
        ["NODE_ENV", "development"],
        ["HOST", "localhost"],
        ["PORT", "3000"],
        ["DATABASE_URL", getProjectDatabaseUrl("dev")],
        ["BETTER_AUTH_SECRET", "development-secret-key-minimum-32-chars"],
        ["BETTER_AUTH_URL", "http://localhost:3000"],
        [
          "JWT_SECRET",
          "development-jwt-secret-for-integrations-minimum-32-chars",
        ],
        ["JWT_ISSUER", getJWTIssuer()],
        // Nested SMTP configuration (SMTP.*)
        ["SMTP_HOST", "localhost"],
        ["SMTP_PORT", "1025"],
        ["SMTP_USER", ""],
        ["SMTP_PASSWORD", ""],
        // Nested Resend configuration (RESEND.*)
        ["RESEND_API_KEY", "re_development_key_placeholder"],
        ["RESEND_FROM_EMAIL", "dev@localhost.local"],
      ]),
    ),
  ),
)

/**
 * Test configuration provider for unit/integration tests
 * Provides isolated configuration values for testing
 */
export const testProvider = ConfigProvider.fromMap(
  new Map([
    ["NODE_ENV", "test"],
    ["HOST", "localhost"],
    ["PORT", "3001"],
    ["DATABASE_URL", getProjectDatabaseUrl("test")],
    ["BETTER_AUTH_SECRET", "test-secret-key-minimum-32-characters"],
    ["BETTER_AUTH_URL", "http://localhost:3001"],
    ["JWT_SECRET", "test-jwt-secret-minimum-32-characters-long"],
    ["JWT_ISSUER", getTestJWTIssuer()],
    // Nested SMTP configuration
    ["SMTP.HOST", "localhost"],
    ["SMTP.PORT", "1025"],
    ["SMTP.USER", "test"],
    ["SMTP.PASSWORD", "test"],
    // Nested Resend configuration
    ["RESEND.API_KEY", "test-resend-key"],
    ["RESEND.FROM_EMAIL", "test@example.com"],
  ]),
)

/**
 * Production configuration provider
 * Ensures all required environment variables are present for production deployment
 */
export const productionProvider = defaultProvider

/**
 * Get the appropriate config provider based on NODE_ENV
 *
 * IMPORTANT: All environments now use strict configuration (fail fast)
 * - Development/Production: Pure environment variables from .env - NO fallbacks
 * - Test: Hardcoded test values
 * - Demo: Use demoProvider only when explicitly requested via DEMO_MODE
 */
export const getConfigProvider = () => {
  const env = process.env.NODE_ENV || "development"
  const isDemoMode = process.env.DEMO_MODE === "true"

  if (isDemoMode && env === "development") {
    return demoProvider // Only for explicit demo scenarios
  }

  switch (env) {
    case "production":
      return productionProvider // Pure environment variables - NO fallbacks
    case "test":
      return testProvider // Test-specific hardcoded values
    case "development":
    default:
      return defaultProvider // Pure environment variables from .env - NO fallbacks
  }
}
