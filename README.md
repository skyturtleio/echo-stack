# 🛩️ Echo Stack - Single-Seat Full-Stack Starter Kit

> **"One Developer, Full Control, Maximum Capability"**  
> Built for the solo developer who flies everything themselves, inspired by the F/A-18E Super Hornet single-seat fighter.

## Pre-Flight Checklist ✅

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- **PostgreSQL** database
- Environment variables configured (see `.env.example`)

### Quick Start

```bash
# Install dependencies
bun install

# Setup database
bun run db:setup

# Start development server
bun run dev
```

## Mission Control 🎛️

### Development Commands

```bash
# Development
bun run dev              # Start development server
bun run db:reset         # Reset database (drop, create, migrate, seed)
bun run db:setup         # Setup database (create, migrate, seed)
bun run db:health        # Check database connection

# Production
bun run build            # Build for production
bun run start            # Start production server

# Code Quality
bun run lint             # Lint code
bun run format           # Format code
bun run check            # Type check
```

## Core Flight Systems ✈️

Echo Stack is built on production-grade technologies optimized for single-seat developers:

### Backend Engine

- **TanStack Start** - Full-stack React framework with SSR
- **Effect.ts** - Type-safe configuration and service management
- **Drizzle ORM** - Type-safe database operations with PostgreSQL
- **BetterAuth** - Production-ready authentication with JWT

### Avionics & Monitoring

- **Effect Logger** - Structured logging with aviation-themed messages
- **Health Checks** - Database and service monitoring
- **Error Handling** - Comprehensive error boundaries and reporting

### Development Radar

- **TypeScript Strict Mode** - Full type safety across the stack
- **Hot Module Replacement** - Instant development feedback
- **Database Studio** - Visual database management

## Flight Navigation 🗺️

Echo Stack uses **TanStack Router** for type-safe, file-based routing:

### Route Structure

```
src/routes/
├── __root.tsx          # Root layout with navigation
├── index.tsx           # Landing page
├── dashboard.tsx       # Main dashboard
├── sign-in.tsx         # Authentication
├── sign-up.tsx         # User registration
├── health.tsx          # System health check
└── api/                # Server functions
    ├── auth/           # Authentication endpoints
    ├── send-verification.ts
    └── verify-token.ts
```

### Adding Routes

Create new `.tsx` files in `src/routes/` - TanStack Router automatically generates route types and navigation.

## Effect Logger Service 📡

Echo Stack includes a production-ready Effect Logger that replaces all `console.*` methods with structured logging:

### Standard Methods

```typescript
import { Logger, aviationMessages } from "@/lib/logger-service"

// In your Effect code
const myService = Effect.gen(function* () {
  const logger = yield* Logger

  // Standard logging methods
  yield* logger.debug("Debug information", { service: "my-service" })
  yield* logger.info("Operation started", { service: "my-service" })
  yield* logger.warn("Warning message", { service: "my-service" })
  yield* logger.error("Error occurred", { service: "my-service" })
  yield* logger.success("Operation completed", { service: "my-service" })
})
```

### Aviation-Themed Messages

For operational logging, use aviation-themed messages that add whimsy to your logs:

```typescript
// Aviation messages for operations (fun and engaging)
yield *
  logger.info(aviationMessages.starting("user authentication"), {
    service: "auth",
    operation: "login",
  })

yield *
  logger.success(aviationMessages.completing("authentication"), {
    service: "auth",
    metadata: { userId: "123", duration: "150ms" },
  })

// Traditional for errors (professional and clear)
yield *
  logger.error("Authentication failed", {
    service: "auth",
    metadata: { reason: "invalid_credentials" },
  })
```

### Configuration

Set up logging with environment variables:

```env
LOG_LEVEL=info               # debug, info, warn, error, success
LOG_FORMAT=console           # console (dev) | json (prod)
LOG_COLORS=true              # Colorized output
LOG_TIMESTAMP=true           # Include timestamps
```

## Database Operations 🗄️

Echo Stack includes Phoenix-style database naming and automatic setup:

### Database Commands

```bash
# Reset database (drop, create, migrate, seed)
bun run db:reset

# Setup database (create, migrate, seed)
bun run db:setup

# Health check
bun run db:health

# Generate new migration
bun run db:generate
```

### Database Naming

Automatically generates database names based on your project:

```bash
# Project: echo-stack-starter
# Development: echo_stack_starter_dev
# Test: echo_stack_starter_test
# Production: echo_stack_starter
```

### Configuration

```env
# Option 1: Phoenix-style (Recommended)
DATABASE_BASE_URL=postgresql://user:password@localhost:5432/
NODE_ENV=development

# Option 2: Legacy (Full URL)
DATABASE_URL=postgresql://user:password@localhost:5432/my_custom_db
```

## Authentication System 🔐

Built-in authentication with BetterAuth:

- Email/password authentication
- JWT token management
- Email verification workflow
- Session management
- Secure password hashing

## Production Deployment 🚀

Echo Stack is production-ready with:

- Environment-based configuration
- Structured JSON logging
- Database connection pooling
- Health check endpoints
- Error monitoring
- Type-safe API endpoints

## Next Steps 📋

1. **Configure your environment** - Copy `.env.example` to `.env`
2. **Setup your database** - Run `bun run db:setup`
3. **Start development** - Run `bun run dev`
4. **Build your features** - Add routes, components, and services

---

_"Echo Stack - When you need to fly the entire mission yourself"_ ✈️
