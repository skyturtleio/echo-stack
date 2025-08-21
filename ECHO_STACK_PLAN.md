# 🛩️ Echo Stack - Single-Seat Full-Stack Starter Kit Extraction Plan

> **"One Developer, Full Control, Maximum Capability"**  
> Built for the solo developer who flies everything themselves, inspired by the F/A-18E Super Hornet single-seat fighter.

## Mission Objective

Extract the production-ready foundation from `hey-babe-triplit-extract-starter-kit` and create **Echo Stack** - a comprehensive starter kit for single-seat developers who need to handle the entire full-stack mission themselves.

## Echo Stack Philosophy ✈️

Just like the F/A-18E Super Hornet, Echo Stack is engineered for:

- **Single-seat operation** - One developer can handle the entire stack
- **Pragmatic tooling** - Right tool for the job, not ideology over shipping
- **Multi-role capability** - Frontend, backend, database, auth, email, deployment
- **Combat-ready** - Production-grade from day one
- **Reliable systems** - Type safety, error handling, observability built-in

### Technology Strategy

**Effect.ts for Infrastructure:**

- Configuration management and service composition
- Database connection pooling and resource management
- Logger service and observability
- Server-side service orchestration

**Ecosystem Standards for Application:**

- API validation with Zod (ecosystem integration)
- UI patterns with React ecosystem tools
- Developer velocity with proven, well-documented libraries

## Current Foundation Assessment: EXCELLENT ⭐⭐⭐⭐⭐

### ✅ Production-Ready Components

- **TanStack Start** - Modern full-stack React framework with SSR
- **Effect.ts** - Professional-grade type-safe configuration and service management
- **BetterAuth** - Production-ready authentication with JWT support
- **Drizzle ORM** - Type-safe database operations
- **Global Connection Pooling** - Solved database connection churn issues
- **Complete Email Workflow** - Mailpit (dev) + Resend (production)
- **TypeScript Strict Mode** - Comprehensive typing throughout

### ✅ Key Infrastructure Integration Complete

1. **✅ Effect Logger Integration** - Replaced console.log with structured logging
2. **✅ Production-Ready Observability** - JSON logs with metadata and correlation
3. **✅ Aviation-Themed Messages** - Aviation messages in content, standard method names
4. **✅ Traditional Error Handling** - Standard error/warning terminology maintained
5. **✅ Pragmatic Architecture** - Effect.ts for infrastructure, ecosystem tools for application

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
- **Radar/Sensors**: LoggerService - Effect Logger with aviation-themed messages + standard methods
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
- ✅ Auth: BetterAuth with JWT integration + email verification
- ✅ Email: Development (Mailpit) + Production (Resend) with verification flow
- ✅ Config: Effect.ts type-safe environment management
- ✅ Observability: Effect Logger + structured monitoring + aviation-themed messages

**Advanced Flight Systems:**

- 🎯 Type Safety: Strict TypeScript across entire stack
- 🔧 Resource Management: Effect.ts service patterns
- ⚡ Performance: Connection pooling, caching, optimizations
- 🛡️ Security: Input validation, rate limiting, secure defaults
- 📊 Monitoring: Health checks, error tracking, metrics
- 🧪 Testing: Hybrid approach - Integration tests for infrastructure, unit tests for logic

## Implementation Timeline

### Phase 1: Foundation Extraction (30 minutes)

1. **Package Configuration** - Echo Stack branding and scripts
2. **Core Services** - Extract Effect.ts services (config, auth, database, email)
3. **TanStack Start** - Clean routing and server setup
4. **Database Layer** - Schema and connection management

### ✅ Phase 2: Infrastructure Integration & Testing (COMPLETE)

1. **✅ Logger Service** - Effect Logger with aviation-themed operational logging
2. **✅ Console Replacement** - Replaced 100+ console.log statements in database scripts
3. **✅ Structured Observability** - JSON logging with correlation IDs and metadata
4. **✅ Traditional Error Messaging** - Standard error/warning language for familiarity
5. **✅ Documentation Updates** - Updated README.md to reflect current implementation
6. **✅ Hybrid Testing Structure** - Reorganized tests for infrastructure validation and future unit tests
7. **✅ Email Verification Flow** - BetterAuth integration with proper UX and type safety

