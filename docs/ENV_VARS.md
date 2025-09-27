# Environment Variables

This document describes all required and optional environment variables for the bot control plane system.

## Required Variables

### Database
- **`DATABASE_URL`** (required): PostgreSQL connection string
  - Format: `postgresql+psycopg://user:password@host:port/database`
  - Example: `postgresql+psycopg://app:app@db:5432/app`

### Redis
- **`REDIS_URL`** (required): Redis connection string for Celery broker and cache
  - Format: `redis://host:port/db`
  - Example: `redis://redis:6379/0`

### Security
- **`COOKIE_KEY`** (required): 32-byte encryption key for bot cookies
  - Must be exactly 32 bytes (256 bits) for AES-256-GCM
  - Generate with: `openssl rand -base64 32`
  - Example: `your-32-byte-base64-encoded-key-here`

### API Configuration
- **`API_HOST`** (optional): API server host (default: `0.0.0.0`)
- **`API_PORT`** (optional): API server port (default: `8000`)

### Worker Configuration
- **`CELERY_BROKER_URL`** (optional): Celery broker URL (defaults to `REDIS_URL`)
- **`CELERY_RESULT_BACKEND`** (optional): Celery result backend (defaults to `REDIS_URL`)

### Timezone
- **`APP_TZ`** (optional): Application timezone (default: `Europe/Amsterdam`)
  - Used for scheduling and time calculations
  - Must be a valid pytz timezone string

### S3/Storage
- **`S3_ENDPOINT`** (optional): S3-compatible storage endpoint
  - Example: `http://minio:9000`
- **`S3_ACCESS_KEY`** (optional): S3 access key
  - Example: `minio`
- **`S3_SECRET_KEY`** (optional): S3 secret key
  - Example: `minio123`
- **`S3_BUCKET`** (optional): S3 bucket name for artifacts
  - Example: `artifacts`

## Security Variables

### CORS
- **`ALLOWED_ORIGINS`** (optional): Comma-separated list of allowed CORS origins
  - Example: `https://app.example.com,https://admin.example.com`
  - Default: `*` (allows all origins - not recommended for production)

### Session Security
- **`COOKIE_DOMAIN`** (optional): Cookie domain for session cookies
  - Example: `.example.com`
  - Default: None (uses request domain)

### Rate Limiting
- **`RATE_LIMIT_PER_MINUTE`** (optional): Default rate limit per IP per minute (default: `30`)
- **`RATE_LIMIT_AUTH_PER_MINUTE`** (optional): Auth endpoint rate limit (default: `10`)
- **`RATE_LIMIT_WEBHOOK_PER_MINUTE`** (optional): Webhook rate limit (default: `120`)

## Development Variables

### Authentication
- **`AUTH_DISABLED`** (optional): Disable authentication for development (default: `false`)
  - Set to `true` to disable auth checks
  - **Never use in production**

### Development User
- **`DEV_USER_ID`** (optional): Development user ID (default: `dev-user-123`)
- **`DEV_USER_ROLE`** (optional): Development user role (default: `creator`)
  - Options: `creator`, `agency`, `admin`
- **`DEV_ORG_ID`** (optional): Development organization ID

## Monitoring & Observability

### Logging
- **`LOG_LEVEL`** (optional): Logging level (default: `INFO`)
  - Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- **`LOG_RETENTION_DAYS`** (optional): Log retention in days (default: `7`)
- **`LOG_FORMAT`** (optional): Log format (default: `json`)
  - Options: `json`, `text`

### Metrics
- **`METRICS_ENABLED`** (optional): Enable Prometheus metrics (default: `false`)
- **`METRICS_PORT`** (optional): Metrics server port (default: `9090`)

## Production Variables

### Environment
- **`NODE_ENV`** (optional): Node environment (default: `development`)
  - Set to `production` for production deployments
- **`ENVIRONMENT`** (optional): Deployment environment
  - Options: `development`, `staging`, `production`

### Scaling
- **`API_REPLICAS`** (optional): Number of API server replicas (default: `1`)
- **`WORKER_REPLICAS`** (optional): Number of worker replicas (default: `1`)

## Webhook Secrets

### Stripe
- **`STRIPE_WEBHOOK_SECRET`** (optional): Stripe webhook endpoint secret
  - Used to verify webhook signatures
  - Get from Stripe dashboard

### Crypto
- **`CRYPTO_WEBHOOK_SECRET`** (optional): Crypto payment webhook secret
  - Used to verify webhook signatures

## Example Environment File

```bash
# Database
DATABASE_URL=postgresql+psycopg://app:app@db:5432/app

# Redis
REDIS_URL=redis://redis:6379/0

# Security (generate with: openssl rand -base64 32)
COOKIE_KEY=your-32-byte-base64-encoded-key-here

# API
API_HOST=0.0.0.0
API_PORT=8000

# Timezone
APP_TZ=Europe/Amsterdam

# S3 Storage
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio123
S3_BUCKET=artifacts

# Security
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
COOKIE_DOMAIN=.example.com

# Rate Limiting
RATE_LIMIT_PER_MINUTE=30
RATE_LIMIT_AUTH_PER_MINUTE=10
RATE_LIMIT_WEBHOOK_PER_MINUTE=120

# Logging
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=7
LOG_FORMAT=json

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# Production
NODE_ENV=production
ENVIRONMENT=production

# Scaling
API_REPLICAS=2
WORKER_REPLICAS=3

# Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_secret
CRYPTO_WEBHOOK_SECRET=your_crypto_secret
```

## Validation

The application validates critical environment variables at startup:

1. **DATABASE_URL** - Must be present and valid PostgreSQL URL
2. **REDIS_URL** - Must be present and valid Redis URL  
3. **COOKIE_KEY** - Must be present and exactly 32 bytes

If any required variable is missing or invalid, the application will exit with an error message.

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong, unique values** for all secrets
3. **Rotate secrets regularly** in production
4. **Use environment-specific values** for different deployments
5. **Limit ALLOWED_ORIGINS** in production (never use `*`)
6. **Enable authentication** in production (never set `AUTH_DISABLED=true`)