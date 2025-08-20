# 🛩️ Echo Stack - Single-Seat Full-Stack Starter Kit Extraction Plan

> **"One Developer, Full Control, Maximum Capability"**  
> Built for the solo developer who flies everything themselves, inspired by the F/A-18E Super Hornet single-seat fighter.

## Mission Objective

Extract the production-ready foundation from `hey-babe-triplit-extract-starter-kit` and create **Echo Stack** - a comprehensive starter kit for single-seat developers who need to handle the entire full-stack mission themselves.

## Echo Stack Philosophy ✈️

Just like the F/A-18E Super Hornet, Echo Stack is engineered for:

- **Single-seat operation** - One developer can handle the entire stack
- **Advanced avionics** - Effect.ts provides sophisticated "flight systems"
- **Multi-role capability** - Frontend, backend, database, auth, email, deployment
- **Combat-ready** - Production-grade from day one
- **Reliable systems** - Type safety, error handling, observability built-in

## Current Foundation Assessment: EXCELLENT ⭐⭐⭐⭐⭐

### ✅ Production-Ready Components

- **TanStack Start** - Modern full-stack React framework with SSR
- **Effect.ts** - Professional-grade type-safe configuration and service management
- **BetterAuth** - Production-ready authentication with JWT support
- **Drizzle ORM** - Type-safe database operations
- **Global Connection Pooling** - Solved database connection churn issues
- **Complete Email Workflow** - Mailpit (dev) + Resend (production)
- **TypeScript Strict Mode** - Comprehensive typing throughout

### ✅ Key Effect.ts Integration Complete

1. **✅ Effect Logger Integration** - Replaced console.log with structured logging
2. **✅ Production-Ready Observability** - JSON logs with metadata and correlation
3. **✅ Aviation-Themed Operations** - takeoff, cruise, landing, clearskies for operations
4. **✅ Traditional Error Handling** - Standard error/warning terminology maintained

## Extraction Matrix

### ✅ Extract As-Is (Minimal Changes)

```
src/lib/config.ts              → Effect configuration schema
src/server/db/schema.ts        → BetterAuth database schema
src/server/db/database-service.ts → Connection pooling service
vite.config.ts                 → TanStack Start config
drizzle.config.ts             → Database tooling
eslint.config.js + prettier.config.js → Code quality
```

### 🔧 Extract & Modify (Remove todo-specific code)

```
package.json                   → Clean dependencies, Echo Stack branding
src/lib/auth-service.ts       → Generic auth patterns
src/lib/email.server.ts       → Template email service
src/routes/__root.tsx         → Clean layout
src/components/Header.tsx     → Generic navigation
src/components/auth/          → Genericized auth forms
src/server.ts                 → Server initialization
```

### ✨ Create New (Echo Stack Additions)

```
README.md                     → "Pre-Flight Checklist"
ARCHITECTURE.md              → "Flight Systems Manual"
DEPLOYMENT.md                → "Combat Deployment Guide"
src/lib/logger.ts            → Effect Logger service
src/components/ui/           → Basic component library
src/lib/validation.ts        → API request validation
.env.example                 → Complete environment template
```

### ❌ Skip (Todo-specific)

```
PROJECT_PLAN.md              → Todo project specific
src/components/dashboard/    → Todo UI components
Todo-related route files
Demo files specific to todo features
```

## Echo Stack Architecture

### Core Flight Systems (Effect.ts Services)

- **Flight Computer**: ConfigService - Mission-critical configuration
- **Navigation**: AuthService - Authentication and authorization
- **Communications**: EmailService - Reliable message delivery
- **Radar/Sensors**: LoggerService - Effect Logger with aviation operations + traditional errors
- **Engine Management**: DatabaseService - Connection pooling

### Flight Control (TanStack Start)

- **Fly-by-wire**: Type-safe routing with TanStack Router
- **HUD Display**: Server-side rendering with client hydration
- **Weapon Systems**: API routes with validation and rate limiting
- **Landing Gear**: Development tools and hot module replacement

### Cockpit Interface (React + UI)

- **Primary Flight Display**: Clean dashboard components
- **Multi-Function Display**: Reusable UI component library
- **Control Systems**: Form components with validation
- **Status Indicators**: Loading states and user feedback

## Echo Stack Feature Set

### 🛩️ Single-Seat Developer Capabilities

**Full-Stack Mission Ready:**

- ✅ Backend: TanStack Start server functions
- ✅ Frontend: React with SSR/hydration
- ✅ Database: PostgreSQL + Drizzle ORM
- ✅ Auth: BetterAuth with JWT integration
- ✅ Email: Development (Mailpit) + Production (Resend)
- ✅ Config: Effect.ts type-safe environment management
- ✅ Observability: Effect Logger + structured monitoring + aviation operations

