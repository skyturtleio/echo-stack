import { createServerFileRoute } from "@tanstack/react-start/server"
import { Effect } from "effect"
import { DatabaseService } from "~/server/db/database-service"
import { verification } from "~/server/db/schema"
import { sendVerificationEmail } from "~/lib/email.server"
import { AppLayer } from "~/lib/app-services"
import { randomBytes } from "crypto"

export const ServerRoute = createServerFileRoute(
  "/api/send-verification",
).methods({
  POST: ({ request }) => {
    return Effect.gen(function* () {
      try {
        const body = yield* Effect.promise(() => request.json())
        const { email, name } = body

        if (!email || !name) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Missing required fields",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        }

        console.log("📧 Creating verification token for:", email)

        // Get database service
        const dbService = yield* DatabaseService

        // Generate secure verification token
        const token = randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        const verificationUrl = `${new URL(request.url).origin}/verify-email/${token}`

        // Store verification token in database
        yield* Effect.tryPromise({
          try: () =>
            dbService.query.insert(verification).values({
              id: randomBytes(16).toString("hex"),
              identifier: email, // User's email
              value: token, // The verification token
              expiresAt: expiresAt,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          catch: (error) =>
            new Error(`Failed to store verification token: ${error}`),
        })

        console.log("💾 Verification token stored in database")

        // Send verification email
        yield* Effect.tryPromise({
          try: () =>
            sendVerificationEmail({
              to: email,
              name,
              verificationUrl,
            }),
          catch: (error) => new Error(`Failed to send email: ${error}`),
        })

        console.log("✅ Verification email sent successfully to:", email)

        return new Response(
          JSON.stringify({
            success: true,
            message: "Verification email sent successfully",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      } catch (error) {
        console.error("❌ Send verification email error:", error)
        return new Response(
          JSON.stringify({
            success: false,
            message: "Failed to send verification email",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        )
      }
    }).pipe(Effect.provide(AppLayer), Effect.runPromise)
  },
})
