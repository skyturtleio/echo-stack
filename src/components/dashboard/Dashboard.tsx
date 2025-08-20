import { useRouter } from "@tanstack/react-router"
import { signOut } from "~/lib/auth.client"

interface User {
  id: string
  name: string
  email: string
}

interface DashboardProps {
  user: User
  jwt: string | null
  timeline: {
    view: string
    filter: string
    selectedDate: string
  }
  search: {
    view?: "today" | "week" | "someday"
    filter?: "all" | "shared" | "private"
    date?: string
  }
}

export function Dashboard({ user, jwt, timeline, search }: DashboardProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.navigate({ to: "/sign-in" })
  }

  const updateTimeline = (updates: {
    view?: "today" | "week" | "someday"
    filter?: "all" | "shared" | "private"
    date?: string
  }) => {
    router.navigate({
      to: "/dashboard",
      search: { ...search, ...updates },
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hey Babe Dashboard
          </h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign out
        </button>
      </div>

      {/* Timeline Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Timeline View</h2>
        </div>
        <div className="p-6">
          <div className="flex space-x-4">
            {/* View Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View
              </label>
              <select
                value={timeline.view}
                onChange={(e) =>
                  updateTimeline({
                    view: e.target.value as "today" | "week" | "someday",
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="someday">Someday</option>
              </select>
            </div>

            {/* Filter Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter
              </label>
              <select
                value={timeline.filter}
                onChange={(e) =>
                  updateTimeline({
                    filter: e.target.value as "all" | "shared" | "private",
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">All Todos</option>
                <option value="shared">Shared</option>
                <option value="private">Private</option>
              </select>
            </div>

            {/* Date Picker (if applicable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={timeline.selectedDate.split("T")[0]}
                onChange={(e) =>
                  updateTimeline({
                    date: new Date(e.target.value).toISOString(),
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Current State Display */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current State</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                User Info
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Name:</strong> {user.name}
                </p>
                <p>
                  <strong>JWT Available:</strong> {jwt ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Timeline State
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>View:</strong> {timeline.view}
                </p>
                <p>
                  <strong>Filter:</strong> {timeline.filter}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(timeline.selectedDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>URL State:</strong> Synced ✅
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <p className="text-sm text-green-700">
              🎉 <strong>Phase 3 Complete!</strong> TanStack Router integration
              is working:
            </p>
            <ul className="mt-2 text-sm text-green-600 list-disc list-inside space-y-1">
              <li>Protected routes with authentication</li>
              <li>Search params state management for timeline views</li>
              <li>JWT passed from server to client for Triplit integration</li>
              <li>Type-safe routing with validation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
