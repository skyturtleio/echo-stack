#!/usr/bin/env bun

/**
 * Database Help Script - Phoenix-inspired
 *
 * Shows all available database commands and their usage
 * Equivalent to `mix help` in Phoenix
 *
 * Usage: bun run db:help
 */

console.log("🗄️  Hey Babe Database Commands (Phoenix-inspired)")
console.log("=".repeat(50))

console.log("\n📦 Setup & Management:")
console.log(
  "  bun run db:setup        🚀 Create database, run migrations, and seed",
)
console.log(
  "  bun run db:reset        🔥 Drop database, recreate, migrate, and seed",
)
console.log("  bun run db:test         🔍 Test database connection")

console.log("\n🔄 Migrations:")
console.log(
  "  bun run db:generate     📝 Generate new migration from schema changes",
)
console.log("  bun run db:migrate      ⬆️  Run pending migrations")
console.log(
  "  bun run db:push         🚀 Push schema changes directly (dev only)",
)

console.log("\n🌱 Seeds & Data:")
console.log("  bun run db:seed         🌱 Seed database with development data")

console.log("\n🔧 Development Tools:")
console.log("  bun run db:studio       🎨 Open Drizzle Studio (GUI)")
console.log("  bun run db:drop         🗑️  Drop all tables (dangerous!)")

console.log("\n📋 Information:")
console.log("  bun run db:help         ❓ Show this help (you are here)")

console.log("\n" + "=".repeat(50))
console.log("🎯 Quick Start (Phoenix-style):")
console.log("  1. bun run db:setup     # First time setup")
console.log("  2. bun run dev          # Start development server")
console.log("  3. bun run db:studio    # View/edit data")

console.log("\n🔄 Common Workflows:")
console.log("  Reset everything:       bun run db:reset")
console.log("  Fresh start:            bun run db:setup")
console.log(
  "  After schema changes:   bun run db:generate && bun run db:migrate",
)
console.log("  Add test data:          bun run db:seed")

console.log("\n⚠️  Safety Notes:")
console.log("  • db:reset destroys ALL data")
console.log("  • db:drop removes all tables")
console.log("  • These commands are development-only")
console.log("  • Production uses db:migrate only")

console.log("\n📚 Phoenix Equivalents:")
console.log("  mix ecto.setup     →    bun run db:setup")
console.log("  mix ecto.reset     →    bun run db:reset")
console.log("  mix ecto.migrate   →    bun run db:migrate")
console.log("  mix ecto.gen.migration → bun run db:generate")

console.log("")
