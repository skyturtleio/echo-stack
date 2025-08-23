/**
 * Health Check API Endpoint - Echo Stack
 *
 * Provides standardized health check responses for monitoring and load balancers.
 * Uses structured validation and error handling patterns.
 */

import { createServerFileRoute } from "@tanstack/react-start/server"
import { Effect } from "effect"
import { createApiSuccess, createApiError } from "../../lib/errors"

interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  services: {
    database: {
      status: "up" | "down" | "degraded"
      responseTime?: number
      details?: Record<string, unknown>
    }
    config: {
      status: "up" | "down" | "degraded"
      details?: Record<string, unknown>
    }
  }
  version?: string
  uptime?: number
}

const startTime = Date.now()

/**
 * GET /api/health - Comprehensive health check
 */
async function healthCheck(): Promise<Response> {
  // Import services dynamically inside function
  const { ConfigService } = await import("../../lib/config-service")
  const { checkDatabaseHealth } = await import(
    "../../server/db/database-service"
  )
  const { AppLayer } = await import("../../lib/app-services")

  const healthCheckEffect = Effect.gen(function* () {
    // Get configuration service
    const configService = yield* ConfigService
    const config = yield* configService.getConfig()

    // Check database health
    const dbHealth = yield* checkDatabaseHealth()

    // Calculate uptime
    const uptime = (Date.now() - startTime) / 1000

    // Determine overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy"

    if (!dbHealth.healthy) {
      overallStatus = "unhealthy"
    }

    const healthData: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.healthy ? "up" : "down",
          responseTime: dbHealth.latencyMs,
          details: {
            connectionCount: dbHealth.connectionCount,
            message: dbHealth.message,
            timestamp: dbHealth.timestamp.toISOString(),
          },
        },
        config: {
          status: "up",
          details: {
            environment: config.environment,
            server: `${config.server.host}:${config.server.port}`,
          },
        },
      },
      version: process.env.npm_package_version || "unknown",
      uptime,
    }

    return createApiSuccess(healthData)
  })

  try {
    const result = await Effect.runPromise(
      healthCheckEffect.pipe(Effect.provide(AppLayer)),
    )

    // Return appropriate HTTP status based on health
    const statusCode =
      result.data?.status === "healthy"
        ? 200
        : result.data?.status === "degraded"
          ? 200
          : 503

    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    // Return error response
    const errorResponse = createApiError(
      "Health check failed",
      "HEALTH_CHECK_ERROR",
      { cause: String(error) },
    )

    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  }
}

export const ServerRoute = createServerFileRoute("/api/health").methods({
  GET: () => healthCheck(),
})