### ✅ Phase 3: API Enhancement (COMPLETE) - **CORE FUNCTIONALITY**

1. **✅ Validation Layer** - Comprehensive Zod schemas for API inputs with strict TypeScript
2. **✅ Rate Limiting** - Effect.ts-based in-memory rate limiter with configurable limits
3. **✅ Error Handling** - Standardized API error responses with proper HTTP status codes
4. **✅ Health Monitoring** - Enhanced JSON health check endpoints for monitoring

### Phase 4: Security & Production Readiness (30 minutes) - **CORE FUNCTIONALITY**

1. **Input Sanitization** - Protect against XSS and injection attacks
2. **CORS Configuration** - Proper cross-origin resource sharing
3. **Environment Validation** - Strict production environment checks
4. **Error Boundaries** - Comprehensive client-side error handling

### Phase 5: Documentation & Architecture (45 minutes) - **CORE FUNCTIONALITY**

1. **✅ README.md** - "Pre-Flight Checklist" complete setup guide (COMPLETE)
2. **ARCHITECTURE.md** - "Flight Systems Manual" Effect patterns explained
3. **DEPLOYMENT.md** - "Combat Deployment Guide" production setup
4. **Code Examples** - Common patterns and usage

### Phase 6: Advanced Testing & Validation (15 minutes) - **CORE FUNCTIONALITY**

1. **Unit Test Foundation** - Traditional Vitest tests for Zod schemas and pure functions
2. **Test Utilities** - Auth mocks, database helpers in test/helpers/
3. **Development Workflow** - Hot reload, database studio
4. **CI/CD Integration** - Automated testing pipeline setup

### Phase 7: UI Component Library (30 minutes) - **POLISH**

1. **Base Components** - Button, Input, Card, Modal primitives
2. **Auth Components** - Genericized sign-in/up forms
3. **Layout Components** - Header, navigation, error boundaries
4. **Loading States** - Consistent UX patterns

**Total Mission Time: ~3.5 hours for combat-ready Echo Stack** (Core: ~2.5 hours, Polish: ~1 hour)

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

## Email Verification System (Phase 2 Complete ✅)

Echo Stack implements a production-ready email verification flow using BetterAuth's built-in system, enhanced with Effect.ts infrastructure for reliability.

### Architecture Decision: BetterAuth Integration

**✅ Chosen Approach**: Use BetterAuth's proven verification system with Effect.ts enhancements

- **Security**: Battle-tested token generation and validation
- **Reliability**: Handles edge cases, rate limiting, and security best practices
- **Maintainability**: No custom crypto or token management code to maintain
- **Effect Integration**: Email sending wrapped in Effect for retry logic and structured logging

### Email Verification Flow

```
1. User signs up → Account created (emailVerified: false) + automatic verification email sent
2. User clicks email link → BetterAuth validates token → emailVerified: true + auto sign-in
3. User redirected to /verify-success → Auto-redirect to /dashboard (authenticated)
4. Resend button → Same flow with proper callback URLs
```

### Implementation Details

**Signup Flow** (`src/components/auth/SignUpForm.tsx`):

- Uses `authClient.signUp.email()` to create account
- BetterAuth automatically sends verification email with `callbackURL: "/verify-success"`
- Provides proper error handling and user feedback

**Resend Flow** (`src/routes/verify-email.pending.tsx`):

- Uses `authClient.sendVerificationEmail()` with same callback URL
- Consistent UX between initial and resend emails

**Verification Success** (`src/routes/verify-success.tsx`):

- Dedicated success page with clear messaging
- Auto-redirect to dashboard after 3 seconds
- Fallback manual navigation options

### Type Safety & Effect Integration

