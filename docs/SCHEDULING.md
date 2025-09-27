# Phases & Scheduling Guide

This document describes the phases and scheduling system for bot instances, including API usage, time rules, and Celery Beat integration.

## Overview

The scheduling system allows users to:
- Define phases for bot instances with specific configurations
- Schedule full runs or individual phases
- Copy schedules between days
- Automatically dispatch runs at scheduled times via Celery Beat

## Database Schema

### Phases Table

```sql
CREATE TABLE phases (
    id VARCHAR(36) PRIMARY KEY,
    bot_instance_id VARCHAR(36) NOT NULL REFERENCES bot_instances(id),
    name VARCHAR(255) NOT NULL,
    order_no INTEGER NOT NULL CHECK (order_no >= 1 AND order_no <= 200),
    config_json JSON NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ix_phases_bot_instance_order ON phases(bot_instance_id, order_no);
```

### Schedules Table

```sql
CREATE TABLE schedules (
    id VARCHAR(36) PRIMARY KEY,
    bot_instance_id VARCHAR(36) NOT NULL REFERENCES bot_instances(id),
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('full', 'phase')),
    phase_id VARCHAR(36) REFERENCES phases(id),
    payload_json JSON,
    start_at TIMESTAMPTZ NOT NULL,
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK ((kind = 'full') OR (kind = 'phase' AND phase_id IS NOT NULL))
);

CREATE INDEX ix_schedules_bot_instance_start ON schedules(bot_instance_id, start_at);
CREATE INDEX ix_schedules_start_dispatched ON schedules(start_at, dispatched_at);
```

## Time Rules

### Create Rule: ≥1 Hour Advance
- Schedules must be created at least 1 hour in advance
- Prevents last-minute scheduling conflicts
- Enforced in API validation

### Delete Rule: ≥10 Minutes Before Start
- Schedules can only be deleted at least 10 minutes before start time
- Prevents disruption of imminent runs
- Enforced in API validation

### Timezone Configuration
- Default timezone: `Europe/Amsterdam`
- Configurable via `APP_TZ` environment variable
- All times are stored in UTC, displayed in app timezone

## Phase Configuration Examples

### Basic Phase Config
```json
{
  "type": "posting",
  "media_count": 5,
  "caption_template": "Check out this content! #{hashtag}",
  "hashtags": ["#automation", "#content"],
  "delay_minutes": 30
}
```

### DM Phase Config
```json
{
  "type": "mass_dm",
  "recipient_list": "./inputs/recipients.csv",
  "message_template": "Hi {name}! Thanks for following.",
  "delay_seconds": 60,
  "max_per_hour": 20
}
```

### Validation Phase Config
```json
{
  "type": "validation",
  "check_cookies": true,
  "check_media": true,
  "required_files": ["captions.csv", "media/"]
}
```

## API Endpoints

### Phases API

#### List Phases
```http
GET /api/bot-instances/{instance_id}/phases
```

**Response:**
```json
[
  {
    "id": "phase-uuid",
    "bot_instance_id": "instance-uuid",
    "name": "Morning Posting",
    "order_no": 1,
    "config_json": {
      "type": "posting",
      "media_count": 3
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

#### Create Phase
```http
POST /api/bot-instances/{instance_id}/phases
Content-Type: application/json

{
  "name": "Evening Engagement",
  "order_no": 2,
  "config_json": {
    "type": "engagement",
    "target_count": 50
  }
}
```

#### Update Phase
```http
PUT /api/phases/{phase_id}
Content-Type: application/json