**Advanced Flight Systems:**

- 🎯 Type Safety: Strict TypeScript across entire stack
- 🔧 Resource Management: Effect.ts service patterns
- ⚡ Performance: Connection pooling, caching, optimizations
- 🛡️ Security: Input validation, rate limiting, secure defaults
- 📊 Monitoring: Health checks, error tracking, metrics
- 🧪 Testing: Vitest with auth mocks and database helpers

## Implementation Timeline

### Phase 1: Foundation Extraction (30 minutes)

1. **Package Configuration** - Echo Stack branding and scripts
2. **Core Services** - Extract Effect.ts services (config, auth, database, email)
3. **TanStack Start** - Clean routing and server setup
4. **Database Layer** - Schema and connection management

### ✅ Phase 2: Effect Logger Integration (COMPLETE)

1. **✅ Logger Service** - Effect Logger with aviation-themed operational logging
2. **✅ Console Replacement** - Replaced 100+ console.log statements in database scripts
3. **✅ Structured Observability** - JSON logging with correlation IDs and metadata
4. **✅ Traditional Error Messaging** - Standard error/warning language for familiarity

### Phase 3: UI Component Library (30 minutes)

1. **Base Components** - Button, Input, Card, Modal primitives
2. **Auth Components** - Genericized sign-in/up forms
3. **Layout Components** - Header, navigation, error boundaries
4. **Loading States** - Consistent UX patterns

### Phase 4: API Enhancement (30 minutes)

1. **Validation Layer** - Zod schemas for API inputs
2. **Rate Limiting** - Basic protection for auth endpoints
3. **Error Handling** - Standardized API error responses
4. **Health Monitoring** - Enhanced health check endpoints

### Phase 5: Documentation (45 minutes)

1. **README.md** - "Pre-Flight Checklist" complete setup guide
2. **ARCHITECTURE.md** - "Flight Systems Manual" Effect patterns explained
3. **DEPLOYMENT.md** - "Combat Deployment Guide" production setup
4. **Code Examples** - Common patterns and usage

### Phase 6: Testing & Validation (15 minutes)

1. **Setup Scripts** - One-command initialization
2. **Test Utilities** - Auth mocks, database helpers
3. **Development Workflow** - Hot reload, database studio
4. **Health Checks** - Verify all systems operational

**Total Mission Time: ~3 hours for combat-ready Echo Stack**

## Database Naming Convention (Phoenix-Style)

Echo Stack automatically generates database names based on your project name and environment:

```bash
# Project: echo-stack-starter
# Development: echo_stack_starter_dev
# Test: echo_stack_starter_test
# Production: echo_stack_starter
```

### Configuration Options

**Option 1: Phoenix-style (Recommended)**

```env
# Base URL without database name
DATABASE_BASE_URL=postgresql://user:password@localhost:5432/
NODE_ENV=development
```

**Option 2: Legacy (Full URL)**

```env
# Full URL with explicit database name
DATABASE_URL=postgresql://user:password@localhost:5432/my_custom_db
```

### Database Commands

```bash
# Reset database (drop, create, migrate, seed)
bun run landing  # or bun run db:reset

# Setup database (create, migrate, seed)
bun run db:setup

# Health check
bun run db:health

# Generate new migration
bun run db:generate
```

**No manual database creation needed!** Scripts automatically:

- Create databases if they don't exist
- Drop databases during reset
- Handle environment-specific naming

## Effect Logger Service (Phase 2 Complete ✅)

Echo Stack includes a production-ready Effect Logger service that balances aviation-themed operational logging with traditional error messaging for developer familiarity.

### Logger Features

**Standard Methods (Developer-Friendly):**

- `debug`, `info`, `warn`, `error`, `success` - Familiar method names
- Traditional error/warning language that developers expect
- Errors use standard ❌ terminology for clarity

**Aviation-Themed Messages (Fun Operations):**

- `aviationMessages.starting()` - 🚀 Taking off: operation
- `aviationMessages.processing()` - ✈️ In flight: operation
- `aviationMessages.completing()` - 🛬 Landing: operation completed
- `aviationMessages.success()` - 🌤️ Clear skies: operation successful

**Production Features:**

- **Structured JSON logs** for production observability
- **Colorized console output** for development
- **Context metadata** (service, operation, userId, requestId)
- **Effect.ts integration** with proper dependency injection

### Usage Examples

