import { Link, useRouterState } from "@tanstack/react-router"
import { useSession, signOut } from "~/lib/auth.client"

export default function Header() {
  const { data: session } = useSession()
  const routerState = useRouterState()
  const isAuthPage = routerState.location.pathname.includes("/sign-")

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/sign-in"
  }

  if (isAuthPage) {
    return null // Don't show header on auth pages
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Hey Babe
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            {session?.user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/effect-config"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Config
                </Link>
                <span className="text-gray-500 text-sm">
                  {session.user.name}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
