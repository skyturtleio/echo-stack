import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { signOut, useSession } from "~/lib/auth.client"
import { PageErrorBoundary } from "~/components/ErrorBoundary"
import { Link, useNavigate } from "@tanstack/react-router"
import { Effect } from "effect"

/**
 * Echo Stack Admin Dashboard
 *
 * Unified admin interface showing user info, real system status,
 * and configuration details.
 */

interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy"
  database: { status: "up" | "down"; responseTime?: number }
  config: { status: "up" | "down"; environment: string }
  uptime: number
}

interface ConfigData {
  environment: string
  server: { host: string; port: number }
  database: { url: string; type?: string; name?: string }
  auth: { url: string; secretLength: number }
  email: {
    smtp: { host: string; port: number }
    resend: { fromEmail: string }
  }
}

const getSystemData = createServerFn().handler(async () => {
  // Import services dynamically inside server function
  const { ConfigService } = await import("../lib/config-service")
  const { checkDatabaseHealth } = await import("../server/db/database-service")
  const { AppLayer } = await import("../lib/app-services")

  try {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const configService = yield* ConfigService
        const config = yield* configService.getConfig()
        const dbHealth = yield* checkDatabaseHealth()

        const systemHealth: SystemHealth = {
          overall: dbHealth.healthy ? "healthy" : "unhealthy",
          database: {
            status: dbHealth.healthy ? "up" : "down",
            responseTime: dbHealth.latencyMs,
          },
          config: {
            status: "up",
            environment: config.environment,
          },
          uptime: process.uptime(),
        }

        const safeConfig: ConfigData = {
          environment: config.environment,
          server: config.server,
          database: {
            url: config.database.url.substring(0, 50) + "...",
            type: config.database.type,
            name: config.database.name,
          },
          auth: {
            url: config.auth.url,
            secretLength: config.auth.secret.length,
          },
          email: {
            smtp: {
              host: config.email.smtp.host,
              port: config.email.smtp.port,
            },
            resend: {
              fromEmail: config.email.resend.fromEmail,
            },
          },
        }

        return {
          systemHealth,
          safeConfig,
        }
      }).pipe(Effect.provide(AppLayer)),
    )

    return result
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "System data unavailable",
    }
  }
})

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <PageErrorBoundary>
      <DashboardPage />
    </PageErrorBoundary>
  ),
  loader: () => getSystemData(),
})

function DashboardPage() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const loaderData = Route.useLoaderData()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: "/sign-in" })
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            Please sign in to access the dashboard.
          </p>
          <Link
            to="/sign-in"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if ("error" in loaderData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">
                  Echo Stack Admin Dashboard ✈️
                </h1>
              </div>
              <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <strong>System Error:</strong> {loaderData.error}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { systemHealth, safeConfig } = loaderData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                  Echo Stack Admin Dashboard ✈️
                </h1>
                <div className="text-sm text-gray-500">
                  Environment: {safeConfig.environment}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* User Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  User Information
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">
                        Name
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {session.user.name}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">
                        Email
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {session.user.email}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">
                        {session.user.id}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* System Health */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  System Health
                </h2>
                <div
                  className={`rounded-lg p-4 ${
                    systemHealth.overall === "healthy"
                      ? "bg-green-50"
                      : systemHealth.overall === "degraded"
                        ? "bg-yellow-50"
                        : "bg-red-50"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {systemHealth.overall === "healthy" ? (
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : systemHealth.overall === "degraded" ? (
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-red-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <h3
                        className={`text-sm font-medium ${
                          systemHealth.overall === "healthy"
                            ? "text-green-800"
                            : systemHealth.overall === "degraded"
                              ? "text-yellow-800"
                              : "text-red-800"
                        }`}
                      >
                        {systemHealth.overall === "healthy"
                          ? "All Systems Operational"
                          : systemHealth.overall === "degraded"
                            ? "System Degraded"
                            : "System Unhealthy"}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Database:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                systemHealth.database.status === "up"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {systemHealth.database.status}
                            </span>
                            {systemHealth.database.responseTime && (
                              <span className="text-xs text-gray-500">
                                {systemHealth.database.responseTime}ms
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Configuration:
                          </span>
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            {systemHealth.config.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Authentication:
                          </span>
                          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            active
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Uptime:</span>
                          <span className="text-xs text-gray-500">
                            {Math.floor(systemHealth.uptime / 60)}m{" "}
                            {Math.floor(systemHealth.uptime % 60)}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Details */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Server Config */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Server</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Host:</span>
                        <span className="font-mono">
                          {safeConfig.server.host}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Port:</span>
                        <span className="font-mono">
                          {safeConfig.server.port}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Database Config */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Database</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                          {safeConfig.database.type || "auto"}
                        </span>
                      </div>
                      {safeConfig.database.name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-mono">
                            {safeConfig.database.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Auth Config */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Authentication
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Secret Length:</span>
                        <span className="text-green-600 font-medium">
                          {safeConfig.auth.secretLength} chars ✓
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Email Config */}
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Email</h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-xs text-blue-600">
                        <strong>Dev (SMTP):</strong>{" "}
                        {safeConfig.email.smtp.host}:
                        {safeConfig.email.smtp.port}
                      </div>
                      <div className="text-xs text-green-600">
                        <strong>Prod (Resend):</strong>{" "}
                        {safeConfig.email.resend.fromEmail}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
