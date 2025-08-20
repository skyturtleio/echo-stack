# Effect Config Developer Guide

> **Quick Reference**: How to use Effect Config for environment variables in the Hey Babe project

## 🎯 TL;DR - Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit with your values
vim .env

# 3. Use in code
import { loadConfig } from "@/lib/config"
const config = yield* loadConfig
```

## 📁 Environment File Setup

### Standard .env Files (Just like normal!)

Effect Config uses regular `.env` files - no special setup needed.

> **⚠️ Important:** The web UI and CLI demo use `defaultProvider` which reads from your actual `.env` file. The `developmentProvider` contains hardcoded fallback values for when `.env` is missing.

```bash
# .env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/hey_babe_dev
BETTER_AUTH_SECRET=your-actual-32-character-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Email settings
SMTP_HOST=localhost
SMTP_PORT=1025
RESEND_API_KEY=re_your_actual_resend_key
```

### Multiple Environment Files

```bash
.env                 # Default values
.env.local          # Local overrides (gitignored)
.env.development    # Development-specific
.env.production     # Production-specific
```

### Config Providers Explained

```typescript
// Reads from your actual .env file
defaultProvider // ← Use this for real development

// Has hardcoded fallback values (used in tests)
developmentProvider // ← Only use for demos/tests

// Isolated test values
testProvider // ← Use for unit tests

// Custom values for specific tests
createTestProvider() // ← Use for mocking
```

## 🔄 Effect Config vs Traditional process.env

### ❌ Old Way (Runtime Errors, No Validation)

```typescript
// Manual type conversion, no validation
const port = parseInt(process.env.PORT || "3000")
const secret = process.env.BETTER_AUTH_SECRET // Could be undefined!
const dbUrl = process.env.DATABASE_URL || "postgresql://localhost/default"

// Runtime error if SECRET is missing
betterAuth({ secret }) // 💥 Could crash
```

### ✅ Effect Config Way (Type-Safe, Validated)

```typescript
import { loadConfig } from "@/lib/config"

const program = Effect.gen(function* () {
  const config = yield* loadConfig // ✅ Validated at startup

  // All values are properly typed and validated
  const port = config.server.port // number (validated range)
  const secret = config.auth.secret // Redacted<string> (validated length)
  const dbUrl = config.database.url // string (validated format)

  // Safe to use - all validation happened upfront
  return betterAuth({
    secret: Redacted.value(secret), // ✅ Safe access
    baseURL: config.auth.url,
  })
})
```

## 🌐 Development Web UI

### Always Available for Debugging

The config debug UI is permanently available during development:

```bash
bun run dev
# Visit: http://localhost:3000
```

**Use it for:**

- 🐛 **Debugging** - See exactly what values are loaded
- ✅ **Validation** - Catch configuration errors early
- 👥 **Team onboarding** - Show new developers what's configured
- 🔍 **Troubleshooting** - Visual config inspection

## 🛠️ Daily Development Workflow

### 1. Environment Setup (One Time)

```bash
# Copy template and edit
cp .env.example .env
vim .env  # Add your actual values
```

### 2. Check Configuration

```bash
# CLI demo (comprehensive test)
bun run src/config-demo.ts

# Web UI (visual debugging)
bun run dev  # → http://localhost:3000
```

### 3. Use in Code

```typescript
// Any route, component, or server function
import { loadConfig, isDevelopment, getEmailConfig } from "@/lib/config"

const myProgram = Effect.gen(function* () {
  const config = yield* loadConfig
  const isDev = yield* isDevelopment
  const emailConfig = yield* getEmailConfig

  console.log(`Environment: ${config.environment}`)
  console.log(`Database: ${config.database.url}`)
  console.log(`Email provider: ${emailConfig.provider}`)
})

// Run the program
Effect.runPromise(myProgram)
```

## 🔧 Integration Patterns

### TanStack Start Route Loaders

```typescript
// app/routes/dashboard.tsx
import { loadConfig } from "@/lib/config"

export async function loader() {
  const program = Effect.gen(function* () {
    const config = yield* loadConfig

    return {
      serverUrl: `${config.server.host}:${config.server.port}`,
      environment: config.environment,
      authUrl: config.auth.url,
    }
  })

  return Effect.runPromise(program)
}
```

### Server Functions & API Routes

```typescript
// app/routes/api/health.ts
import { loadConfig } from "@/lib/config"

export async function GET() {
  const healthCheck = Effect.gen(function* () {
    const config = yield* loadConfig

    return {
      status: "ok",
      environment: config.environment,
      timestamp: new Date().toISOString(),
    }
  })

  const result = await Effect.runPromise(healthCheck)
  return Response.json(result)
}
```

### BetterAuth Integration

```typescript
// lib/auth.server.ts
import { getAuthConfig } from "@/lib/config"
import { betterAuth } from "better-auth"

const createAuth = Effect.gen(function* () {
  const authConfig = yield* getAuthConfig

  return betterAuth({
    secret: Redacted.value(authConfig.secret),
    baseURL: authConfig.url,
    database: {
      // Use database config...
    },
  })
})

export const auth = await Effect.runPromise(createAuth)
```

### Email Service Integration

```typescript
// lib/email.server.ts
import { getEmailConfig } from "@/lib/config"

