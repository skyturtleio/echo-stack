# Zero Integration Guide

This guide shows how to integrate your Echo Stack application with [Zero](https://zero.rocicorp.dev) using JWT authentication.

## Overview

Zero supports JWKS URLs directly, making integration with Echo Stack very straightforward. Your Echo Stack app provides a `/api/auth/jwks` endpoint that Zero can use to automatically verify JWT tokens.

## Prerequisites

- Echo Stack application running with authentication configured
- Zero server (self-hosted)
- JWT tokens configured in your Echo Stack app

## Quick Start

### 1. Configure Zero Server

Zero can directly use your Echo Stack's JWKS endpoint:

```bash
# Zero server environment variables
ZERO_AUTH_JWKS_URL=https://your-echo-stack-app.com/api/auth/jwks

# Alternative: Use symmetric key (not recommended for production)
# ZERO_AUTH_SECRET=your-jwt-secret-here

# Alternative: Use JWK format (if you prefer manual configuration)
# ZERO_AUTH_JWK='{"kty":"OKP","crv":"Ed25519","x":"..."}'
```

### 2. Client-Side Integration

#### Basic Setup

```typescript
import { Zero } from "@rocicorp/zero"
import { getAuthContext } from "~/lib/auth-context-effect"

// Get auth context from Echo Stack
const authContext = await getAuthContext(request)

// Initialize Zero client
const zero = new Zero({
  serverUrl: "https://your-zero-server.com",
  auth: authContext.jwt, // Direct JWT token
  userID: authContext.user?.id || "anon",
  logLevel: "debug", // helpful during development
})
```

#### With Token Refresh

```typescript
import { Zero } from "@rocicorp/zero"

// Initialize Zero with auth function for automatic token refresh
const zero = new Zero({
  serverUrl: "https://your-zero-server.com",
  auth: async () => {
    // Fetch fresh token from Echo Stack
    const response = await fetch("/api/auth/session", {
      credentials: "include", // Include cookies for session
    })

    if (!response.ok) {
      throw new Error("Failed to get auth token")
    }

    const authData = await response.json()
    return authData.jwt
  },
  userID: "user-123", // Your user ID
})
```

#### React Hook Integration

```typescript
import { useEffect, useState } from 'react'
import { Zero } from '@rocicorp/zero'

function useZeroAuth() {
  const [zero, setZero] = useState<Zero | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const initZero = async () => {
      try {
        // Get initial auth state
        const response = await fetch('/api/auth/session')
        const authData = await response.json()

        if (!authData.user || !authData.jwt) {
          console.log('User not authenticated')
          return
        }

        // Initialize Zero
        const zeroClient = new Zero({
          serverUrl: 'https://your-zero-server.com',
          auth: async () => {
            // Refresh token function
            const refreshResponse = await fetch('/api/auth/session')
            const refreshData = await refreshResponse.json()
            return refreshData.jwt
          },
          userID: authData.user.id,
        })

        setZero(zeroClient)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Failed to initialize Zero:', error)
      }
    }

    initZero()
  }, [])

  return { zero, isAuthenticated }
}

// Usage in component
function MyComponent() {
  const { zero, isAuthenticated } = useZeroAuth()

  if (!zero || !isAuthenticated) {
    return <div>Loading...</div>
  }

  // Use zero for queries
  const [todos] = zero.query.todos.findAll()

  return (
    <div>
      <h1>My Todos</h1>
      {todos.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  )
}
```

### 3. Schema Configuration

Configure your Zero schema with permissions that reference JWT claims:

```typescript
// zero-schema.ts
import { createSchema, definePermissions } from "@rocicorp/zero"

const schema = createSchema({
  tables: {
    todos: {
      columns: {
        id: { type: "string" },
        title: { type: "string" },
        completed: { type: "boolean" },
        userId: { type: "string" }, // Links to JWT sub claim
        createdAt: { type: "timestamp" },
      },
      primaryKey: "id",
    },
  },
})

// Define permissions using JWT claims
const permissions = definePermissions(schema, () => {
  const isOwner = (authData: any, { cmp }: any) =>
    cmp(authData.sub, "=", "userId")

  const isAuthenticated = (authData: any) => authData.sub !== null

  return {
    todos: {
      // Only authenticated users can read
      read: isAuthenticated,

      // Users can only insert todos with their own userId
      insert: {
        check: isAuthenticated,
        set: {
          userId: (authData: any) => authData.sub, // Auto-set from JWT
        },
      },

      // Users can only update their own todos
      update: isOwner,

      // Users can only delete their own todos
      delete: isOwner,
    },
  }
})

export { schema, permissions }
```

### 4. Using JWT Claims

The JWT from Echo Stack contains these claims that you can use in permissions:

```javascript
// JWT structure from Echo Stack:
{
  "sub": "user-123",           // User ID (primary identifier)
  "userId": "user-123",        // Same as sub
  "email": "user@example.com", // User email
  "iss": "your-app-name",      // Issuer (your Echo Stack app)
  "iat": 1234567890,           // Issued at timestamp
  "exp": 1234567890            // Expires at timestamp
}

// Example permission using email
const isAdminUser = (authData, { cmp }) =>
  cmp(authData.email, '=', 'admin@yourapp.com')

// Example permission using custom claims (if you add them)
const belongsToOrg = (authData, { cmp }) =>
  cmp(authData.organizationId, '=', 'organizationId')
```

## Environment Variables

### Echo Stack App (.env)

```bash
# Required for JWT generation
BETTER_AUTH_SECRET=your-32-character-secret-here
BETTER_AUTH_URL=https://your-app.com  # Must be accessible by Zero server
JWT_SECRET=your-jwt-secret-here
JWT_ISSUER=your-app-name
```

### Zero Server (.env)

```bash
# Recommended: Use JWKS URL (automatic key rotation support)
ZERO_AUTH_JWKS_URL=https://your-echo-stack-app.com/api/auth/jwks

# Alternative: Manual JWK configuration (get from /api/auth/jwks)
# ZERO_AUTH_JWK='{"kty":"OKP","crv":"Ed25519","x":"base64url-encoded-key","use":"sig","alg":"EdDSA"}'

# Alternative: Symmetric secret (less secure, not recommended)
# ZERO_AUTH_SECRET=your-jwt-secret-here

# Optional: Custom claims path for nested JWT claims
# ZERO_AUTH_CLAIMS_PATH=custom.claims.path

# Zero server configuration
ZERO_PORT=4848
ZERO_HOST=0.0.0.0
```

## Deployment Considerations

### Development

```bash
# 1. Start Echo Stack
bun run dev

# 2. Start Zero server with JWKS URL pointing to localhost
ZERO_AUTH_JWKS_URL=http://localhost:3000/api/auth/jwks zero-server start

# 3. Test authentication flow
```

### Production

```bash
# 1. Deploy Echo Stack to production
# 2. Configure Zero server with production JWKS URL
ZERO_AUTH_JWKS_URL=https://your-production-app.com/api/auth/jwks

# 3. Ensure Zero server can reach Echo Stack
# 4. Test with production URLs
```

### Docker Compose Example

```yaml
# docker-compose.yml
version: "3.8"

services:
  echo-stack:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - BETTER_AUTH_URL=https://your-app.com
      # ... other Echo Stack env vars

  zero-server:
    image: rocicorp/zero-server:latest
    ports:
      - "4848:4848"
    environment:
      - ZERO_AUTH_JWKS_URL=http://echo-stack:3000/api/auth/jwks
      - ZERO_PORT=4848
    depends_on:
      - echo-stack
```

## Data Storage Options

Zero provides flexible client-side storage options:

```typescript
import { createReplicacheReactNativeOPSQLiteKVStore } from "@replicache/react-native-opsqlite"

// Default: IndexedDB (web browsers)
const zero = new Zero({
  serverUrl: "https://your-zero-server.com",
  auth: token,
  userID: "user-123",
  // Uses IndexedDB by default
})

// React Native: SQLite
const zero = new Zero({
  serverUrl: "https://your-zero-server.com",
  auth: token,
  userID: "user-123",
  kvStore: createReplicacheReactNativeOPSQLiteKVStore,
})

// In-memory (testing/temporary)
const zero = new Zero({
  serverUrl: "https://your-zero-server.com",
  auth: token,
  userID: "user-123",
  kvStore: "mem",
})

// Custom storage key for multiple apps per domain
const zero = new Zero({
  serverUrl: "https://your-zero-server.com",
  auth: token,
  userID: "user-123",
  storageKey: "my-app-v2", // Useful for app versioning
})
```

## User Management

### Handling Multiple Users

```typescript
// Switch between users (each gets their own database)
const createZeroForUser = (userId: string) => {
  return new Zero({
    serverUrl: "https://your-zero-server.com",
    auth: async () => {
      // Get token for specific user
      const response = await fetch(`/api/auth/user/${userId}/token`)
      const { jwt } = await response.json()
      return jwt
    },
    userID: userId,
  })
}

// Usage
const aliceZero = createZeroForUser("user-alice")
const bobZero = createZeroForUser("user-bob")
```

### Logout and Data Cleanup

```typescript
import { dropAllDatabases } from "@rocicorp/zero"

const handleLogout = async () => {
  try {
    // Close Zero connection
    await zero.close()

    // Optional: Clear all local data
    const { dropped, errors } = await dropAllDatabases()

    console.log("Dropped databases:", dropped)
    if (errors.length > 0) {
      console.error("Errors dropping databases:", errors)
    }

    // Redirect to login
    window.location.href = "/sign-in"
  } catch (error) {
    console.error("Logout failed:", error)
  }
}
```

## Troubleshooting

### Common Issues

1. **JWT Verification Failed**
   - Check that `ZERO_AUTH_JWKS_URL` is correct and accessible
   - Verify Echo Stack `/api/auth/jwks` endpoint is working
   - Ensure network connectivity between Zero server and Echo Stack

2. **User ID Mismatch**
   - Ensure `userID` in Zero client matches JWT `sub` claim
   - Check that JWT is being generated with correct user ID

3. **Permission Denied**
   - Verify schema permissions are configured correctly
   - Check JWT claims match permission logic
   - Use Zero's debug logging to see permission evaluation

### Debug Commands

```bash
# Test JWKS endpoint
curl https://your-app.com/api/auth/jwks

# Test JWT decoding
echo "your.jwt.token" | base64 -d

# Check Zero server logs
docker logs zero-server

# Test Zero client connection
zero-cli test-connection --server-url https://your-zero-server.com
```

### Validation Checklist

- [ ] Echo Stack running and `/api/auth/jwks` accessible
- [ ] Zero server configured with correct JWKS URL
- [ ] JWT tokens being generated by Echo Stack
- [ ] Zero schema and permissions configured
- [ ] Client userID matches JWT sub claim
- [ ] Network connectivity between services
- [ ] Authentication flow works end-to-end

## Advanced Features

### Custom JWT Claims

Add custom claims to your Echo Stack JWT:

```typescript
// In your Echo Stack auth service
const customJWT = await authService.signJWT({
  sub: user.id,
  userId: user.id,
  email: user.email,
  // Custom claims for Zero permissions
  role: user.role,
  organizationId: user.organizationId,
  permissions: user.permissions,
})
```

Use in Zero permissions:

```typescript
const permissions = definePermissions(schema, () => {
  const isAdmin = (authData: any) => authData.role === "admin"

  const belongsToOrg = (authData: any, { cmp }: any) =>
    cmp(authData.organizationId, "=", "organizationId")

  return {
    todos: {
      read: belongsToOrg,
      write: isAdmin,
    },
  }
})
```

### Real-time Collaboration

Zero provides built-in real-time sync:

```typescript
// All clients with access to the same data automatically sync
const [todos] = zero.query.todos.findAll()

// Changes are automatically synced across all connected clients
await zero.mutate.todos.insert({
  id: generateId(),
  title: "New todo",
  completed: false,
  userId: currentUser.id,
})
```

### Offline Support

Zero works offline by default:

```typescript
// Works offline - changes queued until connection restored
await zero.mutate.todos.update({
  id: "todo-1",
  completed: true,
})

// Listen for online/offline status
zero.addEventListener("sync", (event) => {
  if (event.type === "complete") {
    console.log("Synced with server")
  }
})
```

## Next Steps

1. Set up Zero server with your Echo Stack JWKS URL
2. Configure Zero schema with appropriate permissions
3. Implement client-side authentication flow with token refresh
4. Test real-time sync and offline functionality
5. Deploy to production with proper environment variables

For more details, see:

- [Zero Documentation](https://zero.rocicorp.dev)
- [Echo Stack Auth Service](../lib/auth-service.ts)
- [Integration Examples](../examples/)
