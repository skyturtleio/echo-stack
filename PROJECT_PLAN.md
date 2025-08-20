# Couples Todo App - Project Plan (TanStack Start)

## Overview

"Hey Babe", a collaborative todo app designed for couples with local-first architecture, offline capabilities, and real-time synchronization. Features private todos, shared todos, and timeline-based organization.

Potential marketing line: "Hey Babe, a minimal, collaborative todo app for power couples"

## Approach and mindset

1. Make it work
2. Make it fast
3. Make it pretty

## Tech Stack

### Frontend/Framework

- **TanStack Start** - Full-stack React framework with SSR, streaming, and server functions
- **TanStack Router** - Type-safe routing with search params state management (built into Start)
- **Triplit Client** - Local-first data layer with offline support
- **TypeScript** - Strict mode for type safety
- **Tailwind CSS** - Utility-first styling
- **Effect.ts** - _(Optional enhancement)_ For complex async operations and error handling

### Backend

- **BetterAuth** - Authentication with JWT plugin for Triplit integration
- **PostgreSQL** - Primary database for users and auth
- **Drizzle ORM** - Type-safe database operations
- **Triplit Server** - Self-hosted sync server for todo data
- **Nodemailer** - Email sending library for authentication and notifications

### Infrastructure

- **Bun** - Runtime and package manager
- **Docker** - Containerization for deployment
- **Coolify** - Self-hosted deployment platform
- **GitHub** - Source control with auto-deploy

### Development Tools

- **TypeScript ESLint** - Linting and best practices
- **Prettier** - Code formatting
- **Strict TypeScript** - Maximum type safety
- **Mailpit** - Local SMTP server with web UI for development email testing

## Architecture

### Updated Data Flow

```
TanStack Start App → BetterAuth → JWT → Triplit Server
        ↑                                   ↓
        ← Triplit Client (offline) ←────────┘
```

### Service Deployment

```
Coolify VPS:
├── TanStack Start App (SSR + BetterAuth + client)
├── PostgreSQL (user data, auth)
└── Triplit Server (todo data sync + storage)
```

### Authentication Integration

- **BetterAuth** issues JWTs with user.id as `sub` claim
- **Triplit** validates JWTs using `EXTERNAL_JWT_SECRET`
- **Single user source of truth** in PostgreSQL via BetterAuth
- **No user duplication** between auth and Triplit databases

## Database Schema

### BetterAuth Database (PostgreSQL)

BetterAuth automatically creates and manages user tables:

- `user` - Core user data (id, email, name, etc.)
- `session` - User sessions
- `account` - Social auth accounts (if needed)
- Plus JWT plugin tables for token management

### Triplit Schema (Local-first todo data)

No users collection needed - BetterAuth user.id becomes the source of truth.

