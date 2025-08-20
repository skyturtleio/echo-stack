import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core"

/**
 * Database Schema for Echo Stack
 *
 * This schema includes:
 * 1. BetterAuth tables for authentication (production-ready)
 * 2. Example application tables (customize for your needs)
 */

// =============================================================================
// BetterAuth Tables
// =============================================================================

/**
 * Users table - managed by BetterAuth
 * This is the single source of truth for user data
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

/**
 * User sessions - managed by BetterAuth
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
})

/**
 * OAuth accounts - managed by BetterAuth (for future social auth)
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

/**
 * Email verification tokens - managed by BetterAuth
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

/**
 * Password reset and other trusted tokens - managed by BetterAuth
 */
export const trustedToken = pgTable("trustedToken", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

/**
 * JWT keys and metadata - managed by BetterAuth JWT plugin
 */
export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  algorithm: text("algorithm").notNull().default("RS256"),
})

// =============================================================================
// Example Application Tables (commented out for clean initial migration)
// =============================================================================
//
// Uncomment and customize these tables for your application needs:
//
// /**
//  * User profiles - extends BetterAuth user data
//  * Example of how to add additional user data beyond authentication
//  */
// export const profiles = pgTable("profiles", {
//   id: text("id")
//     .primaryKey()
//     .references(() => user.id, { onDelete: "cascade" }),
//   timezone: text("timezone").notNull().default("UTC"),
//   preferences: json("preferences"),
//   createdAt: timestamp("createdAt").notNull().defaultNow(),
//   updatedAt: timestamp("updatedAt").notNull().defaultNow(),
// })

// /**
//  * Example relationships table - customize for your app's needs
//  * This shows how to create relationships between users
//  */
// export const relationships = pgTable("relationships", {
//   id: text("id").primaryKey(),
//   userId: text("userId")
//     .notNull()
//     .references(() => user.id, { onDelete: "cascade" }),
//   relatedUserId: text("relatedUserId").references(() => user.id, {
//     onDelete: "cascade",
//   }),
//   type: text("type").notNull().default("connection"),
//   status: text("status", { enum: ["pending", "active", "inactive"] })
//     .notNull()
//     .default("pending"),
//   createdAt: timestamp("createdAt").notNull().defaultNow(),
//   updatedAt: timestamp("updatedAt").notNull().defaultNow(),
// })

// =============================================================================
// Type Exports for TypeScript
// =============================================================================

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert

export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert

export type Verification = typeof verification.$inferSelect
export type NewVerification = typeof verification.$inferInsert

export type TrustedToken = typeof trustedToken.$inferSelect
export type NewTrustedToken = typeof trustedToken.$inferInsert

export type Jwks = typeof jwks.$inferSelect
export type NewJwks = typeof jwks.$inferInsert

// Uncomment these when you add the tables above:
// export type Profile = typeof profiles.$inferSelect
// export type NewProfile = typeof profiles.$inferInsert

// export type Relationship = typeof relationships.$inferSelect
// export type NewRelationship = typeof relationships.$inferInsert
