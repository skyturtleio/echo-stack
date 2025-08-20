import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { Dashboard } from "~/components/dashboard/Dashboard"

/**
 * Dashboard Route with Timeline Search Params
 *
 * URL examples:
 * /dashboard
 * /dashboard?view=today&filter=shared
 * /dashboard?view=week&filter=all&date=2024-01-15
 */

const dashboardSearchSchema = z.object({
  view: z.enum(["today", "week", "someday"]).optional().default("today"),
  filter: z.enum(["all", "shared", "private"]).optional().default("all"),
  date: z.string().datetime().optional(),
})

export const Route = createFileRoute("/dashboard")({
  validateSearch: dashboardSearchSchema,
  component: DashboardPage,
})

function DashboardPage() {
  const search = Route.useSearch()

  // Mock data for Phase 3 demonstration
  const mockUser = {
    id: "demo-user-123",
    name: "Demo User",
    email: "demo@example.com",
  }

  const selectedDate = search.date ? new Date(search.date) : new Date()
  const timeline = {
    view: search.view,
    filter: search.filter,
    selectedDate: selectedDate.toISOString(),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg">
            <Dashboard
              user={mockUser}
              jwt="demo-jwt-token"
              timeline={timeline}
              search={search}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
