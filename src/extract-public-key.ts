/**
 * Extract Public Key for Triplit Server using Effect Services
 *
 * This script extracts the public key from BetterAuth JWKS
 * for use in Triplit server configuration.
 */

import { Effect } from "effect"
import { AuthService } from "./lib/auth-service"
import { AppLayer } from "./lib/app-services"

const extractPublicKeyForTriplit = Effect.gen(function* () {
  console.log("🔑 Extracting Public Key for Triplit Server...")

  // Get auth service instance
  const authService = yield* AuthService

  console.log("✅ Effect AuthService initialized")
  console.log("   Note: BetterAuth generates JWKS keys automatically")
  console.log("   Keys are created on first JWT operation")

  // Test JWT generation to ensure keys exist
  console.log("\n🔧 Testing JWT generation to initialize keys...")

  const testJwt = yield* authService.signJWT({
    sub: "test-key-extraction",
    userId: "test-user",
    email: "test@example.com",
  })

  console.log("✅ Test JWT generated successfully")
  console.log(`   JWT preview: ${testJwt.slice(0, 50)}...`)

  console.log("\n📋 To get JWKS for Triplit configuration:")
  console.log("   1. Start your application server")
  console.log("   2. Visit: http://localhost:3000/api/auth/jwks")
  console.log("   3. Copy the JSON response")
  console.log("   4. Add to external services .env as needed")

  console.log("\n🔧 Environment Variable Setup:")
  console.log("   JWT_SECRET='<your-jwt-secret-here>'")
  console.log("   JWT_ISSUER='echo-stack-app'")

  console.log("\n✨ Public Key Extraction Information Complete!")
  console.log("\n📝 Next Steps:")
  console.log("   1. Start app server: bun run dev")
  console.log("   2. Fetch JWKS from /api/auth/jwks endpoint")
  console.log("   3. Configure Triplit server with JWKS")
  console.log("   4. Test JWT validation between services")
})

// Run the extraction with proper error handling
const program = extractPublicKeyForTriplit.pipe(
  Effect.provide(AppLayer),
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      console.error("❌ Public key extraction failed:")
      console.error(error)
      yield* Effect.fail(new Error("Key extraction failed"))
    }),
  ),
)

Effect.runPromise(program).catch(() => process.exit(1))
