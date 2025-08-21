import { createFileRoute } from "@tanstack/react-router"
import { useSession, signOut } from "~/lib/auth.client"
import { PageErrorBoundary } from "~/components/ErrorBoundary"

/**
 * Echo Stack Dashboard
 *
 * A simple authenticated dashboard showing user information
 * and system status - ready for customization.
 */

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <PageErrorBoundary>
      <DashboardPage />
    </PageErrorBoundary>
  ),
})

function DashboardPage() {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/sign-in"
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
          <a
            href="/sign-in"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">
                Echo Stack Dashboard ✈️
              </h1>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    User Information
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Name
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {session.user.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Email
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {session.user.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          ID
                        </dt>
                        <dd className="text-sm text-gray-900">
                          {session.user.id}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    System Status
                  </h2>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
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
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          All Systems Operational
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <ul className="space-y-1">
                            <li>✅ Authentication: Active</li>
                            <li>✅ Database: Connected</li>
                            <li>✅ Email: Configured</li>
                            <li>✅ Effect Services: Running</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  🛩️ Ready for Takeoff!
                </h3>
                <p className="text-blue-700 mb-4">
                  Your Echo Stack application is ready. This dashboard is a
                  starting point - customize it for your specific needs.
                </p>
                <div className="space-y-2 text-sm text-blue-600">
                  <p>
                    • <strong>Effect.ts services</strong> - Configuration, Auth,
                    Database, Email
                  </p>
                  <p>
                    • <strong>TanStack Start</strong> - Full-stack React with
                    SSR
                  </p>
                  <p>
                    • <strong>BetterAuth</strong> - Production-ready
                    authentication
                  </p>
                  <p>
                    • <strong>Drizzle ORM</strong> - Type-safe database
                    operations
                  </p>
                  <p>
                    • <strong>TypeScript strict mode</strong> - End-to-end type
                    safety
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
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
