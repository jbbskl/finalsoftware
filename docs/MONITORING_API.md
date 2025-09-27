# Monitoring API Documentation

This document describes the monitoring, admin, and affiliate API endpoints with RBAC (Role-Based Access Control) rules.

## Overview

The Monitoring API provides:
- Runs listing and details with pagination
- Monitoring overview with role-aware aggregates
- Admin endpoints for subscriptions, invoices, and bots inventory
- Affiliate read-only endpoints
- Health checks and rate limiting

## RBAC Rules

### User Roles
- **Creator**: Individual users with user-owned resources
- **Agency**: Organization users with org-owned resources  
- **Admin**: Full system access

### Access Patterns
- **Creator**: Access only user-owned bot instances and related data
- **Agency**: Access only org-owned bot instances and related data
- **Admin**: Access all resources across the system

## Authentication

All endpoints require authentication via the `get_current_user()` function which extracts user context from request headers or environment variables (development mode).

## Endpoints

### Monitoring Endpoints

#### List Runs
**GET** `/api/runs`

List runs with pagination and RBAC filtering.

**Query Parameters:**
- `bot_instance_id` (optional): Filter by specific bot instance
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**RBAC Rules:**
- Creator: Only user-owned bot instances
- Agency: Only org-owned bot instances
- Admin: All runs

**Response:**
```json
[
  {
    "id": "run-uuid",
    "bot_id": "f2f_post",
    "status": "success",
    "queued_at": "2024-01-15T10:30:00Z",
    "started_at": "2024-01-15T10:30:05Z",
    "finished_at": "2024-01-15T10:35:00Z",
    "exit_code": 0,
    "error_code": null,
    "summary_json": {
      "schedule_id": "schedule-uuid",
      "kind": "full"
    }
  }
]
```

#### Get Run Details
**GET** `/api/runs/{run_id}`

Get detailed information about a specific run.

**RBAC Rules:**
- Creator: Only runs from user-owned bot instances
- Agency: Only runs from org-owned bot instances
- Admin: Any run

**Response:**
```json
{
  "id": "run-uuid",
  "org_id": "user-123",
  "bot_id": "f2f_post",
  "config_id": "config-uuid",
  "schedule_id": "schedule-uuid",
  "status": "success",
  "queued_at": "2024-01-15T10:30:00Z",
  "started_at": "2024-01-15T10:30:05Z",
  "finished_at": "2024-01-15T10:35:00Z",
  "worker_host": "worker-1",
  "image_ref": "bot-f2f_post:latest",
  "exit_code": 0,
  "error_code": null,
  "artifacts_url": "https://minio.example.com/artifacts/run-uuid",
  "cost_credits": 5,
  "summary_json": {
    "schedule_id": "schedule-uuid",
    "kind": "full",
    "phase_id": null
  }
}
```

#### Monitoring Overview
**GET** `/api/monitoring/overview`

Get monitoring overview with role-aware aggregates.

**RBAC Rules:**
- Creator/Agency: Counts for their scope only
- Admin: Global counts

**Response:**
```json
{
  "bots_total": 5,
  "bots_active": 3,
  "runs_today": 12,
  "runs_last_7d": 45,
  "errors_last_24h": 2
}
```

### Admin Endpoints

All admin endpoints require admin role.

#### List Subscriptions
**GET** `/api/admin/subscriptions`

List subscriptions with admin-only access.

**Query Parameters:**
- `status` (optional): Filter by subscription status
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**RBAC Rules:**
- Admin only

