# 🚀 Echo Stack Deployment - Combat Deployment Guide

> **"Mission-Ready Production Deployment"**  
> Complete guide to deploying Echo Stack applications to production with enterprise-grade security and reliability.

## Pre-Deployment Checklist ✅

Before deploying to production, ensure your application is combat-ready:

```bash
# 1. Run all tests
bun run test
bun run test:integration

# 2. Validate production configuration
NODE_ENV=production bun run config:validate

# 3. Check code quality
bun run lint
bun run format
bun run check

# 4. Build for production
bun run build

# 5. Test production build locally
bun run start
```

## Environment Configuration 🔧

### Production Environment Variables

Echo Stack requires specific configuration for production deployment. Copy and configure these variables:

```env
# === ENVIRONMENT ===
NODE_ENV=production

# === DATABASE (Choose one approach) ===

# Option 1: Phoenix-style auto-naming (Recommended)
DATABASE_BASE_URL=postgresql://user:password@host:5432/
# Results in database name: your_project_name

# Option 2: Explicit database URL
DATABASE_URL=postgresql://user:password@host:5432/your_database_name

# === AUTHENTICATION (Required) ===
BETTER_AUTH_URL=https://api.yourdomain.com
BETTER_AUTH_SECRET=your-32-character-minimum-cryptographically-secure-secret-here
JWT_SECRET=your-jwt-secret-for-integrations-32-chars-minimum

# === EMAIL (Required) ===
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=hello@yourdomain.com
RESEND_FROM_NAME=Your App Name

# === SECURITY (Required) ===
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# === LOGGING ===
LOG_LEVEL=info
LOG_FORMAT=json
LOG_COLORS=false
LOG_TIMESTAMP=true

# === RATE LIMITING ===
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Requirements

Echo Stack automatically validates production configuration and will **refuse to start** with insecure settings:

#### ❌ These Will Fail in Production:

```env
# Weak secrets (< 32 characters)
BETTER_AUTH_SECRET=weak123

# Localhost URLs
BETTER_AUTH_URL=http://localhost:3000

# HTTP URLs (must be HTTPS)
BETTER_AUTH_URL=http://api.yourdomain.com

# Placeholder emails
RESEND_FROM_EMAIL=hello@yourdomain.com

# Missing CORS origins
CORS_ALLOWED_ORIGINS=
```

#### ✅ Production-Ready Configuration:

```env
# Strong secrets (32+ characters)
BETTER_AUTH_SECRET=super-long-cryptographically-secure-string-32chars+

# HTTPS URLs only
BETTER_AUTH_URL=https://api.yourdomain.com

# Real domain email
RESEND_FROM_EMAIL=hello@myapp.com

# Explicit CORS origins
CORS_ALLOWED_ORIGINS=https://myapp.com,https://app.myapp.com
```

## Database Setup 🗄️

### PostgreSQL Requirements

- **PostgreSQL 14+** (recommended)
- **Connection pooling** enabled
- **SSL/TLS** enabled for production
- **Automated backups** configured

### Database Deployment Steps

1. **Create Production Database:**

```bash
# If using Phoenix-style naming, Echo Stack will auto-create
# Database name will be your package.json name (e.g., my_app)

# If using explicit DATABASE_URL, create manually:
createdb your_production_database
```

2. **Run Migrations:**

```bash
# Set production environment
export NODE_ENV=production

# Apply all migrations
bun run db:setup
```

3. **Verify Database Health:**

```bash
bun run db:health
```

### Database Connection Recommendations

**Development:**

```env
# Local PostgreSQL
DATABASE_BASE_URL=postgresql://user:password@localhost:5432/
```

**Production Options:**

```env
# Managed PostgreSQL (recommended)
DATABASE_URL=postgresql://user:password@your-db-host.com:5432/dbname?sslmode=require

# Railway
DATABASE_URL=postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway?sslmode=require

# Supabase
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres?sslmode=require

# Neon
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Deployment Platforms 🌐

### Railway (Recommended for Beginners)

Railway provides the simplest deployment experience with excellent PostgreSQL integration:

1. **Connect Repository:**
   - Push your code to GitHub
   - Connect repository in Railway dashboard
   - Railway auto-detects Bun and PostgreSQL

2. **Add PostgreSQL Service:**

   ```bash
   # Railway automatically provides DATABASE_URL
   # Add other environment variables in Railway dashboard
   ```

3. **Configure Environment:**
   - Add all production environment variables
   - Railway automatically handles SSL and connection pooling