```typescript
// Aviation-themed messages for operations
yield *
  logger.info(aviationMessages.starting("user authentication"), {
    service: "auth",
    operation: "login",
  })

// Traditional for errors (no aviation theme)
yield *
  logger.error("Authentication failed", {
    service: "auth",
    metadata: { reason: "invalid_credentials" },
  })

// Aviation-themed success messages
yield *
  logger.success(aviationMessages.completing("authentication"), {
    service: "auth",
    metadata: { userId: "123", duration: "150ms" },
  })
```

### Configuration

```env
LOG_LEVEL=info               # debug, info, warn, error, success
LOG_FORMAT=console           # console (dev) | json (prod)
LOG_COLORS=true              # Colorized output
LOG_TIMESTAMP=true           # Include timestamps
```

## Migration Naming Convention

Echo Stack uses descriptive migration names for better maintainability:

```bash
# 1. Generate migration with Drizzle
bun run db:generate

# 2. Rename the generated file to be descriptive
# From: 20250820170923_workable_onslaught.sql
# To:   20250820170923_create_auth_tables.sql

# 3. Update the tag in meta/_journal.json to match the new filename
# "tag": "20250820170923_create_auth_tables"
```

Examples of good migration names:

- `20250820170923_create_auth_tables.sql`
- `20250820180000_add_user_profiles.sql`
- `20250820190000_update_session_expiry.sql`

## Package.json Structure

```json
{
  "name": "echo-stack-starter",
  "version": "1.0.0",
  "description": "🛩️ Single-seat full-stack starter kit for the solo developer",
  "keywords": [
    "effect",
    "tanstack",
    "fullstack",
    "typescript",
    "single-developer"
  ],
  "author": "Echo Squadron",
  "scripts": {
    "preflight": "bun run config:validate && bun run db:health",
    "takeoff": "bun run dev",
    "mission": "bun run build && bun run start",
    "landing": "bun run db:reset"
  }
}
```

## Directory Structure

```
echo-stack-starter/
├── src/
│   ├── components/
│   │   ├── ui/              # Basic component library
│   │   ├── auth/            # Authentication components
│   │   └── cockpit/         # Dashboard/admin components
│   ├── lib/
│   │   ├── config.ts        # Effect configuration schema
│   │   ├── config-service.ts # Configuration service
│   │   ├── auth-service.ts   # Authentication service
│   │   ├── email.server.ts   # Email service
│   │   ├── logger-service.ts # ✅ Effect Logger service (aviation + traditional)
│   │   ├── validation.ts    # NEW: API validation
│   │   └── errors.ts        # Structured error handling
│   ├── routes/
│   │   ├── api/auth/        # Authentication API
│   │   ├── __root.tsx       # Root layout
│   │   ├── index.tsx        # Landing page
│   │   └── health.tsx       # Health check
│   ├── server/
│   │   └── db/
│   │       ├── database-service.ts # Database service
│   │       ├── schema.ts          # Database schema
│   │       └── migrations/        # Database migrations
│   └── scripts/             # Development utilities
├── test/                    # Test utilities and examples
├── docs/                    # Documentation
├── public/                  # Static assets
├── README.md               # Pre-Flight Checklist
├── ARCHITECTURE.md         # Flight Systems Manual
├── DEPLOYMENT.md          # Combat Deployment Guide
└── .env.example           # Environment template
```

## Success Criteria

### ✅ Echo Stack Complete When:

1. **One-command setup** - `bun create echo-stack-starter my-app`
2. **Effect Logger integration** - All console.log replaced with structured logging
3. **Production ready** - Auth, database, email, validation, monitoring
4. **Single developer friendly** - Comprehensive docs, clear patterns
5. **Type-safe throughout** - Strict TypeScript with Effect.ts services
6. **Developer experience** - Hot reload, database tools, testing utilities

### 🎯 Echo Stack Differentiators

- **Effect.ts First** - Professional service patterns and resource management
- **Single-Seat Philosophy** - Optimized for solo developers
- **Aviation-Inspired** - Clear, professional terminology and structure
- **Production Grade** - Enterprise patterns in a startup-friendly package
- **Full Observability** - Monitoring and logging built-in from day one

## Ready for Takeoff! 🛫

This plan provides everything needed to extract the current excellent foundation into **Echo Stack** - the ultimate single-seat full-stack starter kit.

**Next Steps:**

1. CD to `/Users/leo/dev/active/echo-stack-starter/`
2. Start new session with this plan in context
3. Begin Phase 1: Foundation Extraction

The result will be a starter kit that saves solo developers months of setup time while providing enterprise-grade architecture and developer experience.

---

_"Echo Stack - When you need to fly the entire mission yourself"_ ✈️
