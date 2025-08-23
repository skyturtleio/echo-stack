/**
 * Error Boundary Components - Echo Stack
 *
 * Comprehensive client-side error handling with different strategies for
 * different types of errors (runtime, async, chunk loading, network).
 */

import React, { Component, ReactNode } from "react"
import { Link } from "@tanstack/react-router"

// =============================================================================
// Error Types and Interfaces
// =============================================================================

interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
  errorBoundaryStack?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    retry: () => void,
  ) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: "page" | "component" | "critical"
  maxRetries?: number
}

// =============================================================================
// Base Error Boundary Class
// =============================================================================

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props

    this.setState({
      errorInfo,
    })

    // Log error for monitoring
    this.logError(error, errorInfo)

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const { level = "component" } = this.props
    const { errorId } = this.state

    const errorDetails = {
      errorId,
      level,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: typeof window !== "undefined" ? window.location.href : "server",
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "server",
    }

    // In development, log to console
    if (process.env.NODE_ENV === "development") {
      console.group(`🚨 Error Boundary (${level})`)
      console.error("Error:", error)
      console.error("Error Info:", errorInfo)
      console.error("Details:", errorDetails)
      console.groupEnd()
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === "production") {
      // TODO: Send to your error monitoring service (Sentry, LogRocket, etc.)
      // Example: Sentry.captureException(error, { extra: errorDetails })
      console.error("Error captured:", errorDetails)
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount < maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }))

      // Clear any existing timeout
      if (this.retryTimeoutId) {
        clearTimeout(this.retryTimeoutId)
      }

      // Auto-retry after a delay for non-critical errors (client-side only)
      if (this.props.level !== "critical" && typeof window !== "undefined") {
        this.retryTimeoutId = window.setTimeout(() => {
          // Additional retry logic could go here
        }, 1000)
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state
    const { children, fallback, maxRetries = 3 } = this.props

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo, this.handleRetry)
      }

      // Default fallback based on error level
      return this.renderDefaultFallback(
        error,
        errorInfo,
        retryCount < maxRetries,
      )
    }

    return children
  }

  private renderDefaultFallback = (
    error: Error,
    _errorInfo: ErrorInfo,
    canRetry: boolean,
  ) => {
    const { level = "component" } = this.props
    const { errorId, retryCount } = this.state

    if (level === "critical") {
      return <CriticalErrorFallback error={error} errorId={errorId} />
    }

    if (level === "page") {
      return (
        <PageErrorFallback
          error={error}
          errorId={errorId}
          canRetry={canRetry}
          retryCount={retryCount}
          onRetry={this.handleRetry}
        />
      )
    }

    return (
      <ComponentErrorFallback
        error={error}
        errorId={errorId}
        canRetry={canRetry}
        onRetry={this.handleRetry}
      />
    )
  }
}

// =============================================================================
// Specialized Error Fallback Components
// =============================================================================

interface ErrorFallbackProps {
  error: Error
  errorId: string
  canRetry?: boolean
  retryCount?: number
  onRetry?: () => void
}

const CriticalErrorFallback: React.FC<
  Omit<ErrorFallbackProps, "canRetry" | "onRetry">
> = ({ error, errorId }) => (
  <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="text-red-500 text-6xl mb-4">💥</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Critical Error</h1>
      <p className="text-gray-600 mb-4">
        A critical error has occurred and the application cannot continue.
      </p>
      <div className="bg-gray-100 rounded p-3 mb-4 text-sm text-left">
        <strong>Error ID:</strong> {errorId}
        <br />
        <strong>Message:</strong> {error.message}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
      >
        Reload Application
      </button>
    </div>
  </div>
)

const PageErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  canRetry,
  retryCount = 0,
  onRetry,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-lg w-full bg-white rounded-lg shadow p-6 text-center">
      <div className="text-orange-500 text-5xl mb-4">⚠️</div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-600 mb-4">
        We encountered an error loading this page. This has been reported to our
        team.
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-100 rounded p-3 mb-4 text-sm text-left">
          <strong>Error ID:</strong> {errorId}
          <br />
          <strong>Message:</strong> {error.message}
          <br />
          <strong>Retry Count:</strong> {retryCount}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link
          to="/"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Go Home
        </Link>
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  </div>
)

const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  canRetry,
  onRetry,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
    <div className="flex items-start gap-3">
      <div className="text-red-500 text-xl">⚠️</div>
      <div className="flex-1">
        <h3 className="font-medium text-red-800 mb-1">Component Error</h3>
        <p className="text-red-700 text-sm mb-3">
          This component failed to render properly.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-red-100 rounded p-2 mb-3 text-xs font-mono">
            <strong>ID:</strong> {errorId}
            <br />
            <strong>Error:</strong> {error.message}
          </div>
        )}

        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  </div>
)

// =============================================================================
// Specialized Error Boundary Variants
// =============================================================================

export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, "level">> = (
  props,
) => <ErrorBoundary {...props} level="page" />

export const ComponentErrorBoundary: React.FC<
  Omit<ErrorBoundaryProps, "level">
> = (props) => <ErrorBoundary {...props} level="component" />

export const CriticalErrorBoundary: React.FC<
  Omit<ErrorBoundaryProps, "level">
> = (props) => <ErrorBoundary {...props} level="critical" maxRetries={0} />

// =============================================================================
// Async Error Handling
// =============================================================================

export const handleAsyncError = (error: Error, context?: string) => {
  const errorId = `async_error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

  const errorDetails = {
    errorId,
    context: context || "async_operation",
    message: error.message,
    stack: error.stack,
    url: typeof window !== "undefined" ? window.location.href : "server",
    timestamp: new Date().toISOString(),
  }

  if (process.env.NODE_ENV === "development") {
    console.group("🚨 Async Error")
    console.error("Error:", error)
    console.error("Context:", context)
    console.error("Details:", errorDetails)
    console.groupEnd()
  }

  if (process.env.NODE_ENV === "production") {
    // TODO: Send to error monitoring service
    console.error("Async error captured:", errorDetails)
  }

  return errorId
}