4. **Deploy:**
   ```bash
   git push origin main
   # Railway auto-deploys on push
   ```

**Railway Configuration:**

- **Build Command:** `bun run build`
- **Start Command:** `bun run start`
- **Port:** `3000` (Railway auto-detects)

### Vercel (Frontend) + Separate Backend

Deploy frontend and backend separately for optimal performance:

1. **Frontend (Vercel):**

   ```bash
   # Build static frontend
   bun run build

   # Deploy to Vercel
   vercel deploy --prod
   ```

2. **Backend (Railway/Fly.io):**
   ```bash
   # Deploy API server separately
   # Use environment variable for API URL
   VITE_API_URL=https://api.yourdomain.com
   ```

### Docker Deployment

Echo Stack includes Docker support for containerized deployments:

1. **Create Dockerfile:**

   ```dockerfile
   FROM oven/bun:1 AS base
   WORKDIR /app

   # Install dependencies
   COPY package.json bun.lockb ./
   RUN bun install --frozen-lockfile

   # Copy source code
   COPY . .

   # Build application
   RUN bun run build

   # Expose port
   EXPOSE 3000

   # Start application
   CMD ["bun", "run", "start"]
   ```

2. **Build and Deploy:**

   ```bash
   # Build image
   docker build -t echo-stack-app .

   # Run container
   docker run -p 3000:3000 \
     -e NODE_ENV=production \
     -e DATABASE_URL=your_db_url \
     -e BETTER_AUTH_SECRET=your_secret \
     echo-stack-app
   ```

### Self-Hosted VPS

For complete control, deploy on your own VPS:

1. **Server Setup:**

   ```bash
   # Ubuntu/Debian setup
   sudo apt update
   sudo apt install nginx postgresql certbot

   # Install Bun
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Application Setup:**

   ```bash
   # Clone repository
   git clone https://github.com/yourusername/yourapp.git
   cd yourapp

   # Install dependencies
   bun install

   # Build application
   bun run build
   ```

3. **Process Management (PM2):**

   ```bash
   # Install PM2
   bun add -g pm2

   # Create ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'echo-stack-app',
       script: 'bun run start',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   EOF

   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Nginx Reverse Proxy:**

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **SSL with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## Email Configuration 📧

### Resend Setup (Recommended)

1. **Sign up for Resend:** https://resend.com
2. **Add Domain:** Verify your sending domain
3. **Get API Key:** Copy your API key
4. **Configure Environment:**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=hello@yourdomain.com
   RESEND_FROM_NAME=Your App Name
   ```

### Alternative Email Providers

**SendGrid:**

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=hello@yourdomain.com
```

**Amazon SES:**

```env
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
EMAIL_FROM=hello@yourdomain.com
```

## Monitoring & Observability 📊

### Health Checks

Echo Stack provides built-in health check endpoints:

```bash
# Check application health
curl https://yourdomain.com/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "services": {
    "database": "healthy"
  }
}
```

### Logging

Production logs are structured JSON for easy parsing:

```json
{
  "level": "info",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "message": "🛬 Landing: user authentication completed",
  "service": "auth",
  "operation": "login",
  "correlationId": "abc123",
  "metadata": {
    "userId": "user_123",
    "duration": "150ms"
  }
}
```

**Log Aggregation Options:**

- **Simple:** Tail logs with `pm2 logs`
- **Cloud:** Use platform logging (Railway logs, Vercel logs)
- **Advanced:** Ship to DataDog, LogRocket, or Sentry

### Error Tracking

Integrate with error tracking services:

```typescript
// src/lib/error-tracking.ts
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})

// Automatic error capture in production
```

### Performance Monitoring

**Database Monitoring:**

```bash
# Check connection pool usage
SELECT * FROM pg_stat_activity;

# Monitor query performance
SELECT query, mean_exec_time FROM pg_stat_statements;
```

**Application Metrics:**

- Response times via health check endpoints
- Error rates through structured logging
- Database connection health via monitoring

## Security Hardening 🔐

### HTTPS/TLS

**Requirements:**

- All production URLs must use HTTPS
- Minimum TLS 1.2
- Strong cipher suites

**Implementation:**

```env
# Enforce HTTPS in production
BETTER_AUTH_URL=https://api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Environment Security

**Secrets Management:**

- Use platform secret management (Railway secrets, Vercel env vars)
- Never commit secrets to version control
- Rotate secrets regularly
- Use separate secrets per environment

**Example Secret Rotation:**

```bash
# Generate new auth secret
openssl rand -base64 32

