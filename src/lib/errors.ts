import { Data } from "effect"

/**
 * Structured Error Types for Echo Stack Application
 *
 * This module defines tagged error types that provide better error handling,
 * debugging, and recovery strategies throughout the application.
 */

/**
 * Configuration-related errors
 */
export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly field: string
  readonly reason: string
  readonly value?: unknown
}> {}

export class ConfigurationValidationError extends Data.TaggedError(
  "ConfigurationValidationError",
)<{
  readonly field: string
  readonly message: string
  readonly receivedValue: unknown
}> {}

export class EnvironmentVariableError extends Data.TaggedError(
  "EnvironmentVariableError",
)<{
  readonly variable: string
  readonly reason: "missing" | "invalid" | "empty"
}> {}

/**
 * Database-related errors
 */
export class DatabaseConnectionError extends Data.TaggedError(
  "DatabaseConnectionError",
)<{
  readonly cause: unknown
  readonly connectionString?: string
}> {}

export class DatabaseTransactionError extends Data.TaggedError(
  "DatabaseTransactionError",
)<{
  readonly operation: string
  readonly cause: unknown
}> {}

export class DatabaseQueryError extends Data.TaggedError("DatabaseQueryError")<{
  readonly query: string
  readonly cause: unknown
}> {}

export class DatabaseHealthCheckError extends Data.TaggedError(
  "DatabaseHealthCheckError",
)<{
  readonly cause: unknown
  readonly timestamp: Date
}> {}

/**
 * Email service errors
 */
export class EmailConfigurationError extends Data.TaggedError(
  "EmailConfigurationError",
)<{
  readonly provider: "smtp" | "resend"
  readonly reason: string
}> {}

export class EmailDeliveryError extends Data.TaggedError("EmailDeliveryError")<{
  readonly recipient: string
  readonly subject: string
  readonly cause: unknown
}> {}

export class EmailTemplateError extends Data.TaggedError("EmailTemplateError")<{
  readonly template: string
  readonly reason: string
}> {}

/**
 * Authentication service errors
 */
export class AuthenticationError extends Data.TaggedError(
  "AuthenticationError",
)<{
  readonly reason: "invalid_credentials" | "session_expired" | "jwt_invalid"
  readonly details?: string
}> {}

export class AuthorizationError extends Data.TaggedError("AuthorizationError")<{
  readonly resource: string
  readonly action: string
  readonly userId?: string
}> {}

/**
 * Resource management errors
 */
export class ResourceAcquisitionError extends Data.TaggedError(
  "ResourceAcquisitionError",
)<{
  readonly resource: string
  readonly cause: unknown
}> {}

export class ResourceReleaseError extends Data.TaggedError(
  "ResourceReleaseError",
)<{
  readonly resource: string
  readonly cause: unknown
}> {}

/**
 * Network and external service errors
 */
export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly operation: string
  readonly endpoint?: string
  readonly cause: unknown
}> {}

export class ExternalServiceError extends Data.TaggedError(
  "ExternalServiceError",
)<{
  readonly service: string
  readonly operation: string
  readonly statusCode?: number
  readonly cause: unknown
}> {}

/**
 * Validation errors
 */
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string
  readonly value: unknown
  readonly constraint: string
}> {}

export class SchemaValidationError extends Data.TaggedError(
  "SchemaValidationError",
)<{
  readonly schema: string
  readonly errors: ReadonlyArray<string>
}> {}

/**
 * Application-specific business logic errors
 */
export class CoupleNotFoundError extends Data.TaggedError(
  "CoupleNotFoundError",
)<{
  readonly coupleId: string
}> {}

export class InviteCodeError extends Data.TaggedError("InviteCodeError")<{
  readonly code: string
  readonly reason: "expired" | "invalid" | "already_used"
}> {}

export class TodoPermissionError extends Data.TaggedError(
  "TodoPermissionError",
)<{
  readonly todoId: string
  readonly userId: string
  readonly operation: "read" | "write" | "delete"
}> {}

/**
 * Helper functions for creating common errors
 */
export const createConfigError = (
  field: string,
  reason: string,
  value?: unknown,
) => new ConfigurationError({ field, reason, value })

export const createDatabaseError = (
  cause: unknown,
  connectionString?: string,
) => new DatabaseConnectionError({ cause, connectionString })

export const createEmailError = (
  recipient: string,
  subject: string,
  cause: unknown,
) => new EmailDeliveryError({ recipient, subject, cause })

export const createValidationError = (
  field: string,
  value: unknown,
  constraint: string,
) => new ValidationError({ field, value, constraint })

