import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { Effect, Redacted } from "effect"
import {
  getDevelopmentProviderWithFallbacks,
  isDevelopment,
  loadConfig,
} from "../lib/effect-config"

// Server function to load config - always runs server-side
const getConfigData = createServerFn().handler(async () => {
  // Use demo config validation that allows fallbacks for this demo page
  const configProgram = Effect.gen(function* () {
    const config = yield* loadConfig
    const isDev = yield* isDevelopment

    // Create safe config by extracting only non-sensitive values
    const safeConfig = {
      environment: config.environment,
      server: config.server,
      database: { url: config.database.url.substring(0, 50) + "..." },
      auth: {
        url: config.auth.url,
        secretLength: Redacted.value(config.auth.secret).length,
      },
      triplit: {
        databaseUrl: config.triplit.databaseUrl,
        corsOrigin: config.triplit.corsOrigin,
      },
      email: {
        smtp: {
          host: config.email.smtp.host,
          port: config.email.smtp.port,
          user: config.email.smtp.user,
        },
        resend: {
          fromEmail: config.email.resend.fromEmail,
        },
      },
    }

    return { safeConfig, isDev }
  })

  try {
    // Use development provider with fallbacks for demo purposes
    const provider = getDevelopmentProviderWithFallbacks()
    return await Effect.runPromise(
      Effect.withConfigProvider(configProgram, provider),
    )
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unknown configuration error",
    }
  }
})

export const Route = createFileRoute("/effect-config")({
  component: EffectConfigComponent,
  loader: () => getConfigData(),
})

function EffectConfigComponent() {
  const loaderData = Route.useLoaderData()

  if ("error" in loaderData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            Hey Babe - Effect Config Demo
          </h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Configuration Error:</strong>
            <div className="mt-2 text-sm font-mono break-words">
              {loaderData.error}
            </div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h2 className="font-semibold mb-3 text-gray-900">Common fixes:</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Check that your .env file exists and has all required
                  variables
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Ensure BETTER_AUTH_SECRET is at least 32 characters long
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Verify DATABASE_URL format:
                  postgresql://user:pass@host:port/dbname
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const config = loaderData.safeConfig

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          Hey Babe - Effect Config Demo
        </h1>

        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 text-sm">
          ✅ Configuration loaded successfully!
        </div>

        <div className="space-y-4">
          {/* Environment Info */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Environment</h2>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Mode:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  config.environment === "production"
                    ? "bg-red-100 text-red-800"
                    : config.environment === "development"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {config.environment}
              </span>
            </div>
          </div>

          {/* Server Config */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Server</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Host:</span>
                <span className="font-mono">{config.server.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Port:</span>
                <span className="font-mono">{config.server.port}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">URL:</span>
                  <span className="font-mono text-blue-600 break-all">
                    http://{config.server.host}:{config.server.port}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Config */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Database</h2>
            <div className="text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-gray-600">Database URL:</span>
                <span className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {config.database.url}
                </span>
              </div>
            </div>
          </div>

          {/* Auth Config */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Authentication</h2>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-gray-600">Auth URL:</span>
                <span className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {config.auth.url}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Secret Length:</span>
                <span className="text-green-600 font-medium">
                  {config.auth.secretLength} chars ✓
                </span>
              </div>
            </div>
          </div>

          {/* Triplit Config */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Triplit</h2>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-gray-600">Database Path:</span>
                <span className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {config.triplit.databaseUrl}
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-600">CORS Origin:</span>
                <span className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                  {config.triplit.corsOrigin}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">JWT Secret:</span>
                <span className="text-gray-500 text-xs">&lt;redacted&gt;</span>
              </div>
            </div>
          </div>

          {/* Email Config */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Email</h2>
            <div className="space-y-3">
              <div className="bg-blue-50 rounded p-3">
                <h3 className="font-medium text-blue-900 text-sm mb-2">
                  Development (SMTP/Mailpit)
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Host:</span>
                    <span className="font-mono">{config.email.smtp.host}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Port:</span>
                    <span className="font-mono">{config.email.smtp.port}</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded p-3">
                <h3 className="font-medium text-green-900 text-sm mb-2">
                  Production (Resend)
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-700">From Email:</span>
                    <span className="font-mono">
                      {config.email.resend.fromEmail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">API Key:</span>
                    <span className="text-gray-500">&lt;redacted&gt;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3 text-blue-900">
              Next Steps
            </h2>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Copy{" "}
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                    .env.example
                  </code>{" "}
                  to{" "}
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                    .env
                  </code>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Update environment variables with your actual values
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Run{" "}
                  <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                    bun run src/config-demo.ts
                  </code>{" "}
                  to test
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Use config system in your TanStack Start routes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
