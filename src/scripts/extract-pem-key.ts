#!/usr/bin/env bun
/**
 * Extract PEM Public Key for Triplit
 *
 * This script extracts the public key from your BetterAuth JWKS endpoint
 * and converts it to PEM format for use with Triplit's EXTERNAL_JWT_SECRET.
 *
 * Usage:
 *   bun run extract:pem                           # Uses BETTER_AUTH_URL from env
 *   bun run extract:pem https://app.example.com   # Uses custom URL
 */

import { extractPemFromBetterAuth } from "../lib/jwks-to-pem"
import { Effect } from "effect"
import { AppLayer } from "../lib/app-services"
import { ConfigService } from "../lib/config-service"

async function getBaseUrl(): Promise<string> {
  // If URL provided as argument, use it
  if (process.argv[2]) {
    return process.argv[2]
  }

  // Try to get from environment configuration
  try {
    const configEffect = Effect.gen(function* () {
      const configService = yield* ConfigService
      const config = yield* configService.getConfig()
      return config.auth.url
    })

    return await Effect.runPromise(configEffect.pipe(Effect.provide(AppLayer)))
  } catch (error) {
    console.warn(
      "⚠️  Could not load BETTER_AUTH_URL from config, using localhost",
    )
    return "http://localhost:3000"
  }
}

async function main() {
  console.log("🔑 Extracting PEM Public Key for Triplit...")

  const baseUrl = await getBaseUrl()
  console.log(`📡 Using base URL: ${baseUrl}`)

  try {
    const pemKey = await extractPemFromBetterAuth(baseUrl)

    console.log("\n✅ PEM Public Key extracted successfully!")
    console.log("\n📋 Copy this PEM key for your Triplit server:")
    console.log("=".repeat(60))
    console.log(pemKey)
    console.log("=".repeat(60))

    console.log("\n🔧 Set this as your Triplit server environment variable:")
    console.log(`EXTERNAL_JWT_SECRET='${pemKey.replace(/\n/g, "\\n")}'`)

    console.log("\n📝 Alternative: Save to file and reference:")
    console.log("# Save PEM to file")
    console.log("echo 'your-pem-content' > public-key.pem")
    console.log("# Reference in Triplit server env")
    console.log("EXTERNAL_JWT_SECRET_FILE=/path/to/public-key.pem")

    console.log("\n🌐 For production deployment:")
    console.log("1. Run this script with your production URL:")
    console.log(`   bun run extract:pem https://your-production-domain.com`)
    console.log("2. Set EXTERNAL_JWT_SECRET in your Triplit server environment")
    console.log("3. Ensure your Triplit server can access this Echo Stack app")
  } catch (error) {
    console.error("❌ Failed to extract PEM key:")
    console.error(error)
    console.log(`\n💡 Make sure your server is running at: ${baseUrl}`)
    console.log("   For development: bun run dev")
    console.log(
      "   For production: Ensure your production server is accessible",
    )
    process.exit(1)
  }
}

main().catch(console.error)
