# Bot Instance API Documentation

This document describes the API endpoints for managing bot instances once they have been provisioned through the billing flow.

## Overview

The Bot Instance API provides endpoints for:
- Uploading cookies for authentication
- Validating bot configuration
- Starting and stopping bot runs
- Streaming logs in real-time via Server-Sent Events (SSE)

## Base URL

All endpoints are prefixed with `/api/bot-instances`

## Endpoints

### 1. Get Bot Instance Details

**GET** `/api/bot-instances/{instance_id}`

Retrieve details about a specific bot instance.

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "owner_type": "user",
  "owner_id": "dev-user-123",
  "bot_code": "f2f_post",
  "status": "inactive",
  "config_path": "/data/tenants/user-dev-user-123/bots/550e8400-e29b-41d4-a716-446655440000/config.yaml",
  "validation_status": null,
  "last_validated_at": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 2. Upload Cookies

**POST** `/api/bot-instances/{instance_id}/upload-cookies`

Upload a cookies file for bot authentication.

**Request:**
- **Content-Type:** `multipart/form-data`
- **Body:** File upload with cookies data

**File Location:**
The file is saved to:
```
/data/tenants/{ownerType}-{ownerId}/bots/{botInstanceId}/secrets/storageState.json
```

**Response:**
```json
{
  "ok": true
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:8000/api/bot-instances/550e8400-e29b-41d4-a716-446655440000/upload-cookies \
  -F "file=@cookies.json"
```

### 3. Validate Instance

**POST** `/api/bot-instances/{instance_id}/validate`

Validate the bot instance configuration and cookies.

**Flow:**
1. Updates `validation_status` to 'pending' in database
2. Calls Celery task `validate_bot(instanceId, configDir)`
3. Returns job ID for tracking

**Response:**
```json
{
  "job_id": "celery-task-uuid",
  "status": "queued"
}
```

**Validation Checks:**
- Config file exists and has required fields
- Cookies file exists
- Required config fields: `bot_code`, `headless`, `timezone`

**Validation Result Webhook:**
The validation result is updated via:
**POST** `/api/bot-instances/{instance_id}/validate/complete`

**Request Body:**
```json
{
  "instance_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "valid",
  "error": null
}
```

### 4. Start Bot Instance

**POST** `/api/bot-instances/{instance_id}/start`

Start a bot instance run.

**Flow:**
1. Creates a new `runs` row with status='queued'
2. Calls Celery task `run_bot(instanceId, configDir)`
3. Returns run ID for tracking

**Response:**
```json
{
  "run_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "queued"
}
```

**Run States:**
- `queued`: Run is waiting to be processed
- `running`: Run is currently executing
- `success`: Run completed successfully
- `error`: Run failed
- `stopped`: Run was manually stopped

### 5. Stop Bot Instance

**POST** `/api/bot-instances/{instance_id}/stop`

Stop a running bot instance.

**Flow:**
1. Finds the latest active run for the instance
2. Updates run status to 'stopped'
3. Sets `finished_at` timestamp

**Response:**
```json
{
  "ok": true
}
```

**Note:** This is currently a stub implementation that only updates the database. Future versions will send kill signals to running containers.

### 6. Stream Logs (SSE)

**GET** `/api/bot-instances/{instance_id}/logs/stream`

Stream bot instance logs in real-time using Server-Sent Events.

**Response:**
- **Content-Type:** `text/event-stream`
- **Headers:**
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`

**Stream Format:**
```
data: Starting bot instance 550e8400-e29b-41d4-a716-446655440000...

data: Bot code: f2f_post

data: Status: inactive

data: [2024-01-15 10:30:00] - Bot started successfully
```

**Example using curl:**
```bash
curl -N http://localhost:8000/api/bot-instances/550e8400-e29b-41d4-a716-446655440000/logs/stream
```

**Example using JavaScript:**
```javascript
const eventSource = new EventSource('/api/bot-instances/550e8400-e29b-41d4-a716-446655440000/logs/stream');

eventSource.onmessage = function(event) {
    console.log('Log:', event.data);
};

eventSource.onerror = function(event) {
    console.error('SSE error:', event);
};
```

### 7. Get Instance Runs

**GET** `/api/bot-instances/{instance_id}/runs`

Get all runs for a bot instance.

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "org_id": "dev-user-123",
    "bot_id": "f2f_post",
    "config_id": "550e8400-e29b-41d4-a716-446655440002",
    "schedule_id": null,
    "status": "running",
    "queued_at": "2024-01-15T10:30:00Z",
    "started_at": "2024-01-15T10:30:05Z",
    "finished_at": null,
    "worker_host": "worker-1",
    "image_ref": "bot-f2f_post:latest",
    "exit_code": null,
    "error_code": null,
    "artifacts_url": null,
    "cost_credits": null
  }
]
```

## File Structure

Bot instances are organized in the following directory structure:

```
/data/tenants/{ownerType}-{ownerId}/bots/{instanceId}/
├── secrets/
│   └── storageState.json          # Cookies file
├── inputs/
│   ├── captions.csv              # Caption data
│   └── media/                    # Media files
├── logs/
│   └── run-{timestamp}.log       # Run logs
├── state/
│   └── (bot state files)
└── config.yaml                   # Bot configuration
```

## Configuration Format

The `config.yaml` file contains:

```yaml
bot_code: f2f_post
headless: true
timezone: Europe/Amsterdam
cookies_path: ./secrets/storageState.json
inputs:
  captions_csv: ./inputs/captions.csv
  media_dir: ./inputs/media
phases: []
params: {}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful operation
- `404 Not Found`: Bot instance not found
- `500 Internal Server Error`: Server error

Error responses include a JSON body with error details:

```json
{
  "detail": "Bot instance not found"
}
```

## Celery Integration

The API integrates with Celery for background processing:

### Tasks

- **`tasks.validate_bot`**: Validates bot configuration
- **`tasks.run_bot`**: Executes bot runs

### Task Parameters

**validate_bot:**
```python
validate_bot(instance_id: str, config_dir: str)
```

**run_bot:**
```python
run_bot(image_ref: str, run_id: str, config: dict)
```

## Usage Examples

### Complete Workflow

1. **Get bot instance details:**
   ```bash
   curl http://localhost:8000/api/bot-instances/{instance_id}
   ```

2. **Upload cookies:**
   ```bash
   curl -X POST http://localhost:8000/api/bot-instances/{instance_id}/upload-cookies \
     -F "file=@cookies.json"
   ```

3. **Validate configuration:**
   ```bash
   curl -X POST http://localhost:8000/api/bot-instances/{instance_id}/validate
   ```

4. **Start bot run:**
   ```bash
   curl -X POST http://localhost:8000/api/bot-instances/{instance_id}/start
   ```

5. **Stream logs:**
   ```bash
   curl -N http://localhost:8000/api/bot-instances/{instance_id}/logs/stream
   ```

6. **Stop bot run:**
   ```bash
   curl -X POST http://localhost:8000/api/bot-instances/{instance_id}/stop
   ```

## Development Notes

- All endpoints are server-side only (no UI components)
- Celery tasks are stubbed for development
- Log streaming uses basic file tailing
- Directory structure is created automatically
- Validation checks are basic but extensible

## Future Enhancements

- Real-time container kill signals for stop functionality
- Advanced validation rules
- Log rotation and cleanup
- Performance metrics and monitoring
- Webhook notifications for run completion