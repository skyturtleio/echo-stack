# Triplit Integration Guide

This guide shows how to integrate your Echo Stack application with [Triplit](https://triplit.dev) using JWT authentication.

## Overview

Echo Stack provides JWT tokens that Triplit can verify using Ed25519 public keys. This enables secure user authentication and authorization for your Triplit collections.

## Prerequisites

- Echo Stack application running with authentication configured
- Triplit server (self-hosted or Triplit Cloud)
- JWT tokens configured in your Echo Stack app

## Quick Start

### 1. Extract Public Key

Echo Stack provides a utility to extract the public key in PEM format:

```bash
# For development (uses http://localhost:3000)
bun run extract:pem

# For production (uses your BETTER_AUTH_URL from .env)
NODE_ENV=production bun run extract:pem

# For custom URL
bun run extract:pem https://your-production-domain.com
```

This will output a PEM-formatted public key that looks like:

```
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA...
-----END PUBLIC KEY-----
```

### 2. Configure Triplit Server

#### For Self-Hosted Triplit

Set the `EXTERNAL_JWT_SECRET` environment variable:

```bash
# Method 1: Direct PEM content (escape newlines)
EXTERNAL_JWT_SECRET='-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA...\n-----END PUBLIC KEY-----'

# Method 2: Reference PEM file
EXTERNAL_JWT_SECRET_FILE=/path/to/your/public-key.pem

# Method 3: Inline environment variable (recommended for Docker)
export EXTERNAL_JWT_SECRET="-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA...
-----END PUBLIC KEY-----"
```

#### For Triplit Cloud

1. Go to your [Triplit Dashboard](https://www.triplit.dev/dashboard)
2. Navigate to your project settings
3. Under "Authentication", add your PEM public key
4. Save the configuration

### 3. Client-Side Integration

#### Basic Setup

```typescript
import { TriplitClient } from "@triplit/client"
import { getAuthContext } from "~/lib/auth-context-effect"

// Initialize Triplit client
const client = new TriplitClient({
  serverUrl: "https://your-project-id.triplit.io", // or your self-hosted URL
  logLevel: "debug", // helpful during development
})

// Get auth context from Echo Stack
const authContext = await getAuthContext(request)

// Start session with JWT if user is authenticated
if (authContext.jwt && authContext.user) {
  await client.startSession(authContext.jwt)
}
```

#### React Integration Example

```typescript
import { useEffect, useState } from 'react'
import { TriplitClient } from '@triplit/client'

function useTriplitAuth() {
  const [client, setClient] = useState<TriplitClient | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const initTriplit = async () => {
      const triplitClient = new TriplitClient({
        serverUrl: 'https://your-project-id.triplit.io',
      })

      // Get JWT from your Echo Stack auth system
      const response = await fetch('/api/auth/session')
      const authData = await response.json()

      if (authData.jwt) {
        await triplitClient.startSession(authData.jwt)
        setIsAuthenticated(true)
      }

      setClient(triplitClient)
    }

    initTriplit()
  }, [])

  return { client, isAuthenticated }
}

// Usage in component
function MyComponent() {
  const { client, isAuthenticated } = useTriplitAuth()

  if (!client || !isAuthenticated) {
    return <div>Loading...</div>
  }

  // Use client for queries
  return <div>Authenticated with Triplit!</div>
}
```

### 4. Schema Configuration

Configure your Triplit schema with permissions that reference JWT claims:

```typescript
// triplit/schema.ts
import { Schema as S } from "@triplit/client"

export const schema = S.Collections({
  posts: {
    schema: S.Schema({
      id: S.Id(),
      title: S.String(),
      content: S.String(),
      authorId: S.String(),
      createdAt: S.Date({ default: S.Default.now() }),
    }),
    permissions: {
      authenticated: {
        // Anyone can read posts
        read: { filter: [true] },

        // Users can only create posts with their own ID
        insert: { filter: ["authorId", "=", "$token.sub"] },

        // Users can only update their own posts
        update: { filter: ["authorId", "=", "$token.sub"] },
        postUpdate: { filter: ["authorId", "=", "$token.sub"] },

        // Users can only delete their own posts
        delete: { filter: ["authorId", "=", "$token.sub"] },
      },
    },
  },
})
```

### 5. Using JWT Claims in Queries

When inserting data, use the JWT claims from Echo Stack:

```typescript
// The JWT contains these claims from Echo Stack:
// {
//   "sub": "user-123",           // User ID
//   "userId": "user-123",        // Same as sub
//   "email": "user@example.com", // User email
//   "iss": "your-app-name",      // Issuer (your app)
//   "iat": 1234567890,           // Issued at
//   "exp": 1234567890            // Expires at
// }

// Insert a post with the authenticated user as author
await client.insert("posts", {
  title: "My First Post",
  content: "Hello, Triplit!",
  authorId: client.vars.$token.sub, // References the user ID from JWT
})
```

## Environment Variables

### Echo Stack App (.env)

```bash
# Required for JWT generation
BETTER_AUTH_SECRET=your-32-character-secret-here
BETTER_AUTH_URL=https://your-app.com  # Used by extract:pem script
JWT_SECRET=your-jwt-secret-here
JWT_ISSUER=your-app-name
```

### Triplit Server (.env)

```bash
# Required for JWT verification
EXTERNAL_JWT_SECRET='-----BEGIN PUBLIC KEY-----\nYOUR_PEM_KEY_HERE\n-----END PUBLIC KEY-----'

# Optional: Custom JWT claims path (if you use nested claims)
# CLAIMS_PATH=custom.claims.path

# Optional: Verbose logging for debugging
# VERBOSE_LOGS=true
```

## Deployment Considerations

### Development

1. Start Echo Stack: `bun run dev`
2. Extract PEM key: `bun run extract:pem`
3. Configure Triplit with the extracted PEM
4. Test authentication flow

### Production

1. Deploy Echo Stack to production
2. Extract PEM from production: `bun run extract:pem https://your-app.com`
3. Configure Triplit server with production PEM key
4. Ensure Triplit server can reach Echo Stack for JWKS validation
5. Test with production URLs

### Docker Example

```dockerfile
# Triplit server Dockerfile
FROM node:18
WORKDIR /app

# Copy your app
COPY . .

# Set environment variables
ENV EXTERNAL_JWT_SECRET="-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA...\n-----END PUBLIC KEY-----"
ENV LOCAL_DATABASE_URL="/data/triplit.db"

# Create data directory
RUN mkdir -p /data

EXPOSE 8080

CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **JWT Verification Failed**
   - Ensure PEM key matches your Echo Stack's public key
   - Check that `EXTERNAL_JWT_SECRET` is properly formatted
   - Verify JWT issuer matches your configuration

2. **Connection Issues**
   - Ensure Triplit server can reach Echo Stack
   - Check network connectivity between services
   - Verify URLs and ports

3. **Permission Denied**
   - Check your schema permissions configuration
   - Ensure JWT claims match your permission filters
   - Use `logLevel: 'debug'` to see detailed errors

### Debug Commands

```bash
# Test JWT decoding (install jwt-cli: npm install -g @tsndr/jwt-cli)
jwt decode "your.jwt.token.here"

# Test PEM key extraction
bun run extract:pem --verbose

# Check Triplit logs
docker logs triplit-server

# Test JWKS endpoint
curl https://your-app.com/api/auth/jwks
```

### Validation Checklist

- [ ] Echo Stack running and accessible
- [ ] PEM key extracted and configured in Triplit
- [ ] JWT tokens being generated by Echo Stack
- [ ] Triplit schema permissions configured
- [ ] Client successfully connects to Triplit
- [ ] Authentication flow works end-to-end

## Advanced Configuration

### Custom Claims

If you need custom JWT claims beyond the standard Echo Stack claims:

```typescript
// In your Echo Stack auth service
const customJWT = await authService.signJWT({
  sub: user.id,
  userId: user.id,
  email: user.email,
  // Add custom claims
  role: user.role,
  organizationId: user.organizationId,
})
```

Then reference in Triplit schema:

```typescript
permissions: {
  authenticated: {
    read: { filter: ['organizationId', '=', '$token.organizationId'] },
  },
}
```

### Token Refresh

Handle token expiration in your client:

```typescript
const handleTokenRefresh = async () => {
  try {
    const response = await fetch("/api/auth/refresh")
    const { jwt } = await response.json()

    if (jwt) {
      await client.endSession()
      await client.startSession(jwt)
    }
  } catch (error) {
    console.error("Token refresh failed:", error)
    // Redirect to login
  }
}
```

## Next Steps

1. Set up your Triplit schema with appropriate permissions
2. Implement client-side authentication flow
3. Test with real data and user scenarios
4. Deploy to production with proper environment variables
5. Monitor authentication and authorization in production

For more details, see:

- [Triplit Authentication Docs](https://www.triplit.dev/docs/auth)
- [Echo Stack Auth Service](../lib/auth-service.ts)
- [JWT Integration Examples](../examples/)