```typescript
// Optional: Additional user profile data
profiles: {
  schema: S.Schema({
    id: S.Id(), // Maps to BetterAuth user.id
    timezone: S.String({ default: 'UTC' }),
    preferences: S.String({ nullable: true }),
  }),
  permissions: {
    authenticated: {
      read: { filter: [['id', '=', '$token.sub']] },
      insert: { filter: [['id', '=', '$token.sub']] },
      update: { filter: [['id', '=', '$token.sub']] },
    }
  }
}

couples: {
  schema: S.Schema({
    id: S.Id(),
    partner1Id: S.String(), // BetterAuth user.id
    partner2Id: S.String(), // BetterAuth user.id
    inviteCode: S.String({ nullable: true }),
    status: S.String({ enum: ['pending', 'active'] }),
    createdAt: S.Date({ default: S.Default.now() }),
  }),
  relationships: {
    // All todos for this couple (shared + both partners' private todos)
    allTodos: S.RelationMany('todos', {
      where: [
        'or',
        [['coupleId', '=', '$id']], // shared todos
        [['ownerId', '=', '$partner1Id']], // partner1's todos
        [['ownerId', '=', '$partner2Id']] // partner2's todos
      ],
    }),
    // Just shared todos for this couple
    sharedTodos: S.RelationMany('todos', {
      where: [
        ['coupleId', '=', '$id'],
        ['visibility', '=', 'shared']
      ],
    }),
  },
  permissions: {
    authenticated: {
      read: {
        filter: [
          or([
            ['partner1Id', '=', '$token.sub'],
            ['partner2Id', '=', '$token.sub']
          ])
        ]
      },
      insert: {
        filter: [
          or([
            ['partner1Id', '=', '$token.sub'],
            ['partner2Id', '=', '$token.sub']
          ])
        ]
      }
    }
  }
}

todos: {
  schema: S.Schema({
    id: S.Id(),
    text: S.String(),
    completed: S.Boolean({ default: false }),

    // Scheduling
    scheduledDate: S.Date({ nullable: true }),
    deadline: S.Date({ nullable: true }),
    somedayFlag: S.Boolean({ default: false }),

    // Ownership & Sharing
    ownerId: S.String(), // BetterAuth user.id
    visibility: S.String({ enum: ['private', 'shared'] }),
    coupleId: S.String({ nullable: true }),

    // Metadata
    priority: S.String({ enum: ['low', 'medium', 'high'], nullable: true }),
    category: S.String({ nullable: true }),
    createdAt: S.Date({ default: S.Default.now() }),
    updatedAt: S.Date({ default: S.Default.now() }),
  }),
  relationships: {
    // Get the couple this todo belongs to (for shared todos)
    couple: S.RelationById('couples', '$coupleId'),
  },
  permissions: {
    authenticated: {
      read: {
        filter: [
          or([
            // Own todos
            ['ownerId', '=', '$token.sub'],
            // Shared todos in couples you're part of
            and([
              ['visibility', '=', 'shared'],
              exists('couples', [
                ['id', '=', '$coupleId'],
                or([
                  ['partner1Id', '=', '$token.sub'],
                  ['partner2Id', '=', '$token.sub']
                ])
              ])
            ])
          ])
        ]
      },
      insert: { filter: [['ownerId', '=', '$token.sub']] },
      update: { filter: [['ownerId', '=', '$token.sub']] },
      delete: { filter: [['ownerId', '=', '$token.sub']] },
    }
  }
}
```

### TanStack Router Timeline State Management

TanStack Router's search params as first-class state perfect for timeline views:

```typescript
// Route: /dashboard?view=today&filter=shared&date=2024-01-15
const dashboardRoute = createFileRoute("/dashboard")({
  validateSearch: z.object({
    view: z.enum(["today", "week", "someday"]).optional(),
    filter: z.enum(["all", "shared", "private"]).optional(),
    date: z.string().datetime().optional(),
  }),
  loaderDeps: ({ search }) => ({
    view: search.view || "today",
    filter: search.filter || "all",
    date: search.date || new Date().toISOString(),
  }),
  loader: ({ deps }) => {
    // Type-safe search params available in loader
    // Can pre-load data based on timeline view
    return {
      initialView: deps.view,
      initialFilter: deps.filter,
      selectedDate: deps.date,
    }
  },
})
```

## Authentication Flow

### BetterAuth + TanStack Start Integration

1. User signs up/in via BetterAuth (server function or API route)
2. BetterAuth returns JWT with `sub: user.id` claim
3. TanStack Start provides JWT to client via loader data
4. Triplit client uses JWT for all server requests
5. Triplit server validates JWT using shared `EXTERNAL_JWT_SECRET`

### TanStack Start Auth Pattern

```typescript
// app/routes/auth.$.tsx - Auth API routes
import { auth } from "~/lib/auth.server"

export async function loader({ request }: LoaderFunctionArgs) {
  return auth.handler(request)
}

export async function action({ request }: ActionFunctionArgs) {
  return auth.handler(request)
}

// app/routes/dashboard.tsx - Protected route with JWT
export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw redirect("/signin")

  const jwt = await auth.api.signJWT({ sub: session.user.id })
  return json({ jwt, user: session.user })
}

export default function Dashboard() {
  const { jwt } = useLoaderData<typeof loader>()

  // Initialize Triplit client with server-provided JWT
  useEffect(() => {
    triliptClient.updateToken(jwt)
  }, [jwt])

  // TanStack Router search params for timeline state
  const navigate = useNavigate()
  const { view, filter } = dashboardRoute.useSearch()

  // Your Triplit queries...
  const todos = triliptClient.useQuery(
    client
      .query("todos")
      .where("ownerId", "=", user.id)
      .where("scheduledDate", "=", getDateForView(view)),
  )
}
```

### Environment Variables