**Response:**
```json
[
  {
    "id": "sub-uuid",
    "org_id": "org-123",
    "status": "active",
    "plan": "agency",
    "entitlements_json": {
      "f2f_post": {"units": 10},
      "f2f_dm": {"units": 10}
    },
    "current_period_end": "2024-02-15T00:00:00Z",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

#### List Invoices
**GET** `/api/admin/invoices`

List invoices with admin-only access.

**Query Parameters:**
- `status` (optional): Filter by invoice status
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**RBAC Rules:**
- Admin only

**Response:**
```json
[
  {
    "id": "invoice-uuid",
    "provider": "stripe",
    "status": "paid",
    "amount_eur": 12000,
    "url": "/pay/test/invoice-uuid",
    "ext_id": "stripe_test_invoice-uuid",
    "owner_type": "user",
    "owner_id": "user-123",
    "created_at": "2024-01-15T10:00:00Z",
    "paid_at": "2024-01-15T10:05:00Z"
  }
]
```

#### Download Invoice
**GET** `/api/admin/invoices/{invoice_id}/download`

Download invoice file or return download URL.

**RBAC Rules:**
- Admin only

**Response:**
```json
{
  "download_url": "/api/admin/invoices/invoice-uuid/download/stub"
}
```

#### Bots Inventory
**GET** `/api/admin/bots`

List bot instances inventory with admin-only access.

**Query Parameters:**
- `status` (optional): Filter by bot status
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**RBAC Rules:**
- Admin only

**Response:**
```json
[
  {
    "id": "bot-instance-uuid",
    "owner_type": "user",
    "owner_id": "user-123",
    "bot_code": "f2f_post",
    "status": "active",
    "validation_status": "valid",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### Affiliate Endpoints

#### Get User Affiliate Info
**GET** `/api/affiliate`

Get affiliate information for the current user.

**RBAC Rules:**
- Creator/Agency: Their own affiliate info
- Admin: Not allowed (no affiliate accounts)

**Response:**
```json
{
  "code": "AF_USER123",
  "clicks_count": 42,
  "signups_count": 5,
  "paid_total_eur": 250
}
```

#### List All Affiliates (Admin)
**GET** `/api/admin/affiliates`

List all affiliates with summary metrics.

**Query Parameters:**
- `limit` (optional): Number of results (1-100, default: 50)
- `offset` (optional): Pagination offset (default: 0)

**RBAC Rules:**
- Admin only

**Response:**
```json
[
  {
    "id": "aff-001",
    "code": "AF_USER123",
    "user_id": "user-123",
    "clicks_count": 150,
    "signups_count": 12,
    "paid_total_eur": 1200,
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### Health Endpoint

#### Health Check
**GET** `/api/health`

Comprehensive health check endpoint.

**Response:**
```json
{
  "ok": true,
  "db": true,
  "redis": true,
  "worker": true
}
```

**Health Checks:**
- **Database**: Basic connectivity test
- **Redis**: Connection and ping test
- **Worker**: Optional check for Celery worker keys

## Rate Limiting

### Configuration
- **Default**: 30 requests per minute per IP
- **Configurable**: Via `RATE_LIMIT_PER_MINUTE` environment variable
- **Scope**: Sensitive endpoints only (POST, PUT, PATCH, DELETE)

### Protected Endpoints
- `/api/auth/login`
- `/api/bot-instances/*` (write operations)
- `/api/schedules` (write operations)
- `/api/billing/invoice`

### Rate Limit Response
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Limit: 30 per minute"
}
```

**Status Code**: 429 Too Many Requests

## Error Handling

All endpoints return JSON error responses with appropriate HTTP status codes:

### Common Error Responses

**401 Unauthorized:**
```json
{
  "detail": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "detail": "Admin access required"
}
```

**404 Not Found:**
```json
{
  "detail": "Run not found or access denied"
}
```

**422 Unprocessable Entity:**
```json
{
  "detail": "Invalid request parameters"
}
```

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Limit: 30 per minute"
}
```

## Usage Examples

### Monitor Bot Runs
```bash
# List recent runs
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/runs?limit=10"

# Get specific run details
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/runs/run-uuid"

# Get monitoring overview
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/monitoring/overview"
```

### Admin Operations
```bash
# List all subscriptions
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:8000/api/admin/subscriptions"

# Download invoice
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:8000/api/admin/invoices/invoice-uuid/download"

# List bot inventory
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:8000/api/admin/bots"
```

### Affiliate Information
```bash
# Get user affiliate info
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/affiliate"

# List all affiliates (admin)
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:8000/api/admin/affiliates"
```

### Health Check
```bash
# Check system health
curl "http://localhost:8000/api/health"
```

## Development Notes

### Environment Variables
- `DEV_USER_ID`: Development user ID (default: "dev-user-123")
- `DEV_USER_ROLE`: Development user role (default: "creator")
- `DEV_ORG_ID`: Development org ID (optional)
- `RATE_LIMIT_PER_MINUTE`: Rate limit per minute (default: 30)

### RBAC Context
The `RBACContext` object contains:
- `user_id`: User identifier
- `role`: User role (creator/agency/admin)
- `org_id`: Organization ID (for agency users)
- `owner_type`: Resource owner type (user/org/admin)
- `owner_id`: Resource owner ID

### Query Optimization
- Efficient queries with proper indexing
- Pagination to prevent large result sets
- RBAC filtering at database level
- Minimal data transfer with selective fields

## Security Considerations

1. **Authentication**: All endpoints require valid authentication
2. **Authorization**: RBAC ensures users only access their resources
3. **Rate Limiting**: Prevents abuse of sensitive endpoints
4. **Input Validation**: All parameters validated and sanitized
5. **Error Handling**: No sensitive information leaked in error responses

## Future Enhancements

1. **Real-time Monitoring**: WebSocket connections for live updates
2. **Advanced Analytics**: More detailed metrics and reporting
3. **Export Features**: CSV/PDF export for admin data
4. **Audit Logging**: Track all admin operations
5. **Performance Metrics**: Response time and throughput monitoring