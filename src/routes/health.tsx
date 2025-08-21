import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Effect } from "effect"
import { AppLayer } from "../lib/app-services"
import { ConfigService } from "../lib/config-service"
import { checkDatabaseHealth } from "../server/db/database-service"

interface DetailedDatabaseHealth {
  healthy: boolean
  message: string
  latencyMs: number
  connectionCount: number
  timestamp: string
}

interface HealthStatus {
  status: string
  timestamp: string
  environment: string
  database: DetailedDatabaseHealth
  server?: {
    host: string
    port: number
  }
  error?: string
}

/**
 * Enhanced Health Check Route with Real Database Monitoring
 *
 * This route provides comprehensive health monitoring using our new
 * Effect-based services with proper resource management.
 */

const getHealthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const healthCheck = Effect.gen(function* () {
    // Get configuration
    const configService = yield* ConfigService
    const config = yield* configService.getConfig()

    // Check database health
    const dbHealth = yield* checkDatabaseHealth

    return {
      status: dbHealth.healthy ? "ok" : "error",
      timestamp: new Date().toISOString(),
      environment: config.environment,
      database: {
        healthy: dbHealth.healthy,
        message: dbHealth.message,
        latencyMs: dbHealth.latencyMs,
        connectionCount: dbHealth.connectionCount,
        timestamp: dbHealth.timestamp.toISOString(),
      },
      server: {
        host: config.server.host,
        port: config.server.port,
      },
    }
  })

  try {
    return await Effect.runPromise(healthCheck.pipe(Effect.provide(AppLayer)))
  } catch (error) {
    // Fallback health status if services are not available
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        healthy: false,
        message: `Health check failed: ${error}`,
      },
      error: String(error),
    }
  }
})

export const Route = createFileRoute("/health")({
  loader: () => getHealthStatus(),
  component: HealthCheck,
})

function HealthCheck() {
  const health = Route.useLoaderData() as HealthStatus

  const isHealthy = health.status === "ok"
  const hasError = "error" in health
  const hasDetailedDb = "latencyMs" in health.database

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Enhanced Health Check</h1>

      <div className="space-y-4">
        {/* Overall Status */}
        <div
          className={`border rounded-lg p-4 ${
            isHealthy
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center">
            <span className="text-2xl mr-2">{isHealthy ? "✅" : "❌"}</span>
            <div>
              <h2
                className={`font-semibold ${
                  isHealthy ? "text-green-800" : "text-red-800"
                }`}
              >
                Application Status
              </h2>
              <p className={isHealthy ? "text-green-600" : "text-red-600"}>
                Running in {health.environment} mode
              </p>
              {!hasError && "server" in health && (
                <p className="text-sm text-gray-600 mt-1">
                  Server: {health.server?.host}:{health.server?.port}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div
          className={`border rounded-lg p-4 ${
            health.database.healthy
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center">
            <span className="text-2xl mr-2">
              {health.database.healthy ? "✅" : "❌"}
            </span>
            <div className="flex-1">
              <h2
                className={`font-semibold ${
                  health.database.healthy ? "text-green-800" : "text-red-800"
                }`}
              >
                Database Connection
              </h2>
              <p
                className={
                  health.database.healthy ? "text-green-600" : "text-red-600"
                }
              >
                {health.database.message}
              </p>
              {health.database.healthy && hasDetailedDb && (
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p>• Query Latency: {health.database.latencyMs}ms</p>
                  <p>• Active Connections: {health.database.connectionCount}</p>
                  <p>
                    • Last Check:{" "}
                    {new Date(health.database.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Details */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
            <p className="text-red-600 text-sm font-mono bg-red-100 p-2 rounded">
              {health.error}
            </p>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-sm text-gray-500">
          Health check performed at:{" "}
          {new Date(health.timestamp).toLocaleString()}
        </div>

        {/* Development Info */}
        {health.environment === "development" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">
              Development Tools
            </h3>
            <ul className="text-blue-600 space-y-1">
              <li>• Enhanced Database Service: ✅ Active</li>
              <li>• Resource Management: ✅ Effect.acquireRelease</li>
              <li>
                • Database Test: <code>bun run db:test:new</code>
              </li>
              <li>
                • Demo Services: <code>bun run demo:resources</code>
              </li>
              <li>
                • Drizzle Studio: <code>bun run db:studio</code>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
