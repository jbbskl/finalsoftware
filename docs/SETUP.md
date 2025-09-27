# Foundations: Docker + Celery + Minimal DB + API Stubs + Zoom Fix

## Overview

This document describes the implementation of the foundational infrastructure for the bot management platform, including Docker containerization, Celery task processing, database schema, API endpoints, and UI layout fixes.

## Architecture

### Services

1. **Database (PostgreSQL 15)**
   - Database: `finalsoftware`
   - User: `postgres`
   - Password: `devpass`
   - Port: `5432`

2. **Redis (Redis 7)**
   - Port: `6379`
   - Used for Celery broker and result backend

3. **API Service (Node.js/TypeScript)**
   - Port: `3000`
   - Health endpoint: `/health` and `/healthz`
   - Bot instance endpoints: `/api/bot-instances/*`

4. **Worker Service (Python/Celery)**
   - Processes background tasks
   - Tasks: `validate_bot`, `run_bot`

5. **Flower (Optional)**
   - Port: `5555`
   - Celery monitoring interface

## Database Schema

### Core Tables

- **users**: User accounts
- **organizations**: Organization/tenant management
- **subscriptions**: Subscription plans and status
- **entitlements**: Feature entitlements per subscription
- **bot_instances**: Bot instance configurations
- **runs**: Bot execution runs and logs

### Migration System

- Migrations stored in `/software/repo/db/migrations/`
- Auto-run on API startup
- Manual migration: `python /app/db/migrate.py`

## API Endpoints

### Bot Instances

- `POST /api/bot-instances/:id/upload-cookies` - Upload cookies file
- `POST /api/bot-instances/:id/validate` - Validate bot configuration
- `POST /api/bot-instances/:id/start` - Start bot execution
- `POST /api/bot-instances/:id/stop` - Stop bot execution
- `GET /api/bot-instances/:id/logs/stream` - Stream logs via SSE

### Health

- `GET /health` - API health check
- `GET /healthz` - Alternative health check

## Celery Tasks

### validate_bot(instance_id, config_dir)
- Checks for `secrets/storageState.json` and `config.yaml`
- Validates JSON structure
- Returns validation status

### run_bot(instance_id, config_dir)
- Creates timestamped log file
- Simulates bot execution (2-second sleep)
- Writes "SUCCESS" to log
- Returns execution status

## File Structure

```
/data/tenants/{owner}/{id}/secrets/
├── storageState.json    # Browser cookies/state
└── config.yaml         # Bot configuration

/app/logs/
└── run_{instance_id}_{timestamp}.log  # Execution logs
```

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start

1. **Start all services:**
   ```bash
   ./scripts/dev-up.sh
   ```

2. **Manual start:**
   ```bash
   docker-compose up -d --build
   ```

3. **Check service health:**
   ```bash
   docker-compose ps
   ```

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
DATABASE_URL=postgres://postgres:devpass@db:5432/finalsoftware
REDIS_URL=redis://redis:6379/0
COOKIE_KEY=change_me_32_bytes
NODE_ENV=development
API_PORT=3000
```

## Testing the Setup

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Upload Cookies
```bash
curl -X POST -F "file=@cookies.json" \
  http://localhost:3000/api/bot-instances/test123/upload-cookies
```

### 3. Validate Bot
```bash
curl -X POST \
  http://localhost:3000/api/bot-instances/test123/validate
```

### 4. Start Bot
```bash
curl -X POST \
  http://localhost:3000/api/bot-instances/test123/start
```

### 5. Stream Logs
```bash
curl -N http://localhost:3000/api/bot-instances/test123/logs/stream
```

## UI Layout Fixes

### Issues Fixed

1. **Background Gaps**: Added proper background colors to all layout components
2. **Zoom Issues**: Fixed CSS to ensure proper scaling and full-width coverage
3. **Layout Consistency**: Standardized layout across Creator/Agency/Admin pages

### Changes Made

- Updated layout components to use `bg-background` and `bg-sidebar-background`
- Added `min-h-screen` to content areas
- Fixed flex layouts to prevent gaps
- Added proper CSS variables for consistent theming

## Monitoring

### Flower Dashboard
- URL: http://localhost:5555
- Monitor Celery tasks and workers
- View task history and statistics

### Logs
- API logs: `docker-compose logs api`
- Worker logs: `docker-compose logs worker`
- All logs: `docker-compose logs`

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if PostgreSQL is running: `docker-compose ps db`
   - Verify connection string in environment variables

2. **Redis Connection Failed**
   - Check Redis service: `docker-compose ps redis`
   - Verify REDIS_URL environment variable

3. **Migration Errors**
   - Check database permissions
   - Verify migration files exist in `/software/repo/db/migrations/`

4. **API Not Responding**
   - Check API service logs: `docker-compose logs api`
   - Verify port 3000 is not in use by another service

### Debug Commands

```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build --force-recreate
```

## Next Steps

1. **Database Integration**: Connect API to actual database models
2. **Authentication**: Add user authentication and authorization
3. **Bot Adapters**: Replace adapter_stub.py with real bot implementations
4. **Monitoring**: Add comprehensive logging and monitoring
5. **Production**: Configure for production deployment

## Commit History

- `chore(docker): add compose and Dockerfiles`
- `feat(db): add initial schema and migration loader`
- `feat(worker): celery tasks for validate/run bot`
- `feat(api): endpoints for cookies/validate/start/stop/logs`
- `fix(ui): global zoom/layout adjustments`