# Update in deployment platform
# Test with new secret
# Deploy update
```

### Network Security

**CORS Configuration:**

```env
# Restrictive CORS for production
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Never use wildcards in production
# CORS_ALLOWED_ORIGINS=* # ❌ NEVER DO THIS
```

**Rate Limiting:**

```env
# Enable rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

## Performance Optimization ⚡

### Database Optimization

1. **Connection Pooling:**

   ```env
   # Optimize for your deployment
   DATABASE_POOL_SIZE=10
   DATABASE_POOL_TIMEOUT=30000
   ```

2. **Query Optimization:**

   ```bash
   # Monitor slow queries
   bun run db:analyze

   # Add database indexes as needed
   ```

### Caching Strategy

**Application-Level Caching:**

```typescript
// Use TanStack Query for client-side caching
const { data } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => getUserProfile(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

**CDN/Edge Caching:**

- Deploy static assets to CDN
- Use platform edge functions when available
- Cache API responses appropriately

### Build Optimization

```bash
# Analyze bundle size
bun run build --analyze

# Optimize for production
NODE_ENV=production bun run build
```

## Backup & Recovery 💾

### Database Backups

**Automated Backups (Recommended):**

```bash
# Most managed databases provide automatic backups
# Verify backup schedule and retention policy
```

**Manual Backup:**

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_file.sql
```

### Application Backups

**Code Repository:**

- Ensure code is pushed to Git repository
- Tag releases for easy rollback
- Maintain deployment documentation

**Environment Configuration:**

- Backup environment variables
- Document configuration changes
- Version control infrastructure as code

## Rollback Procedures 🔄

### Quick Rollback

1. **Identify Last Known Good Version:**

   ```bash
   git log --oneline -10
   ```

2. **Rollback Database (if needed):**

   ```bash
   # Restore from backup if schema changed
   psql $DATABASE_URL < last_good_backup.sql
   ```

3. **Deploy Previous Version:**

   ```bash
   # Railway/Vercel
   git revert HEAD
   git push origin main

   # Docker
   docker run previous-image-tag
   ```

### Migration Rollback

```bash
# Check migration status
bun run db:status

# Rollback specific migration (if supported)
bun run db:rollback --to migration_timestamp
```

## Troubleshooting 🔧

### Common Issues

**Database Connection Errors:**

```bash
# Check database health
bun run db:health

# Verify connection string
echo $DATABASE_URL

# Test manual connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Authentication Issues:**

```bash
# Verify auth configuration
node -e "console.log(process.env.BETTER_AUTH_SECRET?.length)"

# Should output 32 or higher
```

**CORS Errors:**

```bash
# Check CORS configuration
echo $CORS_ALLOWED_ORIGINS

# Verify origins match exactly (no trailing slashes)
```

### Debug Mode

```env
# Enable debug logging
LOG_LEVEL=debug

# Restart application to see detailed logs
```

### Performance Issues

```bash
# Check database performance
bun run db:analyze

# Monitor application logs
tail -f logs/app.log | grep "error\|slow"

# Check resource usage
top -p $(pgrep node)
```

## Scaling Considerations 📈

### Horizontal Scaling

**Application Scaling:**

- Deploy multiple instances behind load balancer
- Use stateless session management (JWT)
- Implement proper logging correlation

**Database Scaling:**

- Read replicas for read-heavy workloads
- Connection pooling optimization
- Query optimization and indexing

### Vertical Scaling

**Resource Allocation:**

- Monitor CPU and memory usage
- Scale database resources as needed
- Optimize bundle size and asset delivery

## Post-Deployment Checklist ✅

After successful deployment, verify everything is working:

```bash
# 1. Health checks
curl https://yourdomain.com/health

# 2. Authentication flow
# - Test user registration
# - Test email verification
# - Test login/logout

# 3. Database operations
# - Verify CRUD operations work
# - Check database connectivity

# 4. Email delivery
# - Test email verification
# - Check email provider logs

# 5. Security headers
curl -I https://yourdomain.com
# Verify CORS, HTTPS, security headers

# 6. Performance
# - Test page load times
# - Verify asset caching
# - Check API response times
```

---

**🎯 Your Echo Stack application is now combat-ready for production deployment!**

_"Successful deployment requires preparation, validation, and continuous monitoring"_ ✈️
