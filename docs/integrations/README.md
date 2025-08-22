# Database Integration Guides

This directory contains comprehensive guides for integrating your Echo Stack application with popular sync databases.

## Available Integrations

### [Triplit Integration](./triplit.md)

Real-time database with local-first architecture. Requires PEM-format public key for JWT verification.

**Quick Start:**

```bash
# Extract PEM key for Triplit
bun run extract:pem

# Configure Triplit server
EXTERNAL_JWT_SECRET='-----BEGIN PUBLIC KEY-----\n...'
```

### [Zero Integration](./zero.md)

Real-time sync database with offline-first design. Supports JWKS URLs for automatic JWT verification.

**Quick Start:**

```bash
# Configure Zero server with JWKS URL
ZERO_AUTH_JWKS_URL=https://your-app.com/api/auth/jwks
```

## Echo Stack JWT Structure

Your JWT tokens contain these claims:

```json
{
  "sub": "user-123", // User ID (primary)
  "userId": "user-123", // Same as sub
  "email": "user@example.com", // User email
  "iss": "your-app-name", // App issuer
  "iat": 1234567890, // Issued at
  "exp": 1234567890 // Expires at
}
```

## Key Differences

| Feature              | Triplit                                                     | Zero                                                        |
| -------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| **JWT Verification** | PEM public key                                              | JWKS URL (recommended)                                      |
| **Key Management**   | Manual PEM extraction                                       | Automatic from JWKS                                         |
| **Production Setup** | Extract PEM with `bun run extract:pem https://prod-url.com` | Set `ZERO_AUTH_JWKS_URL=https://prod-url.com/api/auth/jwks` |
| **Client Storage**   | Built-in SQLite                                             | IndexedDB, SQLite, Memory                                   |
| **Schema Language**  | TypeScript with filters                                     | SQL-like with permissions                                   |

## Environment Variables Reference

### Echo Stack (.env)

```bash
BETTER_AUTH_URL=https://your-app.com  # Used for PEM extraction
JWT_SECRET=your-jwt-secret
JWT_ISSUER=your-app-name
```

### Triplit Server (.env)

```bash
EXTERNAL_JWT_SECRET='-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'
```

### Zero Server (.env)

```bash
ZERO_AUTH_JWKS_URL=https://your-app.com/api/auth/jwks
```

## Quick Commands

```bash
# Extract PEM for Triplit (development)
bun run extract:pem

# Extract PEM for Triplit (production)
bun run extract:pem https://your-production-domain.com

# Test JWKS endpoint for Zero
curl https://your-app.com/api/auth/jwks

# Validate JWT token
echo "jwt.token.here" | base64 -d
```

## Next Steps

1. Choose your sync database (Triplit or Zero)
2. Follow the specific integration guide
3. Configure authentication in your client app
4. Set up permissions in your database schema
5. Test the complete authentication flow
6. Deploy with production environment variables

For detailed setup instructions, see the individual integration guides.