/**
 * API-specific errors for HTTP responses
 */
export class ApiValidationError extends Data.TaggedError("ApiValidationError")<{
  readonly message: string
  readonly field?: string
  readonly code?: string
}> {}

export class ApiRateLimitError extends Data.TaggedError("ApiRateLimitError")<{
  readonly windowMs: number
  readonly maxRequests: number
  readonly retryAfter: number
}> {}

export class ApiNotFoundError extends Data.TaggedError("ApiNotFoundError")<{
  readonly resource: string
  readonly identifier?: string
}> {}

export class ApiUnauthorizedError extends Data.TaggedError(
  "ApiUnauthorizedError",
)<{
  readonly message: string
  readonly realm?: string
}> {}

export class ApiForbiddenError extends Data.TaggedError("ApiForbiddenError")<{
  readonly resource: string
  readonly action: string
}> {}

export class ApiInternalError extends Data.TaggedError("ApiInternalError")<{
  readonly message: string
  readonly cause: unknown
  readonly requestId?: string
}> {}

/**
 * API Response Utilities
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  details?: Record<string, unknown>
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create standardized API success responses
 */
export function createApiSuccess<T>(
  data?: T,
  message?: string,
): ApiSuccessResponse<T> {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  }
}

/**
 * Create standardized API error responses
 */
export function createApiError(
  error: string,
  code?: string,
  details?: Record<string, unknown>,
): ApiErrorResponse {
  return {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
  }
}

/**
 * Convert structured errors to API error responses
 */
export function errorToApiResponse(error: unknown): ApiErrorResponse {
  // Handle validation errors
  if (error instanceof ApiValidationError) {
    return createApiError(error.message, "VALIDATION_ERROR", {
      field: error.field,
    })
  }

  // Handle rate limiting
  if (error instanceof ApiRateLimitError) {
    return createApiError("Too many requests", "RATE_LIMIT_EXCEEDED", {
      retryAfter: error.retryAfter,
      windowMs: error.windowMs,
      maxRequests: error.maxRequests,
    })
  }

  // Handle not found
  if (error instanceof ApiNotFoundError) {
    return createApiError(`${error.resource} not found`, "NOT_FOUND", {
      resource: error.resource,
      identifier: error.identifier,
    })
  }

  // Handle unauthorized
  if (error instanceof ApiUnauthorizedError) {
    return createApiError(error.message, "UNAUTHORIZED")
  }

  // Handle forbidden
  if (error instanceof ApiForbiddenError) {
    return createApiError(`Access denied to ${error.resource}`, "FORBIDDEN", {
      resource: error.resource,
      action: error.action,
    })
  }

  // Handle authentication errors
  if (error instanceof AuthenticationError) {
    return createApiError("Authentication failed", "AUTH_ERROR", {
      reason: error.reason,
    })
  }

  // Handle authorization errors
  if (error instanceof AuthorizationError) {
    return createApiError("Access denied", "FORBIDDEN", {
      resource: error.resource,
      action: error.action,
    })
  }

  // Handle database errors
  if (error instanceof DatabaseConnectionError) {
    return createApiError("Database connection failed", "DATABASE_ERROR")
  }

  // Handle validation errors
  if (error instanceof ValidationError) {
    return createApiError(
      `Validation failed for ${error.field}: ${error.constraint}`,
      "VALIDATION_ERROR",
      { field: error.field, constraint: error.constraint },
    )
  }

  // Handle network errors
  if (error instanceof NetworkError) {
    return createApiError("Network error occurred", "NETWORK_ERROR")
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    return createApiError(error.message, "INTERNAL_ERROR")
  }

  // Fallback for unknown errors
  return createApiError("An unexpected error occurred", "UNKNOWN_ERROR")
}

/**
 * Helper functions for creating API errors
 */
export const createApiValidationError = (
  message: string,
  field?: string,
  code?: string,
) => new ApiValidationError({ message, field, code })

export const createApiNotFoundError = (resource: string, identifier?: string) =>
  new ApiNotFoundError({ resource, identifier })

export const createApiUnauthorizedError = (message: string, realm?: string) =>
  new ApiUnauthorizedError({ message, realm })

export const createApiForbiddenError = (resource: string, action: string) =>
  new ApiForbiddenError({ resource, action })

export const createApiInternalError = (
  message: string,
  cause: unknown,
  requestId?: string,
) => new ApiInternalError({ message, cause, requestId })

export const createApiRateLimitError = (
  windowMs: number,
  maxRequests: number,
  retryAfter: number,
) => new ApiRateLimitError({ windowMs, maxRequests, retryAfter })