const createEmailService = Effect.gen(function* () {
  const emailConfig = yield* getEmailConfig

  if (emailConfig.provider === "smtp") {
    // Development: Mailpit SMTP
    return createSMTPTransport(emailConfig.config)
  } else {
    // Production: Resend API
    return createResendClient(emailConfig.config)
  }
})
```

## 🔐 Secret Management

### Redacted Values (Auto-Hidden in Logs)

```typescript
const config = yield * loadConfig

// ❌ Never do this - exposes secret in logs
console.log(config.auth.secret) // Logs: <redacted>

// ✅ Safe access when needed
const secretValue = Redacted.value(config.auth.secret)
useSecretSafely(secretValue)
```

### Environment-Specific Secrets

```typescript
const program = Effect.gen(function* () {
  const config = yield* loadConfig

  if (config.environment === "production") {
    // Production secrets are required and validated
    const resendKey = Redacted.value(config.email.resend.apiKey)
    const jwtSecret = Redacted.value(config.triplit.jwtSecret)
  } else {
    // Development secrets have safe defaults
    const smtpConfig = config.email.smtp // Uses Mailpit defaults
  }
})
```

## 🧪 Testing with Custom Config

### Unit Tests

```typescript
import { createTestProvider } from "@/lib/config"

test("handles custom database URL", async () => {
  const testProvider = createTestProvider(
    new Map([
      ["DATABASE_URL", "postgresql://test:test@localhost:5432/test_db"],
      ["BETTER_AUTH_SECRET", "test-secret-minimum-32-characters"],
    ]),
  )

  const program = Effect.gen(function* () {
    const config = yield* loadConfig
    expect(config.database.url).toBe(
      "postgresql://test:test@localhost:5432/test_db",
    )
  })

  await Effect.runPromise(Effect.withConfigProvider(program, testProvider))
})
```

### Integration Tests

```typescript
// Use the built-in test provider
import { testProvider } from "@/lib/config"

const testProgram = Effect.gen(function* () {
  const config = yield* loadConfig
  // All test values pre-configured
})

Effect.runPromise(Effect.withConfigProvider(testProgram, testProvider))
```

## 🚀 Migration from process.env

### Gradual Migration Strategy

**Phase 1: Coexistence**

```typescript
// Keep old way for existing code
const oldDbUrl = process.env.DATABASE_URL

// Use new way for new features
const config = yield * loadConfig
const newDbUrl = config.database.url
```

**Phase 2: Full Migration**

```typescript
// Replace all process.env usage
const config = yield * loadConfig

// Instead of: process.env.PORT
const port = config.server.port

// Instead of: process.env.BETTER_AUTH_SECRET
const secret = Redacted.value(config.auth.secret)
```

## 🔍 Troubleshooting

### Common Issues & Solutions

**Missing Environment Variable:**

```bash
Error: Expected DATABASE_URL to exist in the process context
```

**Fix:** Add to your `.env` file or check spelling

**Validation Error:**

```bash
Error: PORT must be between 1 and 65535
```

**Fix:** Check the value in `.env` matches validation rules

**Secret Too Short:**

```bash
Error: BETTER_AUTH_SECRET must be at least 32 characters
```

**Fix:** Generate a longer secret: `openssl rand -base64 32`

### Debug Steps

1. **Check Web UI** → `http://localhost:3000`
2. **Run CLI Demo** → `bun run src/config-demo.ts`
3. **Verify .env File** → Check values match `.env.example`
4. **Check Validation Rules** → See `src/lib/config-validation.ts`

## 📋 Environment Variables Reference

| Variable              | Type     | Required | Default                 | Notes                           |
| --------------------- | -------- | -------- | ----------------------- | ------------------------------- |
| `NODE_ENV`            | enum     | No       | `development`           | `development\|production\|test` |
| `HOST`                | string   | No       | `localhost`             | Server hostname                 |
| `PORT`                | number   | No       | `3000`                  | Server port (1-65535)           |
| `DATABASE_URL`        | string   | **Yes**  | -                       | PostgreSQL connection string    |
| `BETTER_AUTH_SECRET`  | redacted | **Yes**  | -                       | 32+ characters required         |
| `BETTER_AUTH_URL`     | string   | No       | `http://localhost:3000` | Must be valid URL               |
| `EXTERNAL_JWT_SECRET` | redacted | Prod     | -                       | JWT secret for Triplit          |
| `LOCAL_DATABASE_URL`  | string   | No       | `./data/triplit.db`     | Triplit database path           |
| `CORS_ORIGIN`         | string   | No       | `http://localhost:3000` | CORS origin for Triplit         |
| `SMTP_HOST`           | string   | Dev      | `localhost`             | Development email (Mailpit)     |
| `SMTP_PORT`           | number   | Dev      | `1025`                  | Development email port          |
| `RESEND_API_KEY`      | redacted | Prod     | -                       | Production email (Resend)       |
| `RESEND_FROM_EMAIL`   | string   | Prod     | -                       | Must be valid email format      |

## 🎉 Benefits Summary

**🔒 Security**

- Secrets automatically redacted in logs
- Environment-specific validation
- Type-safe access to sensitive values

**🛡️ Reliability**

- Validation at startup (fail fast)
- Type safety prevents runtime errors
- Comprehensive error messages

**🧪 Testability**

- Easy mocking with custom providers
- Isolated test configurations
- No global state dependencies

**👥 Developer Experience**

- Visual debugging with web UI
- Clear documentation and examples
- Gradual migration path

---

**💡 Remember:** Effect Config enhances the standard `.env` workflow with type safety and validation - it doesn't replace it! You still use normal `.env` files, but get much better reliability and developer experience. 🚀
