# 🚀 Echo Stack Deployment - Coolify + Hetzner VPS Guide

> **"Self-Hosted Production Deployment"**  
> Complete guide to deploying Echo Stack applications on Hetzner VPS using Coolify with enterprise-grade security and reliability.

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

**Production Options for Hetzner VPS:**

```env
# Self-hosted PostgreSQL on Hetzner VPS (recommended)
DATABASE_URL=postgresql://postgres:password@localhost:5432/your_app_name?sslmode=require

# Managed PostgreSQL services (alternative)
DATABASE_URL=postgresql://user:password@your-db-host.com:5432/dbname?sslmode=require

# Hetzner Cloud Database (if using managed service)
DATABASE_URL=postgresql://postgres:password@db.hetzner-cloud.com:5432/postgres?sslmode=require
```

## Deployment with Coolify on Hetzner VPS 🌐

### Hetzner VPS Setup

1. **Create Hetzner VPS:**
   - Choose Ubuntu 22.04 LTS (recommended)
   - Minimum: 2 vCPU, 4GB RAM, 40GB SSD
   - Recommended: 4 vCPU, 8GB RAM, 80GB SSD
   - Enable IPv6 and private networking

2. **Initial Server Setup:**

   ```bash
   # Connect to your VPS
   ssh root@your-vps-ip

   # Update system
   apt update && apt upgrade -y

   # Install essential packages
   apt install -y curl wget git htop unzip

   # Create non-root user (recommended)
   adduser coolify
   usermod -aG sudo coolify
   ```

3. **Install Docker:**

   ```bash
   # Install Docker (required for Coolify)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Add user to docker group
   usermod -aG docker coolify

   # Start and enable Docker
   systemctl start docker
   systemctl enable docker
   ```

### Coolify Installation

1. **Install Coolify:**

   ```bash
   # Switch to coolify user
   su - coolify

   # Install Coolify
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

2. **Access Coolify Dashboard:**
   - Open `http://your-vps-ip:8000` in browser
   - Complete initial setup wizard
   - Set admin credentials

3. **Configure Coolify:**
   - Set your domain for HTTPS/SSL
   - Configure email for Let's Encrypt certificates
   - Set up backup destinations (optional)

### PostgreSQL Setup on Hetzner VPS

1. **Install PostgreSQL:**

   ```bash
   # Install PostgreSQL 15
   apt install -y postgresql postgresql-contrib

   # Start and enable PostgreSQL
   systemctl start postgresql
   systemctl enable postgresql

   # Secure PostgreSQL installation
   sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your-secure-password';"
   ```

2. **Configure PostgreSQL:**

   ```bash
   # Edit PostgreSQL configuration
   nano /etc/postgresql/15/main/postgresql.conf

   # Key settings for production:
   # listen_addresses = 'localhost'
   # max_connections = 100
   # shared_buffers = 256MB
   # effective_cache_size = 1GB

   # Configure authentication
   nano /etc/postgresql/15/main/pg_hba.conf

   # Restart PostgreSQL
   systemctl restart postgresql
   ```

3. **Create Application Database:**

   ```bash
   # Connect as postgres user
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE your_app_name;
   CREATE USER app_user WITH PASSWORD 'secure-password';
   GRANT ALL PRIVILEGES ON DATABASE your_app_name TO app_user;
   \q
   ```

### Deploying Echo Stack with Coolify

1. **Create New Application in Coolify:**
   - Go to Coolify dashboard → Applications → New
   - Choose "Public Repository" or connect your Git provider
   - Enter repository URL: `https://github.com/yourusername/your-echo-stack-app`

2. **Configure Build Settings:**
   - **Build Pack:** Nixpacks (auto-detected)
   - **Build Command:** Auto-detected (`bun run build`)
   - **Start Command:** Auto-detected (`bun run start`)
   - **Port:** Auto-detected (`3000`)

3. **Why Nixpacks for Echo Stack:**

   Nixpacks automatically optimizes for your tech stack:

   ```toml
   # nixpacks.toml (optional - only if you need custom config)
   [phases.setup]
   nixPkgs = ["nodejs", "bun"]

   [phases.build]
   cmds = ["bun install --frozen-lockfile", "bun run build"]

   [start]
   cmd = "bun run start"
   ```

   **Auto-detected optimizations:**
   - ✅ Bun runtime detection from `package.json`
   - ✅ Automatic dependency caching
   - ✅ Production build optimization
   - ✅ Health checks for `/health` endpoint
   - ✅ Non-root user security
   - ✅ Proper signal handling

