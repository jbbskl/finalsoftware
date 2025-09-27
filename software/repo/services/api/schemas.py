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

# Billing schemas
class InvoiceCreateCreator(BaseModel):
    kind: str = "creator"
    bots: list[str]

class InvoiceCreateAgency(BaseModel):
    kind: str = "agency"
    platforms: list[str]
    models: int

class InvoiceResponse(BaseModel):
    invoice_id: str
    invoice_url: str

class InvoiceRead(BaseModel):
    id: str
    provider: str
    status: str
    amount_eur: int
    url: Optional[str]
    ext_id: Optional[str]
    owner_type: str
    owner_id: str
    created_at: datetime
    paid_at: Optional[datetime]

    class Config:
        from_attributes = True

class EntitlementRead(BaseModel):
    id: str
    owner_type: str
    owner_id: str
    bot_code: str
    units: int
    status: str
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True

class BotInstanceRead(BaseModel):
    id: str
    owner_type: str
    owner_id: str
    bot_code: str
    status: str
    config_path: str
    validation_status: Optional[str]
    last_validated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UploadCookiesResponse(BaseModel):
    ok: bool = True

class ValidateResponse(BaseModel):
    job_id: Optional[str] = None
    status: str  # 'queued' or 'completed'
    result: Optional[dict] = None

class StartRunResponse(BaseModel):
    run_id: str
    status: str  # 'queued'

class StopRunResponse(BaseModel):
    ok: bool = True

# Phase schemas
class PhaseCreate(BaseModel):
    name: str
    order_no: int
    config_json: Dict[str, Any]

class PhaseUpdate(BaseModel):
    name: Optional[str] = None
    order_no: Optional[int] = None
    config_json: Optional[Dict[str, Any]] = None

class PhaseRead(BaseModel):
    id: str
    bot_instance_id: str
    name: str
    order_no: int
    config_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schedule schemas
class ScheduleCreate(BaseModel):
    bot_instance_id: str
    kind: str  # 'full' or 'phase'
    phase_id: Optional[str] = None
    start_at: str  # ISO datetime string
    payload_json: Optional[Dict[str, Any]] = None

class ScheduleUpdate(BaseModel):
    start_at: Optional[str] = None
    payload_json: Optional[Dict[str, Any]] = None

class ScheduleRead(BaseModel):
    id: str
    bot_instance_id: str
    kind: str
    phase_id: Optional[str]
    payload_json: Optional[Dict[str, Any]]
    start_at: datetime
    dispatched_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CopyDayRequest(BaseModel):
    bot_instance_id: str
    from_date: str  # YYYY-MM-DD
    to_date: str    # YYYY-MM-DD

class CopyDayResponse(BaseModel):
    copied_count: int
    skipped_count: int

# Bot Instance schemas
class BotInstanceRead(BaseModel):
    id: str
    owner_type: str
    owner_id: str
    bot_code: str
    status: str
    config_path: str
    validation_status: Optional[str]
    last_validated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Phase schemas
class PhaseCreate(BaseModel):
    bot_instance_id: str
    name: str
    order_no: int
    config_json: Dict[str, Any]

class PhaseUpdate(BaseModel):
    name: Optional[str] = None
    order_no: Optional[int] = None
    config_json: Optional[Dict[str, Any]] = None

class PhaseRead(BaseModel):
    id: str
    bot_instance_id: str
    name: str
    order_no: int
    config_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Bot instance operation responses
class UploadCookiesResponse(BaseModel):
    success: bool
    message: str

class ValidateResponse(BaseModel):
    success: bool
    message: str
    validation_status: Optional[str] = None

class StartRunResponse(BaseModel):
    run_id: str
    status: str

class StopRunResponse(BaseModel):
    success: bool
    message: str
