/**
 * API Validation Layer - Echo Stack
 *
 * Zod schemas for API input validation with strict TypeScript typing.
 * Provides comprehensive validation for auth, user, and common API patterns.
 */

import { z } from "zod"

// =============================================================================
// Common Validation Patterns
// =============================================================================

export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(1, "Email is required")
  .max(254, "Email too long")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .refine(
    (password) => /[A-Z]/.test(password),
    "Password must contain at least one uppercase letter",
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "Password must contain at least one lowercase letter",
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "Password must contain at least one number",
  )

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name too long")
  .trim()

export const idSchema = z.string().uuid("Invalid ID format")

// =============================================================================
// Authentication Schemas
// =============================================================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
})

export const sendVerificationEmailSchema = z.object({
  email: emailSchema,
  callbackURL: z.string().url().optional(),
})

// =============================================================================
// User Profile Schemas
// =============================================================================

export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
})

// =============================================================================
// API Response Schemas
// =============================================================================

export const apiSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.unknown().optional(),
})

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
})

export const apiResponseSchema = z.union([apiSuccessSchema, apiErrorSchema])

// =============================================================================
// Pagination Schemas
// =============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
})

// =============================================================================
// Health Check Schemas
// =============================================================================

export const healthCheckSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.string().datetime(),
  services: z.record(
    z.string(),
    z.object({
      status: z.enum(["up", "down", "degraded"]),
      responseTime: z.number().optional(),
      details: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  version: z.string().optional(),
  uptime: z.number().optional(),
})

// =============================================================================
// Type Exports (inferred from schemas)
// =============================================================================

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type SendVerificationEmailInput = z.infer<
  typeof sendVerificationEmailSchema
>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ApiSuccessResponse = z.infer<typeof apiSuccessSchema>
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>
export type PaginationParams = z.infer<typeof paginationSchema>
export type HealthCheckResponse = z.infer<typeof healthCheckSchema>

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Create a validation middleware for TanStack Start server functions
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues
          .map((err: any) => `${err.path.join(".")}: ${err.message}`)
          .join(", ")
        throw new Error(`Validation failed: ${message}`)
      }
      throw error
    }
  }
}

/**
 * Safe validation that returns a result object instead of throwing
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues
        .map((err: any) => `${err.path.join(".")}: ${err.message}`)
        .join(", ")
      return { success: false, error: `Validation failed: ${message}` }
    }
    return { success: false, error: "Unknown validation error" }
  }
}

/**
 * Validate query parameters from URL search params
 */
export function validateSearchParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams,
): T {
  const data: Record<string, string | string[]> = {}

  for (const [key, value] of searchParams.entries()) {
    if (data[key]) {
      // Convert to array if multiple values exist
      if (Array.isArray(data[key])) {
        ;(data[key] as string[]).push(value)
      } else {
        data[key] = [data[key] as string, value]
      }
    } else {
      data[key] = value
    }
  }

  return schema.parse(data)
}

// =============================================================================
// Rate Limiting Schemas
// =============================================================================

export const rateLimitConfigSchema = z.object({
  windowMs: z
    .number()
    .positive()
    .default(15 * 60 * 1000), // 15 minutes
  maxRequests: z.number().positive().default(100),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
})

export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>
