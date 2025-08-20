import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { SignInForm } from "~/components/auth/SignInForm"

const signInSearchSchema = z.object({
  redirect: z.string().optional(),
  message: z.string().optional(),
})

export const Route = createFileRoute("/sign-in")({
  validateSearch: signInSearchSchema,
  component: SignInPage,
})

function SignInPage() {
  const { redirect: redirectParam, message } = Route.useSearch()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <a
              href="/sign-up"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              create a new account
            </a>
          </p>
        </div>

        {message && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{message}</div>
          </div>
        )}

        <SignInForm redirectTo={redirectParam} />
      </div>
    </div>
  )
}
