#!/usr/bin/env tsx

/**
 * Configuration Demo Script
 *
 * This script demonstrates the Effect Config setup for the Echo Stack project.
 * Run with: `npx tsx src/config-demo.ts`
 */

import { runExamples } from "../test/integration/config.test"

async function main() {
  console.log("🎯 Echo Stack - Effect Config Demo")
  console.log("=".repeat(50))

  try {
    await runExamples()
  } catch (error) {
    console.error("Demo failed:", error)
    process.exit(1)
  }
}

// Run the demo
main().catch(console.error)