{
  "name": "Updated Phase Name",
  "order_no": 3
}
```

#### Delete Phase
```http
DELETE /api/phases/{phase_id}
```

**Validation:**
- `order_no` must be between 1 and 200
- Cannot delete phase if referenced by future schedules
- `config_json` must be valid JSON object

### Schedules API

#### List Schedules
```http
GET /api/schedules?botInstanceId={id}&from=2024-01-15&to=2024-01-16
```

**Response:**
```json
[
  {
    "id": "schedule-uuid",
    "bot_instance_id": "instance-uuid",
    "kind": "full",
    "phase_id": null,
    "payload_json": {
      "priority": "high"
    },
    "start_at": "2024-01-15T14:30:00Z",
    "dispatched_at": null,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

#### Create Full Run Schedule
```http
POST /api/schedules
Content-Type: application/json

{
  "bot_instance_id": "instance-uuid",
  "kind": "full",
  "start_at": "2024-01-15 15:30",
  "payload_json": {
    "priority": "high",
    "notify_on_completion": true
  }
}
```

#### Create Phase Schedule
```http
POST /api/schedules
Content-Type: application/json

{
  "bot_instance_id": "instance-uuid",
  "kind": "phase",
  "phase_id": "phase-uuid",
  "start_at": "2024-01-15 16:00",
  "payload_json": {
    "override_config": {
      "media_count": 10
    }
  }
}
```

#### Update Schedule
```http
PATCH /api/schedules/{schedule_id}
Content-Type: application/json

{
  "start_at": "2024-01-15 17:00",
  "payload_json": {
    "priority": "medium"
  }
}
```

#### Delete Schedule
```http
DELETE /api/schedules/{schedule_id}
```

#### Copy Day Schedules
```http
POST /api/schedules/copy-day
Content-Type: application/json

{
  "bot_instance_id": "instance-uuid",
  "from_date": "2024-01-15",
  "to_date": "2024-01-16"
}
```

**Response:**
```json
{
  "copied_count": 3,
  "skipped_count": 1
}
```

## Celery Beat Integration

### Beat Service Configuration

The Celery Beat service runs every 60 seconds to scan for due schedules:

```yaml
# docker-compose.yml
beat:
  build: ../services/worker
  command: celery -A celery_app beat -l info
  environment:
    - CELERY_BROKER_URL=redis://redis:6379/0
    - CELERY_RESULT_BACKEND=redis://redis:6379/0
    - DATABASE_URL=postgresql+psycopg://app:app@db:5432/app
```

### Scanning Window

- **Scan Frequency:** Every 60 seconds
- **Dispatch Window:** 2 minutes (now ± 2 minutes)
- **Idempotency:** Prevents duplicate runs at the same minute

### Dispatch Process

1. **Scan:** Query schedules with `start_at <= now` and `start_at > now - 2 minutes`
2. **Filter:** Only undispatched schedules (`dispatched_at IS NULL`)
3. **Check:** Verify no existing runs at the same time
4. **Create:** Insert new `runs` row with status='queued'
5. **Dispatch:** Call `run_bot` Celery task with schedule metadata
6. **Mark:** Set `dispatched_at = now()` to prevent re-dispatch

### Idempotency Key Logic

The system prevents duplicate dispatches using:
- **Time-based:** Same bot instance + same minute
- **Status check:** Only schedule if no queued/running runs exist
- **Database constraint:** Unique combination prevents conflicts

## Usage Examples

### Complete Workflow

1. **Create Phases:**
   ```bash
   curl -X POST http://localhost:8000/api/bot-instances/instance-123/phases \
     -H "Content-Type: application/json" \
     -d '{"name": "Morning Posts", "order_no": 1, "config_json": {"type": "posting", "count": 3}}'
   ```

2. **Schedule Full Run:**
   ```bash
   curl -X POST http://localhost:8000/api/schedules \
     -H "Content-Type: application/json" \
     -d '{"bot_instance_id": "instance-123", "kind": "full", "start_at": "2024-01-15 15:00"}'
   ```

3. **Schedule Phase:**
   ```bash
   curl -X POST http://localhost:8000/api/schedules \
     -H "Content-Type: application/json" \
     -d '{"bot_instance_id": "instance-123", "kind": "phase", "phase_id": "phase-456", "start_at": "2024-01-15 16:00"}'
   ```

4. **Copy Day:**
   ```bash
   curl -X POST http://localhost:8000/api/schedules/copy-day \
     -H "Content-Type: application/json" \
     -d '{"bot_instance_id": "instance-123", "from_date": "2024-01-15", "to_date": "2024-01-16"}'
   ```

### Error Handling

**Create Schedule Too Soon:**
```json
{
  "detail": "Schedule must be created at least 1 hour in advance"
}
```

**Delete Schedule Too Late:**
```json
{
  "detail": "Schedule can only be deleted at least 10 minutes before start time"
}
```

**Phase Referenced by Schedule:**
```json
{
  "detail": "Cannot delete phase: 2 future schedule(s) reference it"
}
```

## Monitoring and Debugging

### Beat Logs
```bash
docker logs beat -f
```

### Schedule Status
Check `dispatched_at` field to see if schedule was processed:
- `NULL`: Not yet dispatched
- `timestamp`: Dispatched at specific time

### Run Tracking
Monitor `runs` table for:
- `status`: queued → running → success/error
- `summary_json`: Contains schedule metadata
- `schedule_id`: Links back to original schedule

## Best Practices

1. **Phase Design:**
   - Keep phases focused on single tasks
   - Use descriptive names and order numbers
   - Validate config_json structure

2. **Scheduling:**
   - Create schedules well in advance (1+ hours)
   - Use copy-day for recurring patterns
   - Monitor dispatched_at for processing confirmation

3. **Error Handling:**
   - Check schedule status before critical times
   - Use payload_json for run-specific overrides
   - Monitor run logs for execution details

4. **Performance:**
   - Batch similar schedules together
   - Use appropriate time intervals (avoid sub-minute scheduling)
   - Monitor Beat service health and logs