4. **Environment Variables in Coolify:**

   Configure these in Coolify's Environment Variables section:

   ```env
   # === ENVIRONMENT ===
   NODE_ENV=production

   # === DATABASE ===
   DATABASE_URL=postgresql://app_user:secure-password@localhost:5432/your_app_name?sslmode=require

   # === AUTHENTICATION ===
   BETTER_AUTH_URL=https://yourdomain.com
   BETTER_AUTH_SECRET=your-32-character-minimum-cryptographically-secure-secret
   JWT_SECRET=your-jwt-secret-for-integrations-32-chars-minimum

   # === EMAIL ===
   RESEND_API_KEY=re_your_resend_api_key_here
   RESEND_FROM_EMAIL=hello@yourdomain.com
   RESEND_FROM_NAME=Your App Name

   # === SECURITY ===
   CORS_ALLOWED_ORIGINS=https://yourdomain.com

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

5. **Domain and SSL Configuration:**
   - In Coolify, go to your application → Domains
   - Add your domain (e.g., `yourdomain.com`)
   - Enable "Generate SSL Certificate" for automatic Let's Encrypt
   - Coolify handles SSL renewal automatically

6. **Deploy Application:**
   - Click "Deploy" in Coolify dashboard
   - Monitor build logs in real-time
   - Coolify + Nixpacks will automatically:
     - Pull your code from Git
     - Detect Bun runtime from `package.json`
     - Run `bun install --frozen-lockfile`
     - Execute `bun run build`
     - Start with `bun run start`
     - Configure health checks for `/health` endpoint
     - Set up SSL certificates with Let's Encrypt

### Nixpacks vs Dockerfile Benefits:

**✅ Why Nixpacks is Better for Echo Stack:**

- **Zero Config**: Auto-detects Bun, TypeScript, Vite setup
- **Optimal Caching**: Intelligent dependency layer caching
- **Security**: Built-in non-root user and security best practices
- **Maintenance-Free**: Updates automatically with Bun releases
- **Smaller Builds**: Optimized for your specific tech stack

**🔧 Custom Configuration (Optional):**
If you need custom build behavior, the `nixpacks.toml` file allows overrides while keeping auto-detection benefits.

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

- **Simple:** View logs in Coolify dashboard
- **Advanced:** Ship to DataDog, LogRocket, or Sentry
- **VPS Direct:** SSH and use `docker logs container_name`

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

- Use Coolify's built-in environment variable encryption
- Never commit secrets to version control
- Rotate secrets regularly
- Use separate secrets per environment
- Consider using external secret managers (HashiCorp Vault, etc.)

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
   # Coolify - Use built-in rollback feature
   # Go to Coolify dashboard → Your App → Deployments → Rollback

   # Manual Docker rollback
   docker run previous-image-tag

   # Git-based rollback
   git revert HEAD
   git push origin main
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

### Scaling with Coolify + Hetzner

**Vertical Scaling (Easier):**

- Upgrade Hetzner VPS plan (more CPU/RAM/storage)
- Resize through Hetzner Cloud console
- Restart services after resize

**Horizontal Scaling:**

- Deploy multiple Coolify instances across different VPS
- Use Hetzner Load Balancer for traffic distribution
- Configure database clustering or external managed database
- Use stateless session management (JWT)

**Database Scaling Options:**

- Upgrade to larger Hetzner VPS for PostgreSQL
- Use Hetzner managed database service
- Set up read replicas for read-heavy workloads
- Implement connection pooling optimization

**Cost-Effective Scaling:**

- Start with Hetzner VPS CPX21 (2 vCPU, 4GB RAM) - €4.15/month
- Scale to CPX31 (2 vCPU, 8GB RAM) - €8.21/month
- Scale to CPX41 (4 vCPU, 16GB RAM) - €16.13/month
- Much cheaper than cloud alternatives

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

## Coolify-Specific Tips & Best Practices 💡

### Optimization for Coolify

1. **Resource Monitoring:**
   - Use Coolify's built-in monitoring dashboard
   - Set up alerts for high CPU/memory usage
   - Monitor disk space usage

2. **Backup Strategy:**
   - Configure Coolify's backup feature for applications
   - Set up PostgreSQL automated backups
   - Store backups in Hetzner Object Storage

3. **Multiple Environments:**
   - Use Coolify's environment management
   - Deploy staging and production on same VPS
   - Use different domains/subdomains

4. **Maintenance:**
   - Keep Coolify updated via built-in updater
   - Regular VPS security updates
   - Monitor Coolify community for best practices

### Cost Estimation (Hetzner + Coolify)

**Minimal Setup:**

- Hetzner VPS CPX21: €4.15/month
- Domain: €10-15/year
- **Total: ~€5/month**

**Production Setup:**

- Hetzner VPS CPX31: €8.21/month
- Hetzner Object Storage: €0.01/GB/month
- **Total: ~€9/month**

**High-Traffic Setup:**

- Hetzner VPS CPX41: €16.13/month
- Hetzner Load Balancer: €4.90/month
- Hetzner Object Storage: €0.01/GB/month
- **Total: ~€22/month**

---

**🎯 Your Echo Stack application is now ready for cost-effective self-hosted deployment!**

_"Self-hosting with Coolify gives you complete control at a fraction of cloud costs"_ 🚀
