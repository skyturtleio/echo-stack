import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

export const Route = createFileRoute("/verify-success")({
  component: VerifySuccessPage,
})

function VerifySuccessPage() {
  useEffect(() => {
    // Redirect to dashboard after a brief delay
    const timer = setTimeout(() => {
      window.location.href = "/dashboard"
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✅</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Email Verified!
        </h1>

        <p className="text-gray-600 mb-6">
          Your email has been successfully verified. Welcome to Echo Stack!
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            🎉 You're all set! Redirecting to your dashboard in a few seconds...
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="/dashboard"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Dashboard
          </a>

          <a
            href="/sign-in"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
