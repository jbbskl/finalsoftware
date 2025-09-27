# Software Stack Runbook

This document provides quick commands to build, start, and verify the software stack.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 5432, 6379, 8000, 9000, 9001 available

## Quick Start

### 1. Build and Start Stack

```bash
cd software/repo
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up -d
```

### 2. Verify Services

```bash
# Check all services are running
docker compose -f infra/docker-compose.yml ps

# Check service health
curl http://localhost:8000/healthz
curl http://localhost:8000/readyz
```

### 3. Run Migrations and Seeds

```bash
# Run migrations
./scripts/migrate.sh

# Seed test users
python3 scripts/seed.py
```

### 4. Run Smoke Tests

```bash
# Run comprehensive smoke tests
./scripts/smoke.sh
```

## Service Endpoints

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (minio/minio123)
- **Database**: localhost:5432 (app/app)
- **Redis**: localhost:6379

## MinIO Setup

The stack uses MinIO for S3-compatible storage. The `artifacts` bucket should be created automatically, but if not:

1. Go to http://localhost:9001
2. Login with minio/minio123
3. Create bucket named `artifacts`
4. Set bucket policy to allow public read/write for development

## Test Users

After seeding, these test users are available:

- **Admin**: admin@example.com / Admin123!
- **Creator**: creator@example.com / Creator123!
- **Agency**: agency@example.com / Agency123!

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose -f infra/docker-compose.yml logs api
docker compose -f infra/docker-compose.yml logs worker
docker compose -f infra/docker-compose.yml logs beat
docker compose -f infra/docker-compose.yml logs scheduler
```

### Database Issues

```bash
# Check database connectivity
docker compose -f infra/docker-compose.yml exec db psql -U app -d app -c "SELECT 1;"

# Reset database
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d db redis minio
./scripts/migrate.sh
```

### API Import Errors

```bash
# Rebuild API service
docker compose -f infra/docker-compose.yml build api
docker compose -f infra/docker-compose.yml up -d api
```

### Worker/Celery Issues

```bash
# Check worker logs
docker compose -f infra/docker-compose.yml logs worker

# Restart worker
docker compose -f infra/docker-compose.yml restart worker
```

## Development Commands

### View Logs

```bash
# All services
docker compose -f infra/docker-compose.yml logs -f

# Specific service
docker compose -f infra/docker-compose.yml logs -f api
```

### Restart Services

```bash
# Restart all
docker compose -f infra/docker-compose.yml restart

# Restart specific service
docker compose -f infra/docker-compose.yml restart api
```

### Clean Up

```bash
# Stop and remove containers
docker compose -f infra/docker-compose.yml down

# Stop, remove containers and volumes
docker compose -f infra/docker-compose.yml down -v

# Remove all images
docker compose -f infra/docker-compose.yml down --rmi all
```

## Health Check Endpoints

- `GET /healthz` - Kubernetes-style health check
- `GET /readyz` - Kubernetes-style readiness check
- `GET /api/health` - Detailed health status

## Expected Behavior

### Successful Startup

1. All services show "Up" status
2. `/healthz` returns 200 with `{"status": "healthy"}`
3. `/readyz` returns 200 with `{"ready": true}`
4. Smoke tests pass with green ✅ indicators

### API Endpoints Working

- `POST /api/bot-instances/:id/upload-cookies` → `{ok: true}`
- `POST /api/bot-instances/:id/validate` → `{ok: true}`
- `POST /api/bot-instances/:id/start` → `{run_id, status: 'queued'}`
- `GET /api/bot-instances/:id/logs/stream` → streams events

## Performance Notes

- API startup: ~30 seconds
- Worker startup: ~15 seconds
- Database migrations: ~5 seconds
- Smoke tests: ~10 seconds

## Resource Usage

- **RAM**: ~2GB total
- **CPU**: Low usage when idle
- **Disk**: ~1GB for images and data