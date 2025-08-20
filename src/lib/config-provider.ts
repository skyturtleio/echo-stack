import { ConfigProvider } from "effect"

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
 * Development configuration provider with fallback values
 * ONLY used when .env file is missing - primarily for demos and testing
 * In normal development, developers should use their .env file
 */
export const developmentProvider = defaultProvider.pipe(
  ConfigProvider.orElse(() =>
    ConfigProvider.fromMap(
      new Map([
        ["NODE_ENV", "development"],
        ["HOST", "localhost"],
        ["PORT", "3000"],
        [
          "DATABASE_URL",
          "postgresql://user:password@localhost:5432/hey_babe_dev",
        ],
        ["BETTER_AUTH_SECRET", "development-secret-key-minimum-32-chars"],
        ["BETTER_AUTH_URL", "http://localhost:3000"],
        [
          "JWT_SECRET",
          "development-jwt-secret-for-integrations-minimum-32-chars",
        ],
        ["JWT_ISSUER", "echo-stack-app"],
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
    ["DATABASE_URL", "postgresql://user:password@localhost:5432/hey_babe_test"],
    ["BETTER_AUTH_SECRET", "test-secret-key-minimum-32-characters"],
    ["BETTER_AUTH_URL", "http://localhost:3001"],
    ["JWT_SECRET", "test-jwt-secret-minimum-32-characters-long"],
    ["JWT_ISSUER", "echo-stack-test"],
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
 * IMPORTANT: In strict mode, we primarily use defaultProvider (reads from .env)
 * The development/test providers are only fallbacks for demos and testing
 */
export const getConfigProvider = () => {
  const env = process.env.NODE_ENV || "development"

  switch (env) {
    case "production":
      return productionProvider // Pure environment variables - NO fallbacks
    case "test":
      return testProvider
    case "development":
    default:
      return defaultProvider // Prefer .env file over fallback values
  }
}

/**
 * Get development provider with fallbacks (for demos only)
 */
export const getDevelopmentProviderWithFallbacks = () => developmentProvider

/**
 * Get strict provider (environment variables only, no fallbacks)
 */
export const getStrictProvider = () => defaultProvider

/**
 * Create a custom config provider from a Map for testing
 */
export const createTestProvider = (overrides: Map<string, string>) =>
  ConfigProvider.fromMap(overrides).pipe(
    ConfigProvider.orElse(() => testProvider),
  )

/**
 * Utility to create a config provider with constant case conversion
 * Useful when environment variables use UPPER_CASE convention
 */
export const constantCaseProvider = defaultProvider.pipe(
  ConfigProvider.constantCase,
)

/**
 * Utility to create a nested config provider
 * Useful for grouping related configuration under a namespace
 */
export const createNestedProvider = (namespace: string) =>
  defaultProvider.pipe(ConfigProvider.nested(namespace))