**TanStack Start App:**

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/couples_todo
BETTER_AUTH_SECRET=your-random-secret-key  # For BetterAuth encryption/hashing
BETTER_AUTH_URL=http://localhost:3000
```

**Triplit Server:**

```bash
EXTERNAL_JWT_SECRET='{"keys":[{"alg":"EdDSA","crv":"Ed25519","kty":"OKP","x":"ykNn_046HYDW3pTs_osNblC0geCRYNUpRC82zY2cWS0","kid":"4fDrpGcmzBmkuIvfXZhdVsoqNT1mNUEN"}]}'  # EdDSA public key (JWKS format) extracted from BetterAuth JWKS
LOCAL_DATABASE_URL=/app/data/triplit.db
CORS_ORIGIN=http://localhost:3000
```

## UI/UX Features

### Timeline Views

- **Today** - Tasks scheduled for today + anytime tasks
- **This Week** - Calendar week (Monday-Sunday)
- **Next 7 Days** - Rolling 7-day window
- **Someday** - Intentionally deferred tasks
- **Overdue** - Past deadline, shown in modal with quick actions

### Quick Actions (Mobile-Optimized)

- ✅ Complete
- 📅 Schedule Today
- ⏭️ Schedule Tomorrow
- 📆 Pick Date
- 🔄 Move to Someday
- 🗑️ Delete

### Overdue Management

- Subtle red badge indicator (non-intrusive)
- Modal overlay with batch actions
- No guilt-inducing clutter in main views

### Collaboration Features

- Private todos (only owner sees)
- Shared todos (both partners see/edit)
- Real-time updates
- Partner activity indicators

## Development Phases

### Phase 1: TanStack Start Foundation & Database Setup

**Goal:** Establish TanStack Start project with database and authentication foundation

- [x] Initialize TanStack Start project with TypeScript
- [x] Set up Effect Config for type-safe environment variables
- [x] Set up PostgreSQL database (local development)
- [x] Configure Drizzle ORM with database schema
  - [x] Install Drizzle dependencies (drizzle-orm, drizzle-kit, pg, @types/pg)
  - [x] Create Drizzle configuration file (drizzle.config.ts)
  - [x] Set up database connection using Effect Config
  - [x] Create initial database schema for BetterAuth tables
  - [x] Set up Drizzle migrations system
- [x] Set up BetterAuth with Drizzle adapter
  - [x] Install BetterAuth dependencies (better-auth, nodemailer)
  - [x] Configure BetterAuth with Drizzle adapter and Effect Config
  - [x] Create BetterAuth server configuration
  - [x] Run initial migration to create auth tables
- [x] Create BetterAuth API routes in TanStack Start (`app/routes/auth.$.tsx`)
  - [x] Create auth API route handler
  - [x] Configure BetterAuth request handling
  - [x] Test basic auth endpoints (signup/signin)
- [x] Add health check route for monitoring (`app/routes/health.tsx`)
  - [x] Create health check endpoint
  - [x] Add database connection health check
  - [x] Test health endpoint response

**Completion Criteria:** ✅ **PHASE 1 COMPLETE**

- ✅ TanStack Start dev server running
- ✅ Database connection working
- ✅ BetterAuth can create/authenticate users via Start routes
- ✅ Effect Config validates all required environment variables
- ✅ Basic security headers configured

### Phase 2: Authentication & JWT Integration

**Goal:** Complete authentication flow with JWT issuance for Triplit

- [x] Set up Mailpit for local email testing (Homebrew installation)
- [x] Create email service with retry logic and error handling
- [x] Configure Nodemailer for development (Mailpit) and production (Resend)
- [x] Add email verification and password reset handlers to BetterAuth
- [x] Add JWT plugin to BetterAuth with EdDSA algorithm configuration (Fixed: corrected plugin configuration)
- [x] Configure email and password authentication with email verification
- [x] Run database migration to create `jwks` table and auth tables
- [x] Create auth server configuration for TanStack Start
- [x] Test email flows via Mailpit web UI
- [x] Test JWT token generation via BetterAuth server functions
- [x] Extract EdDSA public key from BetterAuth JWKS endpoint
- [x] Configure Triplit server with extracted public key in EXTERNAL_JWT_SECRET
- [x] Verify JWT compatibility between BetterAuth and Triplit

**Completion Criteria:** ✅ **PHASE 2 COMPLETE**

- ✅ Mailpit running and receiving test emails at localhost:8025
- ✅ Email service handles failures gracefully with error handling
- ✅ Email verification and password reset emails sent reliably
- ✅ BetterAuth generates EdDSA key pairs automatically
- ✅ BetterAuth issues EdDSA JWTs with correct claims (`sub: user.id`)
- ✅ Public key successfully extracted from BetterAuth JWKS
- ✅ Triplit server can validate JWTs using extracted public key
- ✅ End-to-end JWT flow works (auth → JWT → Triplit verification)
- ✅ Email-based authentication flows fully functional in development

**Phase 2 Achievements:**

- BetterAuth configured with PostgreSQL/Drizzle adapter
- JWT plugin working with EdDSA algorithm for enhanced security
- Email service with Mailpit for development testing
- 2 test emails successfully sent and verified in Mailpit web UI
- Public key extracted for Triplit: `{"keys":[{"alg":"EdDSA","crv":"Ed25519","kty":"OKP","x":"ykNn_046HYDW3pTs_osNblC0geCRYNUpRC82zY2cWS0","kid":"4fDrpGcmzBmkuIvfXZhdVsoqNT1mNUEN"}]}`
- All TypeScript compilation clean, linting passed
- Test scripts created for validation (`test-auth.ts`, `test-email.ts`, `extract-public-key.ts`)

### Phase 3: TanStack Router Integration

**Goal:** Set up type-safe routing with search params state management

- [x] Configure TanStack Router file-based routing structure
- [x] Create protected route patterns with BetterAuth session checks
- [x] Set up search params validation for timeline views
- [x] Integrate BetterAuth client with TanStack Start
- [x] Set up Tailwind CSS + basic component structure
- [x] Create basic route loaders that provide JWT to client
- [x] Add route-level error boundaries
- [x] Implement BetterAuth server routes using createServerFileRoute
- [x] Add reactStartCookies plugin for TanStack Start cookie handling
- [x] Fix security vulnerability by removing client-side config validation
- [x] Update TanStack packages to v1.131.26 for server route support
- [x] Test real user registration and authentication with PostgreSQL

**Completion Criteria:** ✅ **PHASE 3 COMPLETE**

- ✅ File-based routing working with TanStack Router
- ✅ User can sign up/in through UI with real authentication
- ✅ Real user creation and session management in PostgreSQL
- ✅ BetterAuth server routes working at `/api/auth/*`
- ✅ Search params state management working for timeline views
- ✅ Route loaders ready to provide JWT to Triplit client
- ✅ Security vulnerability fixed (no client-side env exposure)

**Phase 3 Achievements:**

- Real authentication system with BetterAuth + TanStack Start integration
- Working sign-up and sign-in forms with database persistence
- Server-side authentication routes using createServerFileRoute pattern
- reactStartCookies plugin enabling automatic cookie handling
- Secure configuration with server-side only validation
- Updated TanStack packages providing full server route support
- Foundation ready for email verification completion in Phase 3.5

### ✅ **CRITICAL BUG FIXES COMPLETED (August 2025)**

**Database Connection Churn Issue - RESOLVED**

- **Problem**: Effect-based DatabaseService was creating/destroying connections on every request
- **Root Cause**: Each auth context call and API route created new AppLayer instances with scoped database connections
- **Solution**: Replaced `Layer.scoped` + `Effect.acquireRelease` with global connection pool pattern
- **Impact**: Fixed "Sign in failed" errors, eliminated connection churn logs, stable authentication
- **Files Modified**: `src/server/db/database-service.ts`

**Dual Service Initialization - RESOLVED**

- **Problem**: TanStack Start + Vite runs dual processes (SSR + client), causing duplicate service initialization
- **Solution**: Added global initialization guard to prevent duplicate setup in development
- **Impact**: Clean dev server logs, single database connection pool, no functional impact
- **Files Modified**: `src/server.ts`

**Development Workflow Improvements**

- **Added**: Auto-kill existing dev servers before starting (`bun run dev:clean`)
- **Benefit**: Prevents port conflicts, ensures clean state, common web dev practice
- **Files Modified**: `package.json`

**Status**: ✅ Authentication fully functional (sign-up, sign-in, logout working)

### Phase 3.5: Complete Email Verification System

**Goal:** Phoenix-like email verification experience for development and production

**Background:** Email verification was partially implemented but disabled (`requireEmailVerification: false`). This phase completes the email verification system with a Phoenix web framework-inspired development experience using Mailpit's web UI for local email testing.

**Email Verification Infrastructure:**

- [x] Enable email verification in BetterAuth configuration (`requireEmailVerification: true`)
- [x] Update database schema migration for email verification tables (verification, emailChange) - Already existed
- [x] Create professional email verification templates (HTML + text versions)
- [x] Set up email verification API routes and handlers in TanStack Start

**Development Experience (Phoenix-like):**

- [x] Configure Mailpit integration for seamless dev workflow
- [x] Create email verification UI components (pending, success, error states)
- [x] Add development email debugging tools and logging
- [x] **FIXED**: Implement real database updates for email verification
- [x] Test complete verification flow: signup → Mailpit → verify → signin
- [x] Create production-like verification token generation and storage

**Production Email Service (Deferred to Phase 7):**

- [ ] Set up Resend API integration with proper error handling _(moved to Phase 7)_
- [ ] Configure production email templates with app branding _(moved to Phase 7)_
- [ ] Add production email monitoring, retry logic, and failure alerts _(moved to Phase 7)_
- [ ] Test production email delivery and verification end-to-end _(moved to Phase 7)_

**User Experience Flow:**

- [x] Create `/verify-email/pending` page with resend functionality
- [x] Add `/verify-email/[token]` verification link handler route
- [x] Implement email verification success/error states with proper redirects
- [x] Add email verification status indicators in UI
- [x] Create secure token verification with database updates

**Security & Edge Cases:**

- [x] Implement email verification token expiration (24-hour default)
- [x] Add secure token generation using crypto.randomBytes
- [x] Handle invalid/expired verification links with helpful error messages
- [x] Implement one-time use tokens with database cleanup
- [x] Prevent unverified users from accessing protected routes

**Testing & Validation:**

- [x] Test complete auth flow: signup → verify → signin → dashboard
- [x] Validate email templates render correctly in Mailpit
- [x] Test token expiration and invalid token handling
- [x] Verify security measures prevent bypass of email verification
- [x] Validate database updates for emailVerified field

**Completion Criteria:** ✅ **PHASE 3.5 COMPLETE**

**✅ Core Email Verification System Complete:**

- ✅ **Phoenix-like dev experience**: Mailpit web UI at localhost:8025 shows all emails
- ✅ **Professional email templates**: Beautiful HTML verification emails working
- ✅ **Production-like verification**: Secure token generation with crypto.randomBytes
- ✅ **Database integration**: Real verification token storage and user updates
- ✅ **Complete UI flow**: Verification pages with success/error states working
- ✅ **Security implementation**: Token expiration, one-time use, database cleanup
- ✅ **End-to-end testing**: Full signup → verify → signin flow validated

**🎯 Production Email Service (Deferred to Phase 7):**

- ⏭️ **Resend integration**: Can be implemented when deploying to production
- ⏭️ **Production monitoring**: Email delivery monitoring for production deployment
- ⏭️ **Rate limiting**: Advanced rate limiting for production scale

**Phase 3.5 Achievements:**

- Complete email verification system with production-like security
- Secure 64-character hex tokens generated with crypto.randomBytes(32)
- Database-backed token validation with 24-hour expiration
- Real user.emailVerified database updates working correctly
- One-time use tokens with proper cleanup after verification
- Beautiful HTML email templates with professional styling
- Seamless Mailpit integration for Phoenix-like development experience
- Complete routing with `/verify-email/pending` and `/verify-email/$token`
- Full end-to-end flow: signup → email → verify → database update → signin

**Mailpit Development Workflow:**

```typescript
// Development workflow (Phoenix-inspired)
1. User signs up → Email sent to Mailpit
2. Developer opens http://localhost:8025 in browser
3. Clicks verification link directly from Mailpit UI
4. User gets verified and redirected to dashboard
5. All emails visible in clean web interface with search/filter
```

### Phase 4: Triplit Client Integration

**Goal:** Connect TanStack Start app to Triplit with authenticated users (requires Phase 3.5 completion)

- [ ] Set up Triplit client in TanStack Start
- [ ] Define Triplit schema (todos, couples, profiles)
- [ ] Implement JWT passing from BetterAuth route loaders to Triplit client
- [ ] Test basic CRUD operations with permissions
- [ ] Verify offline functionality
- [ ] _(Optional)_ Add Effect.ts retry logic for sync failures
- [ ] _(Optional)_ Effect-based conflict resolution for simultaneous edits

**Completion Criteria:**

- TanStack Start app connects to Triplit with authenticated user
- Can create/read todos with proper permissions
- Offline sync works as expected
- Search params state persists through navigation

**Effect.ts Enhancement Opportunities:**

- **Sync Error Recovery**: Effect pipelines for handling network failures with exponential backoff
- **Conflict Resolution**: Effect state machines for handling simultaneous edits by partners
- **Resource Management**: Effect-managed connection pooling and cleanup

### Phase 5: Core Todo Features & Testing

**Goal:** Complete todo management functionality with test coverage

- [ ] Implement todo CRUD operations with pure functions
- [ ] Build timeline views (Today, Week, Someday) using search params state
- [ ] Add task scheduling UI (scheduled date, deadline)
- [ ] Create quick actions component
- [ ] Mobile-responsive design
- [ ] Basic error handling and loading states
- [ ] Set up Bun test runner for server logic and pure functions
- [ ] Write tests for todo business logic (creation, scheduling, completion)
- [ ] Write tests for auth server functions and email service
- [ ] Write integration tests for Triplit operations
- [ ] _(Optional)_ Effect.ts for batch operations and optimistic updates
- [ ] _(Optional)_ Effect-based undo/redo functionality

**Completion Criteria:**

- Users can manage todos completely
- Timeline views work correctly with URL state
- Mobile experience is usable
- Core business logic covered by Bun tests
- Server functions tested and passing
- Effect email service tested with mock scenarios

**Effect.ts Enhancement Opportunities:**

- **Batch Operations**: Effect pipelines for "mark all complete" with partial failure handling
- **Optimistic Updates**: Effect-managed rollback for failed operations
- **Advanced Scheduling**: Effect.DateTime for complex recurring tasks and timezone handling

### Phase 6: Couples Collaboration

**Goal:** Enable couples to link and share todos

- [ ] Implement couples linking flow using TanStack Start server functions
- [ ] Build invite system with codes
- [ ] Add shared todo functionality
- [ ] Test real-time collaboration
- [ ] Implement permission-based filtering
- [ ] _(Optional)_ Effect.ts workflow for invite process
- [ ] _(Optional)_ Effect-based permission state management

**Completion Criteria:**

- Two users can link as a couple
- Shared todos work correctly
- Real-time updates between partners
- Invite flow works end-to-end

**Effect.ts Enhancement Opportunities:**

- **Invite Workflow**: Effect state machine for multi-step process (create → send → validate → link → notify)
- **Permission Management**: Effect services for complex sharing rules and validation
- **Real-time Coordination**: Effect-managed WebSocket connections with automatic reconnection

### Phase 7: Polish & Deployment

**Goal:** Production-ready TanStack Start application

**Core Requirements:**

- [ ] Overdue management modal
- [ ] Enhanced error handling with user-friendly messages
- [ ] Basic loading states (spinners, disabled buttons)
- [ ] Build TanStack Start for production
- [ ] Deploy to Coolify with Node.js adapter
- [ ] Configure production email service (Resend)
- [ ] Environment variable management for production

**UI Polish:**

- [ ] Fix landing page authentication state: hide "Sign in" link when user is already authenticated
- [ ] Consistent authentication state across all pages (header shows "Sign out" but landing shows "Sign in")
- [ ] Polish navigation states and conditional rendering based on auth status

**Optional Enhancements (Can Add Later):**

- [ ] Set up Effect Logger for structured logging
- [ ] Add error tracking (Sentry or similar)
- [ ] Configure OpenTelemetry tracing for production insights
- [ ] Skeleton UI components
- [ ] Set up CI/CD pipeline from GitHub
- [ ] _(Optional)_ Effect.ts notification system
- [ ] _(Optional)_ Effect-based background sync optimization

**Completion Criteria (Core App Working):**

- App is polished and user-friendly
- Successfully deployed and accessible
- Production email service operational
- Users can create accounts, manage todos, and collaborate as couples
- All core features working in production

**Optional Completion (Production Polish):**

- Structured logging in production
- Error tracking capturing issues
- Automated deployments
- Advanced UI polish

## Deployment Strategy

### TanStack Start Deployment

**TanStack Start Build:**

- Uses Vite for optimized production builds
- Automatic code splitting and SSR
- Outputs Node.js-compatible server

**Coolify Deployment:**

```bash
# Build command
bun run build

# Start command
bun run start

# Environment variables
NODE_ENV=production
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
RESEND_API_KEY=...
```

### Coolify Service Configuration

**Two Services in Coolify:**

1. **PostgreSQL Database** (Coolify's built-in PostgreSQL service)
2. **TanStack Start App** (Node.js server with SSR + client)
3. **Triplit Server** (Separate container for data sync)

## Email Strategy

### Email Architecture

**Development**: Mailpit (local SMTP server with web UI)
**Production**: Resend (modern email API with excellent deliverability)
**Client Library**: Nodemailer (universal, well-documented, excellent LLM training data)

### TanStack Start Email Integration

```typescript
// app/lib/email.server.ts
import { Effect } from "effect"

export const sendEmailWithRetry = Effect.gen(function* () {
  const email = yield* validateEmailData

  yield* Effect.retry(
    Effect.tryPromise(() => emailService.send(email)),
    Schedule.exponential(1000, 2).pipe(
      Schedule.take(3),
      Schedule.whileInput((error) => error.code === "RATE_LIMIT"),
    ),
  )

  yield* logEmailSent(email.id)
})

// Used in server functions or API routes
export async function sendCoupleInvite(inviteData: InviteData) {
  return Effect.runPromise(sendEmailWithRetry)
}
```

## Technology Simplifications

### What Gets Removed:

- **Hono Server** - TanStack Start handles serving and SSR
- **Vite Configuration** - Built into TanStack Start
- **Manual SPA + Server coordination** - Start handles SSR/hydration
- **Custom build setup** - Start provides optimized builds

### What Stays the Same:

- **BetterAuth** - Integrates as server functions/API routes
- **Triplit** - Client-side data layer works identically
- **PostgreSQL + Drizzle** - Authentication database unchanged
- **Email service** - Same Mailpit/Resend setup
- **All frontend patterns** - React, Tailwind, TypeScript

## File Structure

```
couples-todo-app/
├── app/                         # TanStack Start app directory
│   ├── routes/                  # File-based routing
│   │   ├── auth.$.tsx          # BetterAuth API routes
│   │   ├── dashboard.tsx       # Main dashboard with timeline
│   │   ├── signin.tsx          # Sign in page
│   │   └── signup.tsx          # Sign up page
│   ├── lib/                    # Utilities
│   │   ├── auth.server.ts      # BetterAuth server setup
│   │   ├── auth.client.ts      # BetterAuth client
│   │   ├── triplit.client.ts   # Triplit client setup
│   │   └── email.server.ts     # Effect email service
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   └── features/           # Feature-specific components
│   ├── styles/                 # Tailwind + custom CSS
│   └── root.tsx                # Root component
├── triplit/                    # Triplit configuration
│   ├── schema.ts               # Triplit data schema
│   └── server.ts               # Triplit server setup
├── server/                     # Database setup
│   └── db/                     # Drizzle schema + migrations
├── drizzle.config.ts           # Drizzle configuration
└── package.json
```

## Key Benefits of TanStack Start

1. **Simplified Architecture**: No separate SPA + server coordination
2. **Built-in SSR**: Better SEO and initial page load
3. **Type-safe routing**: TanStack Router's excellent search params state
4. **Server functions**: Type-safe server-side operations
5. **Optimal builds**: Vite-powered with automatic optimizations
6. **Progressive enhancement**: Forms work without JS, then enhance

## Implementation Notes

### Critical Integration Points:

1. **BetterAuth → TanStack Start**: Mount as API routes and server functions
2. **JWT Flow**: Server-side session → JWT → client-side Triplit
3. **Timeline State**: TanStack Router search params for URL-driven timeline views
4. **Effect Email**: Server-side email reliability with retry logic

### Development Workflow:

- **Pure functions first** - Business logic separate from framework code
- **Test server functions** - Use Bun test for server logic
- **Effect only where valuable** - Config, email reliability, observability
- **Incremental complexity** - Each phase builds on TanStack Start foundation

## Ready for Implementation

This TanStack Start approach provides:

- ✅ **Simplified stack** - Eliminates Hono server complexity
- ✅ **Better DX** - Built-in SSR, routing, and build optimization
- ✅ **Type safety** - Full-stack type safety with server functions
- ✅ **URL-driven state** - TanStack Router's search params for timeline views
- ✅ **Same offline capabilities** - Triplit client works identically
- ✅ **Production ready** - Built for deployment to any Node.js environment

Start with **Phase 1** to establish the TanStack Start foundation!
