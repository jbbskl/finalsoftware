# Foundations Setup - Docker + Celery + Minimal DB + API Stubs + Zoom Fix

## Overview

This document describes the implementation of the foundational infrastructure for the bot management platform, including Docker containerization, Celery task processing, database schema, API endpoints, and UI layout fixes.

## Architecture

### Services
- **Database**: PostgreSQL 15 with initial schema
- **Cache/Queue**: Redis 7 for Celery broker and result backend
- **API**: Node.js/TypeScript API service
- **Worker**: Python 3.11 Celery worker for bot execution
- **Monitoring**: Flower for Celery task monitoring (optional)

### Database Schema

The initial schema includes the following tables:
- `users` - User accounts
- `organizations` - Organization/tenant management
- `subscriptions` - Subscription plans and status
- `entitlements` - Resource limits per subscription
- `bot_instances` - Bot instance configurations
- `runs` - Bot execution runs and status

## Setup Instructions

### 1. Environment Setup

Copy the environment file:
```bash
cp .env.example .env
```

### 2. Start Development Environment

Run the development setup script:
```bash
./scripts/dev-up.sh
```

This will:
- Build all Docker images
- Start all services (db, redis, api, worker, flower)
- Create necessary directories
- Run database migrations

### 3. Verify Services

Check that all services are running:
```bash
docker-compose ps
```

Expected services:
- `db` (PostgreSQL 15)
- `redis` (Redis 7)
- `api` (Node.js API)
- `worker` (Celery worker)
- `flower` (Celery monitoring)

### 4. Test API Endpoints

The API should be available at `http://localhost:3000` with the following endpoints:

#### Health Check
```bash
curl http://localhost:3000/health
```

#### Bot Instance Management
- `POST /api/bot-instances/:id/upload-cookies` - Upload cookies file
- `POST /api/bot-instances/:id/validate` - Validate bot configuration
- `POST /api/bot-instances/:id/start` - Start bot execution
- `POST /api/bot-instances/:id/stop` - Stop bot execution
- `GET /api/bot-instances/:id/logs/stream` - Stream execution logs

## Database Migrations

The initial database schema is defined in `software/repo/db/migrations/0001_init.sql`. This includes:

- User and organization management
- Subscription and entitlement tracking
- Bot instance configuration
- Run execution tracking

To run migrations manually:
```bash
# Connect to database and run SQL
psql -h localhost -U postgres -d finalsoftware -f software/repo/db/migrations/0001_init.sql
```

## Celery Tasks

### Available Tasks

1. **validate_bot(instance_id, config_dir)**
   - Validates bot configuration
   - Checks for required files (secrets/storageState.json, config.yaml)
   - Returns validation status

2. **run_bot(instance_id, config_dir)**
   - Executes bot instance
   - Creates timestamped log files
   - Simulates bot work (2-second delay)
   - Returns execution status

### Task Execution

Tasks are queued through the API endpoints and processed by the Celery worker. Monitor task execution through Flower at `http://localhost:5555`.

## API Integration

### File Upload
- Cookies are uploaded to `/data/tenants/{owner}/{id}/secrets/storageState.json`
- Directory structure is created automatically

### Task Queueing
- Bot validation and execution tasks are queued via Celery
- Task IDs are returned for tracking
- Results are stored in Redis

### Log Streaming
- Log files are created in `/data/tenants/{owner}/{id}/logs/`
- Server-Sent Events (SSE) stream logs in real-time
- Files are timestamped for organization

## UI Layout Fixes

### Changes Made

1. **Consistent Layout Structure**
   - Updated Creator, Agency, and Admin layouts
   - Eliminated background gaps between sidebar and content
   - Fixed zoom level issues

2. **Improved Styling**
   - Consistent sidebar styling across all layouts
   - Proper background coverage
   - Better responsive behavior

3. **CSS Improvements**
   - Added layout-specific CSS rules
   - Fixed flexbox alignment
   - Ensured full-width coverage

## Development Workflow

### Adding New Bot Types

1. Create bot configuration in `/data/tenants/{owner}/{id}/`
2. Upload required files (cookies, config)
3. Validate configuration via API
4. Start execution via API
5. Monitor logs via SSE stream

### Testing Bot Execution

1. Create a test bot instance
2. Upload cookies file
3. Validate configuration
4. Start execution
5. Check logs in Flower or via SSE

## Troubleshooting

### Common Issues

1. **Services not starting**
   - Check Docker logs: `docker-compose logs [service]`
   - Verify environment variables
   - Check port conflicts

2. **Database connection issues**
   - Verify PostgreSQL is running
   - Check connection string in .env
   - Run migrations manually if needed

3. **Celery tasks not processing**
   - Check Redis connection
   - Verify worker is running
   - Check Flower for task status

4. **API endpoints not responding**
   - Verify API service is running
   - Check port 3000 is available
   - Review API logs

### Log Locations

- API logs: `docker-compose logs api`
- Worker logs: `docker-compose logs worker`
- Database logs: `docker-compose logs db`
- Application logs: `/data/tenants/{owner}/{id}/logs/`

## Next Steps

1. **Bot Adapter Integration**
   - Replace adapter_stub.py with real bot adapters
   - Implement platform-specific bot logic
   - Add error handling and recovery

2. **Authentication**
   - Add user authentication
   - Implement role-based access control
   - Secure API endpoints

3. **Production Deployment**
   - Configure production environment variables
   - Set up SSL/TLS
   - Implement monitoring and alerting

4. **Advanced Features**
   - Bot scheduling
   - Analytics and reporting
   - Multi-tenant support
   - Bot marketplace