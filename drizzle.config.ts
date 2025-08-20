import { defineConfig } from "drizzle-kit"
import { Effect, ConfigProvider, Config } from "effect"
import { ValidatedDatabaseConfig } from "./src/lib/config-validation"

/**
 * Drizzle Kit Configuration with Effect Config Integration
 *
 * This configuration ensures consistency by using the same Effect Config
 * validation logic that the application uses at runtime. This means:
 *
 * 1. Database URL validation is consistent across CLI tools and app
 * 2. Same environment variable parsing and error handling
 * 3. Same fallback behavior if configuration fails
 * 4. Type-safe configuration loading with proper error messages
 *
 * The Drizzle CLI tools (generate, migrate, push, studio) will now
 * use the same validation as the rest of the application.
 */

// Load configuration using Effect Config
const loadConfig = Effect.gen(function* () {
  const databaseUrl = yield* ValidatedDatabaseConfig
  const environment = yield* Config.literal(
    "development",
    "production",
    "test",
  )("NODE_ENV")

  return {
    databaseUrl,
    environment,
  }
})

// Create a sync version for the Drizzle config
// This ensures we use the same validation logic as the rest of the app
const getConfig = (): { databaseUrl: string; environment: string } => {
  try {
    // Use Effect Config to load and validate configuration
    const program = loadConfig.pipe(
      Effect.withConfigProvider(ConfigProvider.fromEnv()),
    )

    // Run synchronously - this is safe for config loading
    const config = Effect.runSync(program)
    console.log("✅ Drizzle config loaded using Effect Config validation")
    return config
  } catch (error) {
    console.error("❌ Failed to load database configuration:")
    console.error(`   ${error}`)
    console.error("   Falling back to default development settings")

    // Fallback to development settings if config fails
    return {
      databaseUrl: "postgresql://leo:@localhost:5432/hey_babe_triplit_dev",
      environment: "development",
    }
  }
}

const config = getConfig()

export default defineConfig({
  // Database connection
  dialect: "postgresql",
  dbCredentials: {
    url: config.databaseUrl,
  },

  // Schema definition
  schema: "./src/server/db/schema.ts",

  // Migration settings
  out: "./src/server/db/migrations",

  // Drizzle Studio and introspection
  introspect: {
    casing: "camel",
  },

  // Migration configuration
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations",
    schema: "public",
  },

  // Development settings - now using Effect Config
  verbose: config.environment === "development",
  strict: config.environment === "production",
})
