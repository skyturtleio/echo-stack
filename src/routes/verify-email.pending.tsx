import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"
import { authClient } from "~/lib/auth.client"

export const Route = createFileRoute("/verify-email/pending")({
  validateSearch: z.object({
    email: z.string().email().optional(),
    sent: z.boolean().optional(),
  }),
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { email, sent } = Route.useSearch()
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const handleResendVerification = async () => {
    if (!email) return

    setIsResending(true)
    setResendMessage("")

    try {
      // Use BetterAuth's built-in sendVerificationEmail method
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard", // Redirect after verification
      })

      if (result.error) {
        setResendMessage(`❌ Failed to send email: ${result.error.message}`)
      } else {
        setResendMessage("✅ Verification email sent! Check your inbox.")
      }
    } catch (error) {
      console.error("Resend verification error:", error)
      setResendMessage("❌ Something went wrong. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">📧</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check Your Email
        </h1>

        {sent ? (
          <p className="text-gray-600 mb-6">
            We've sent a verification email to{" "}
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
        ) : (
          <p className="text-gray-600 mb-6">
            Please check your email and click the verification link to activate
            your account.
          </p>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Development Mode
            </h3>
            <p className="text-sm text-blue-800">
              Check the{" "}
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-blue-900"
              >
                Mailpit web UI at localhost:8025
              </a>{" "}
              to see your verification email.
            </p>
          </div>

          {email && (
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>

              {resendMessage && (
                <p
                  className={`text-sm ${
                    resendMessage.startsWith("✅")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {resendMessage}
                </p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Already verified?{" "}
              <a
                href="/sign-in"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
