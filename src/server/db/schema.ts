import { pgTable, text, timestamp, boolean, json } from "drizzle-orm/pg-core"

/**
 * Database Schema for Hey Babe Couples Todo App
 *
 * This schema includes:
 * 1. BetterAuth tables for authentication
 * 2. Application-specific tables (for future phases)
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
// Application Tables (for future phases)
// =============================================================================

/**
 * User profiles - extends BetterAuth user data
 * Maps to BetterAuth user.id for consistency with Triplit permissions
 */
export const profiles = pgTable("profiles", {
  id: text("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("UTC"),
  preferences: json("preferences"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

/**
 * Couples linking - for sharing todos between partners
 * This will be used by Triplit for permissions and data access
 */
export const couples = pgTable("couples", {
  id: text("id").primaryKey(),
  partner1Id: text("partner1Id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  partner2Id: text("partner2Id").references(() => user.id, {
    onDelete: "cascade",
  }),
  inviteCode: text("inviteCode").unique(),
  status: text("status", { enum: ["pending", "active"] })
    .notNull()
    .default("pending"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

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

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert

export type Couple = typeof couples.$inferSelect
export type NewCouple = typeof couples.$inferInsert
