from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

# BotConfig schemas
class BotConfigCreate(BaseModel):
    bot_id: str
    name: str
    config_json: Dict[str, Any]
    is_default: bool = False

class BotConfigRead(BaseModel):
    id: str
    org_id: str
    bot_id: str
    name: str
    config_json: Dict[str, Any]
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schedule schemas
class ScheduleCreate(BaseModel):
    bot_id: str
    config_id: str
    cron_expr: str
    timezone: str = "UTC"
    phase_json: Optional[Dict[str, Any]] = None
    is_active: bool = True

class ScheduleRead(BaseModel):
    id: str
    org_id: str
    bot_id: str
    config_id: str
    cron_expr: str
    timezone: str
    phase_json: Optional[Dict[str, Any]]
    is_active: bool
    next_fire_at: datetime

    class Config:
        from_attributes = True

# Run schemas
class RunCreate(BaseModel):
    bot_id: str
    config_id: str
    schedule_id: Optional[str] = None
    image_ref: str

class RunRead(BaseModel):
    id: str
    org_id: str
    bot_id: str
    config_id: str
    schedule_id: Optional[str]
    status: str
    queued_at: datetime
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    worker_host: Optional[str]
    image_ref: str
    exit_code: Optional[int]
    error_code: Optional[str]
    artifacts_url: Optional[str]
    cost_credits: Optional[int]

    class Config:
        from_attributes = True

# RunEvent schemas
class RunEventRead(BaseModel):
    id: str
    run_id: str
    ts: datetime
    level: str
    code: Optional[str]
    message: str
    data_json: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True

# Dev run endpoint schema
class DevRunRequest(BaseModel):
    image_ref: str
    run_id: str
    config: Dict[str, Any]

class DevRunResponse(BaseModel):
    enqueued: bool
    run_id: str
