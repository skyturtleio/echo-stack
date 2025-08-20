import { Effect, Config } from "effect"
import { readFileSync } from "fs"
import { join } from "path"

/**
 * Phoenix-inspired Database Naming Convention
 *
 * Automatically generates database names based on:
 * - Project name from package.json
 * - Environment (development, test, production)
 *
 * Examples:
 * - Development: echo_stack_dev
 * - Test: echo_stack_test
 * - Production: echo_stack
 */

/**
 * Extract project name from package.json and normalize it for database naming
 */
const getProjectName = (): string => {
  try {
    const packagePath = join(process.cwd(), "package.json")
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"))

    return packageJson.name
      .replace(/-/g, "_") // Convert hyphens to underscores
      .replace(/[^a-z0-9_]/gi, "") // Remove any other special characters
      .toLowerCase() // Ensure lowercase
  } catch {
    // Fallback if package.json can't be read
    return "echo_stack"
  }
}

/**
 * Generate database name following Phoenix conventions
 */
export const getDatabaseName = Effect.gen(function* () {
  const environment = yield* Config.withDefault(
    Config.literal("development", "production", "test")("NODE_ENV"),
    "development" as const,
  )

  const projectName = getProjectName()

  // Phoenix convention: append environment except for production
  switch (environment) {
    case "production":
      return projectName
    case "development":
      return `${projectName}_dev`
    case "test":
      return `${projectName}_test`
    default:
      return `${projectName}_dev`
  }
})

/**
 * Parse a base database URL and construct the full URL with auto-generated database name
 */
export const buildDatabaseUrl = Effect.gen(function* () {
  // Get base database URL (should end with / or not include database name)
  const baseDatabaseUrl = yield* Config.string("DATABASE_BASE_URL")
  const databaseName = yield* getDatabaseName

  // Ensure base URL ends with /
  const baseUrl = baseDatabaseUrl.endsWith("/")
    ? baseDatabaseUrl
    : `${baseDatabaseUrl}/`

  return `${baseUrl}${databaseName}`
})

/**
 * Get database connection info for admin operations
 */
export const getDatabaseInfo = Effect.gen(function* () {
  const baseDatabaseUrl = yield* Config.string("DATABASE_BASE_URL")
  const databaseName = yield* getDatabaseName

  // Parse the base URL to get connection details
  const url = new URL(
    baseDatabaseUrl.endsWith("/") ? baseDatabaseUrl : `${baseDatabaseUrl}/`,
  )

  // Admin connection (to postgres database for creating/dropping)
  const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`

  // Full database URL
  const fullUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/${databaseName}`

  return {
    databaseName,
    adminUrl,
    fullUrl,
    host: url.hostname,
    port: url.port || "5432",
    username: url.username,
    password: url.password,
  }
})

/**
 * Validate that DATABASE_BASE_URL is properly formatted
 */
export const validateDatabaseBaseUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)

    // Must be PostgreSQL
    if (
      !parsed.protocol.startsWith("postgresql") &&
      !parsed.protocol.startsWith("postgres")
    ) {
      return false
    }

    // Must have host
    if (!parsed.hostname) {
      return false
    }

    // Should not include a database name in the path (or should be empty)
    const path = parsed.pathname
    return path === "/" || path === "" || path === "/postgres"
  } catch {
    return false
  }
}

/**
 * Enhanced database configuration with auto-naming
 * Supports both DATABASE_BASE_URL (Phoenix-style) and DATABASE_URL (legacy)
 */
export const AutoDatabaseConfig = Effect.gen(function* () {
  // Try DATABASE_BASE_URL first (Phoenix-style), fall back to DATABASE_URL (legacy)
  const databaseConfig = yield* Effect.orElse(
    // Phoenix-style: use base URL + auto-generated name
    Effect.gen(function* () {
      const baseDatabaseUrl = yield* Config.string("DATABASE_BASE_URL").pipe(
        Config.validate({
          message:
            "DATABASE_BASE_URL must be a valid PostgreSQL connection string without database name",
          validation: validateDatabaseBaseUrl,
        }),
      )

      const databaseName = yield* getDatabaseName
      const databaseInfo = yield* getDatabaseInfo

      return {
        type: "auto" as const,
        baseUrl: baseDatabaseUrl,
        name: databaseName,
        url: databaseInfo.fullUrl,
        adminUrl: databaseInfo.adminUrl,
        info: databaseInfo,
      }
    }),
    // Legacy: use full DATABASE_URL as-is
    () =>
      Effect.gen(function* () {
        const fullDatabaseUrl = yield* Config.string("DATABASE_URL")

        // Parse the URL to extract components
        const url = new URL(fullDatabaseUrl)
        const databaseName = url.pathname.slice(1) // Remove leading slash
        const adminUrl = `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`

        return {
          type: "legacy" as const,
          baseUrl: `${url.protocol}//${url.username}:${url.password}@${url.host}/`,
          name: databaseName,
          url: fullDatabaseUrl,
          adminUrl: adminUrl,
          info: {
            databaseName,
            adminUrl,
            fullUrl: fullDatabaseUrl,
            host: url.hostname,
            port: url.port || "5432",
            username: url.username,
            password: url.password,
          },
        }
      }),
  )

  return databaseConfig
})

/**
 * Utility to get all database URLs for different environments
 */
export const getAllDatabaseNames = (): Record<string, string> => {
  const projectName = getProjectName()

  return {
    development: `${projectName}_dev`,
    test: `${projectName}_test`,
    production: projectName,
  }
}