**Authentication Service** (`src/lib/auth-service.ts`):

- Replaced `user: any` with proper TypeScript interface
- Effect.ts service composition for config and database dependencies
- Structured error handling and logging integration

**Email Service** (`src/lib/email.server.ts`):

- Effect Config for environment-specific email providers
- Mailpit (development) + Resend (production) with automatic switching
- Proper error handling and retry logic through Effect

### Benefits of This Architecture

1. **Security**: BetterAuth handles token generation, validation, and security
2. **Reliability**: Effect.ts provides structured concurrency and error handling
3. **Developer Experience**: Clear separation between auth logic and infrastructure
4. **Type Safety**: Strict TypeScript throughout the verification flow
5. **Observability**: Structured logging with correlation IDs and metadata
6. **Maintainability**: Standard patterns, minimal custom code

### Future Enhancement Opportunities

For additional Effect.ts structured concurrency benefits:

- Wrap verification email sending in Effect with retry logic
- Add telemetry and metrics collection
- Implement rate limiting with Effect Rate Limiter
- Add distributed tracing for email delivery tracking

## Hybrid Testing Strategy (Phase 2 Complete ✅)

Echo Stack employs a pragmatic hybrid testing approach that balances infrastructure validation with traditional unit testing for optimal developer experience and operational confidence.

### Integration Tests (Script-Based) - `test/integration/`

**Purpose:** Validate real environment setup and service composition

```bash
# Infrastructure health checks
bun run db:health              # Database connectivity
bun run test:integration       # Core infrastructure tests
bun run test:config            # Configuration validation
bun run test:auth              # Authentication service
bun run test:email             # Email service
```

**Advantages:**

- Tests against actual environment (real DB, real config)
- Validates Effect.ts service composition and dependency injection
- Serves dual purpose as operational health checks
- Catches configuration drift between environments
- Tests resource management and cleanup

**Files:**

- `database.test.ts` - Database connectivity and health checks
- `logger.test.ts` - Logger service integration with aviation messages
- `config.test.ts` - Configuration loading and validation examples
- `auth.test.ts` - Authentication service configuration
- `email.test.ts` - Email service with Mailpit integration

### Unit Tests (Traditional) - `test/unit/`

**Purpose:** Fast feedback loop for business logic and pure functions

```bash
bun run test                   # Traditional unit tests (Vitest)
```

**Ideal for:**

- Zod schema validation (fast, isolated)
- Pure function testing (utils, helpers)
- React component behavior testing
- API endpoint logic (isolated from database)
- Edge case testing and TDD workflows

### Test Utilities - `test/helpers/`

**Shared resources:**

- Effect test providers and mock configurations
- Database test utilities and fixtures
- Authentication mocks and test users
- Common test setup and teardown patterns

### Testing Philosophy

**"Right Tool for the Right Job":**

| Test Type       | Use For                                 | Speed  | Environment |
| --------------- | --------------------------------------- | ------ | ----------- |
| **Integration** | Infrastructure, services, E2E workflows | Slower | Real        |
| **Unit**        | Business logic, schemas, pure functions | Fast   | Mocked      |

**Benefits of Hybrid Approach:**

1. **Fast Development** - Unit tests provide immediate feedback
2. **Environment Confidence** - Integration tests catch real-world issues
3. **Operational Value** - Integration tests serve as health monitoring tools
4. **TDD-Friendly** - Unit tests support rapid iteration cycles
5. **Production Safety** - Integration tests validate actual service composition

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
├── test/                    # Hybrid testing structure
│   ├── integration/         # Infrastructure & service tests
│   ├── unit/               # Traditional unit tests (Vitest)
│   └── helpers/            # Test utilities and mocks
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
6. **Developer experience** - Hot reload, database tools, hybrid testing approach

### 🎯 Echo Stack Differentiators

- **Pragmatic Architecture** - Effect.ts for infrastructure, ecosystem tools for speed
- **Single-Seat Philosophy** - Optimized for solo developers who ship fast
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
