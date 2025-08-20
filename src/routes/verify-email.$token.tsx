import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

export const Route = createFileRoute("/verify-email/$token")({
  component: VerifyEmailTokenPage,
})

function VerifyEmailTokenPage() {
  const { token } = Route.useParams()
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  )
  const [message, setMessage] = useState("")

  // Debug logging
  console.log("🔍 VerifyEmailTokenPage loaded with token:", token)

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) return

      try {
        setStatus("verifying")

        // Handle our custom verification tokens
        const response = await fetch("/api/verify-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        const result = await response.json()

        if (response.ok && result.success) {
          setStatus("success")
          setMessage("Email verified successfully!")

          // Redirect to sign-in after a brief delay
          setTimeout(() => {
            window.location.href = "/sign-in?verified=true"
          }, 2000)
        } else {
          setStatus("error")
          setMessage(result.message || "Invalid or expired verification link.")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Something went wrong. Please try again.")
        console.error("Verification error:", error)
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token])

  const getIcon = () => {
    switch (status) {
      case "verifying":
        return "⏳"
      case "success":
        return "✅"
      case "error":
        return "❌"
    }
  }

  const getTitle = () => {
    switch (status) {
      case "verifying":
        return "Verifying Email..."
      case "success":
        return "Email Verified!"
      case "error":
        return "Verification Failed"
    }
  }

  const getDescription = () => {
    switch (status) {
      case "verifying":
        return "Please wait while we verify your email address."
      case "success":
        return "Your email has been verified successfully. Redirecting to sign in..."
      case "error":
        return message
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">{getIcon()}</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{getTitle()}</h1>

        <p className="text-gray-600 mb-6">{getDescription()}</p>

        {status === "verifying" && (
          <div className="animate-pulse space-y-2">
            <div className="h-2 bg-blue-200 rounded w-3/4 mx-auto"></div>
            <div className="h-2 bg-blue-200 rounded w-1/2 mx-auto"></div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                🎉 Welcome to Hey Babe! You can now sign in to start managing
                your todos together.
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{message}</p>
            </div>

            <div className="space-y-2">
              <a
                href="/sign-up"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Signing Up Again
              </a>
              <a
                href="/sign-in"
                className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Back to Sign In
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
