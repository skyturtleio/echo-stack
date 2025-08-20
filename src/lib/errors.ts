import { Data } from "effect"

/**
 * Structured Error Types for Hey Babe Application
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
