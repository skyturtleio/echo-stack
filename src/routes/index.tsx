import { createFileRoute } from "@tanstack/react-router"
import { signOut, useSession } from "~/lib/auth.client"
import { PROJECT_CONFIG } from "~/lib/project-config"
import { Link, useNavigate } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const { data: session } = useSession()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate({ to: "/" })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            {PROJECT_CONFIG.name} {PROJECT_CONFIG.emoji}
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            {PROJECT_CONFIG.description}
          </p>
          <div className="mt-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div className="text-center">
                <div className="font-medium text-gray-900">Effect.ts</div>
                <div>Service Management</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">TanStack Start</div>
                <div>Full-Stack React</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">BetterAuth</div>
                <div>Authentication</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">Drizzle ORM</div>
                <div>Type-Safe Database</div>
              </div>
            </div>
          </div>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            {session?.user ? (
              <div className="rounded-md shadow">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 md:py-4 md:text-lg md:px-10"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-md shadow">
                  <Link
                    to="/sign-up"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get started
                  </Link>
                </div>
                <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                  <Link
                    to="/sign-in"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
