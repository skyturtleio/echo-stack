/**
 * BetterAuth Client Integration
 *
 * Real authentication client using BetterAuth for:
 * - Email/password authentication
 * - Session management
 * - React hooks for state management
 */

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3001",
})

// Export BetterAuth methods directly
export const { signUp, signIn, signOut, useSession } = authClient

// Re-export types from BetterAuth
export type Session = typeof authClient.$Infer.Session
export type User = Session["user"]
