import { createServerFileRoute } from "@tanstack/react-start/server"
import { Effect } from "effect"
import { eq } from "drizzle-orm"
import { DatabaseService } from "~/server/db/database-service"
import { verification, user } from "~/server/db/schema"
import { AppLayer } from "~/lib/app-services"

export const ServerRoute = createServerFileRoute("/api/verify-token").methods({
  POST: ({ request }) => {
    return Effect.gen(function* () {
      try {
        const body = yield* Effect.promise(() => request.json())
        const { token } = body

        if (!token) {
          return new Response(
            JSON.stringify({ success: false, message: "Missing token" }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        }

        if (token.length < 10) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid token format",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        }

        console.log("🔍 Verifying token:", token)

        // Get database service
        const dbService = yield* DatabaseService

        // 1. Look up verification token in database
        const verificationRecords = yield* Effect.tryPromise({
          try: () =>
            dbService.query
              .select()
              .from(verification)
              .where(eq(verification.value, token))
              .limit(1),
          catch: (error) => new Error(`Database lookup failed: ${error}`),
        })

        if (verificationRecords.length === 0) {
          console.log("❌ Token not found in database")
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid or expired verification token",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        }

        const tokenRecord = verificationRecords[0]
        if (!tokenRecord) {
          console.log("❌ Token record is undefined")
          return new Response(
            JSON.stringify({
              success: false,
              message: "Invalid verification token",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        }

        // 2. Check if token is expired
        const now = new Date()
        if (now > tokenRecord.expiresAt) {
          console.log("❌ Token expired")
          return new Response(
            JSON.stringify({
              success: false,
              message: "Verification token has expired",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        }

        // 3. Update user's emailVerified status
        const updateResult = yield* Effect.tryPromise({
          try: () =>
            dbService.query
              .update(user)
              .set({
                emailVerified: true,
                updatedAt: now,
              })
              .where(eq(user.email, tokenRecord.identifier))
              .returning({ id: user.id, email: user.email }),
          catch: (error) => new Error(`Failed to update user: ${error}`),
        })

        if (updateResult.length === 0) {
          console.log("❌ User not found for email:", tokenRecord.identifier)
          return new Response(
            JSON.stringify({
              success: false,
              message: "User not found",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          )
        }

        // 4. Delete the verification token (one-time use)
        yield* Effect.tryPromise({
          try: () =>
            dbService.query
              .delete(verification)
              .where(eq(verification.value, token)),
          catch: (error) => new Error(`Failed to delete token: ${error}`),
        })

        const updatedUser = updateResult[0]
        if (!updatedUser) {
          console.log("❌ Updated user is undefined")
          return new Response(
            JSON.stringify({
              success: false,
              message: "Failed to verify user",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          )
        }

        console.log("✅ Email verified successfully for:", updatedUser.email)

        return new Response(
          JSON.stringify({
            success: true,
            message: "Email verified successfully",
            user: updatedUser,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      } catch (error) {
        console.error("❌ Token verification error:", error)
        return new Response(
          JSON.stringify({
            success: false,
            message: "Internal server error",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        )
      }
    }).pipe(Effect.provide(AppLayer), Effect.runPromise)
  },
})
