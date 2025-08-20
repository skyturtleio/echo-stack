# Effect Config Setup for Hey Babe

This branch demonstrates the implementation of **Effect Config** for type-safe environment variable management in the Hey Babe couples todo app.

## 🎯 What's Implemented

### Configuration Schema (`src/lib/config.ts`)

- **Environment**: Development, production, test modes
- **Server Config**: Host, port with validation
- **Database Config**: PostgreSQL connection strings
- **Auth Config**: BetterAuth secrets and URLs (redacted)
- **Triplit Config**: JWT secrets, database paths, CORS settings
- **Email Config**: SMTP (Mailpit) and Resend configurations

### Validation System (`src/lib/config-validation.ts`)

- URL format validation
- Database connection string validation
- Port number range validation
- Email address format validation
- Cross-field validation for production environments

### Configuration Providers (`src/lib/config-provider.ts`)

- **Development Provider**: Sensible defaults for local development
- **Test Provider**: Isolated test configurations
- **Production Provider**: Strict validation for production
- **Custom Providers**: For testing and mocking

## 🚀 Quick Start

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Update Environment Variables

Edit `.env` with your actual values:

```bash
# Required for all environments
DATABASE_URL=postgresql://user:password@localhost:5432/hey_babe_dev
BETTER_AUTH_SECRET=your-32-character-secret-key-here

# Development (uses Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025

# Production (uses Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=hello@yourdomain.com
```

### 3. Test Configuration

```bash
# Run the demo script
npx tsx src/config-demo.ts

# Or start the dev server to see the web demo
npm run dev
```

## 📖 Usage Examples

### Basic Configuration Loading

```typescript
import { Effect } from "effect"
import { loadConfig, developmentProvider } from "@/lib/config"

const program = Effect.gen(function* () {
  const config = yield* loadConfig
  console.log(`Server: ${config.server.host}:${config.server.port}`)
  console.log(`Environment: ${config.environment}`)
})

// Run with development provider
Effect.runPromise(Effect.withConfigProvider(program, developmentProvider))
```

### Validated Configuration

```typescript
import { loadValidatedConfig, productionProvider } from "@/lib/config"

const program = Effect.gen(function* () {
  // This will validate all configuration rules
  const config = yield* loadValidatedConfig

  // Safe to use in production
  return config
})

Effect.runPromise(Effect.withConfigProvider(program, productionProvider))
```

### Environment-Specific Email Config

```typescript
import { getEmailConfig } from "@/lib/config"

const emailProgram = Effect.gen(function* () {
  const emailConfig = yield* getEmailConfig

  if (emailConfig.provider === "smtp") {
    // Development: Use Mailpit SMTP
    console.log("Using SMTP for development")
  } else {
    // Production: Use Resend API
    console.log("Using Resend for production")
  }
})
```

### TanStack Start Route Integration

```typescript
// app/routes/api/health.ts
import type { APIRouteHandler } from "@tanstack/start"
import { Effect } from "effect"
import { loadConfig, getConfigProvider } from "@/lib/config"

export const GET: APIRouteHandler = async () => {
  const provider = await Effect.runPromise(getConfigProvider)

  const healthCheck = Effect.gen(function* () {
    const config = yield* loadConfig

    return {
      status: "ok",
      environment: config.environment,
      server: `${config.server.host}:${config.server.port}`,
      timestamp: new Date().toISOString(),
    }
  })

  const result = await Effect.runPromise(
    Effect.withConfigProvider(healthCheck, provider),
  )

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  })
}
```

### Testing with Custom Provider

```typescript
import { createTestProvider } from "@/lib/config"

const testProvider = createTestProvider(
  new Map([
    ["DATABASE_URL", "postgresql://test:test@localhost:5432/test_db"],
    ["BETTER_AUTH_SECRET", "test-secret-minimum-32-characters"],
    ["PORT", "4000"],
  ]),
)

const testProgram = Effect.gen(function* () {
  const config = yield* loadConfig
  // This will use the test values
})

Effect.runPromise(Effect.withConfigProvider(testProgram, testProvider))
```

## 🏗️ Architecture Benefits

### Type Safety

- All configuration values are typed
- Compile-time checking for required fields
- No runtime `process.env` access scattered throughout code

### Validation

- URL format validation
- Port range validation
- Production-specific requirements
- Environment-specific validation rules

### Security

- Sensitive values automatically redacted in logs
- Type-safe access to secrets
- Clear separation of development vs production secrets

### Testability

- Easy mocking with custom providers
- Isolated test configurations
- No global state dependencies

### Environment Management

- Clear environment-specific defaults
- Fallback configurations for development
- Production validation requirements

## 🔗 Integration with Project Plan

This Effect Config setup directly supports **Phase 1** requirements:

✅ **Type-safe environment variables** - All variables properly typed and validated  
✅ **Database configuration** - PostgreSQL connection strings with validation  
✅ **Auth configuration** - BetterAuth secrets and URLs (redacted for security)  
✅ **Email configuration** - Both Mailpit (dev) and Resend (prod) settings  
✅ **Server configuration** - Host/port with proper defaults

**Ready for Phase 2:**

- JWT secrets for Triplit integration
- CORS settings for client-server communication
- Environment-specific email providers

## 🧪 Testing

The configuration system includes:

- Unit tests for validation functions
- Integration tests with different providers
- Example usage in `src/config-demo.ts`
- Web demo at `http://localhost:3000`

## 📝 Configuration Reference

| Variable              | Type                            | Required  | Default                 | Description                         |
| --------------------- | ------------------------------- | --------- | ----------------------- | ----------------------------------- |
| `NODE_ENV`            | `development\|production\|test` | No        | `development`           | Application environment             |
| `HOST`                | `string`                        | No        | `localhost`             | Server host                         |
| `PORT`                | `number`                        | No        | `3000`                  | Server port                         |
| `DATABASE_URL`        | `string`                        | Yes       | -                       | PostgreSQL connection string        |
| `BETTER_AUTH_SECRET`  | `string` (redacted)             | Yes       | -                       | 32+ character secret for BetterAuth |
| `BETTER_AUTH_URL`     | `string`                        | No        | `http://localhost:3000` | BetterAuth base URL                 |
| `EXTERNAL_JWT_SECRET` | `string` (redacted)             | Prod only | -                       | JWT secret for Triplit              |
| `LOCAL_DATABASE_URL`  | `string`                        | No        | `./data/triplit.db`     | Triplit database path               |
| `CORS_ORIGIN`         | `string`                        | No        | `http://localhost:3000` | CORS origin for Triplit             |
| `SMTP_HOST`           | `string`                        | Dev only  | `localhost`             | SMTP server host                    |
| `SMTP_PORT`           | `number`                        | Dev only  | `1025`                  | SMTP server port                    |
| `RESEND_API_KEY`      | `string` (redacted)             | Prod only | -                       | Resend API key                      |
| `RESEND_FROM_EMAIL`   | `string`                        | Prod only | -                       | From email address                  |

This Effect Config implementation provides a robust foundation for the Hey Babe project's configuration management! 🎉
