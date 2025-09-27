from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Text, JSON, CheckConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    email = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String(36), primary_key=True)
    owner_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User")

class OrgMember(Base):
    __tablename__ = "org_members"
    
    org_id = Column(String(36), ForeignKey("organizations.id"), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id"), primary_key=True)
    role = Column(String(50), nullable=False)

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String(36), primary_key=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    status = Column(String(50), nullable=False)
    plan = Column(String(50), nullable=False)
    entitlements_json = Column(JSON, nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)

class Bot(Base):
    __tablename__ = "bots"
    
    id = Column(String(36), primary_key=True)
    key = Column(String(100), nullable=False, unique=True)
    name = Column(String(255), nullable=False)
    current_version = Column(String(36), ForeignKey("bot_versions.id"), nullable=True)

class BotVersion(Base):
    __tablename__ = "bot_versions"
    
    id = Column(String(36), primary_key=True)
    bot_id = Column(String(36), ForeignKey("bots.id"), nullable=False)
    image_ref = Column(String(255), nullable=False)
    changelog = Column(Text, nullable=True)

class OrgBotEnable(Base):
    __tablename__ = "org_bot_enables"
    
    org_id = Column(String(36), ForeignKey("organizations.id"), primary_key=True)
    bot_id = Column(String(36), ForeignKey("bots.id"), primary_key=True)
    version_id = Column(String(36), ForeignKey("bot_versions.id"), nullable=False)

class BotConfig(Base):
    __tablename__ = "bot_configs"
    
    id = Column(String(36), primary_key=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    bot_id = Column(String(36), ForeignKey("bots.id"), nullable=False)
    name = Column(String(255), nullable=False)
    config_json = Column(JSON, nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(String(36), primary_key=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    bot_id = Column(String(36), ForeignKey("bots.id"), nullable=False)
    config_id = Column(String(36), ForeignKey("bot_configs.id"), nullable=False)
    cron_expr = Column(String(100), nullable=False)
    timezone = Column(String(50), nullable=False, default="UTC")
    phase_json = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    next_fire_at = Column(DateTime(timezone=True), nullable=False)

class Run(Base):
    __tablename__ = "runs"
    
    id = Column(String(36), primary_key=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    bot_id = Column(String(36), ForeignKey("bots.id"), nullable=False)
    config_id = Column(String(36), ForeignKey("bot_configs.id"), nullable=False)
    schedule_id = Column(String(36), ForeignKey("schedules.id"), nullable=True)
    status = Column(String(50), nullable=False, default="queued")
    queued_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    worker_host = Column(String(255), nullable=True)
    image_ref = Column(String(255), nullable=False)
    exit_code = Column(Integer, nullable=True)
    error_code = Column(String(100), nullable=True)
    artifacts_url = Column(String(500), nullable=True)
    cost_credits = Column(Integer, nullable=True)

class RunEvent(Base):
    __tablename__ = "run_events"
    
    id = Column(String(36), primary_key=True)
    run_id = Column(String(36), ForeignKey("runs.id"), nullable=False)
    ts = Column(DateTime(timezone=True), server_default=func.now())
    level = Column(String(20), nullable=False)
    code = Column(String(100), nullable=True)
    message = Column(Text, nullable=False)
    data_json = Column(JSON, nullable=True)

class Cookie(Base):
    __tablename__ = "cookies"
    
    id = Column(String(36), primary_key=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    bot_id = Column(String(36), ForeignKey("bots.id"), nullable=False)
    label = Column(String(255), nullable=False)
    stored_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_check_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, default="active")

class Secret(Base):
    __tablename__ = "secrets"
    
    id = Column(String(36), primary_key=True)
    org_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)
    secret_ref = Column(String(500), nullable=False)

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(String(36), primary_key=True)
    provider = Column(String(50), nullable=False)  # 'stripe' or 'crypto'
    status = Column(String(50), nullable=False, default='pending')  # 'pending', 'paid', 'failed'
    amount_eur = Column(Integer, nullable=False)  # Amount in cents
    url = Column(String(500), nullable=True)  # Payment URL
    ext_id = Column(String(255), nullable=True)  # External provider ID (Stripe invoice ID, etc.)
    owner_type = Column(String(20), nullable=False)  # 'user' or 'org'
    owner_id = Column(String(36), nullable=False)  # User ID or Org ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)

class Entitlement(Base):
    __tablename__ = "entitlements"
    
    id = Column(String(36), primary_key=True)
    owner_type = Column(String(20), nullable=False)  # 'user' or 'org'
    owner_id = Column(String(36), nullable=False)  # User ID or Org ID
    bot_code = Column(String(50), nullable=False)  # 'f2f_post', 'f2f_dm', 'of_post', etc.
    units = Column(Integer, nullable=False)  # Number of units (models for agency, 1 for creator)
    status = Column(String(50), nullable=False, default='active')  # 'active', 'inactive', 'expired'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

class BotInstance(Base):
    __tablename__ = "bot_instances"
    
    id = Column(String(36), primary_key=True)
    owner_type = Column(String(20), nullable=False)  # 'user' or 'org'
    owner_id = Column(String(36), nullable=False)  # User ID or Org ID
    bot_code = Column(String(50), nullable=False)  # 'f2f_post', 'f2f_dm', 'of_post', etc.
    status = Column(String(50), nullable=False, default='inactive')  # 'inactive', 'active', 'error'
    config_path = Column(String(500), nullable=False)  # Path to config.yaml
    validation_status = Column(String(50), nullable=True)  # 'pending', 'valid', 'invalid'
    last_validated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Phase(Base):
    __tablename__ = "phases"
    
    id = Column(String(36), primary_key=True)
    bot_instance_id = Column(String(36), ForeignKey("bot_instances.id"), nullable=False)
    name = Column(String(255), nullable=False)
    order_no = Column(Integer, nullable=False)
    config_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    bot_instance = relationship("BotInstance")
    
    # Constraints
    __table_args__ = (
        CheckConstraint("order_no >= 1 AND order_no <= 200", name="ck_phase_order_range"),
        Index("ix_phases_bot_instance_order", "bot_instance_id", "order_no"),
    )

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(String(36), primary_key=True)
    bot_instance_id = Column(String(36), ForeignKey("bot_instances.id"), nullable=False)
    kind = Column(String(20), nullable=False)  # 'full' or 'phase'
    phase_id = Column(String(36), ForeignKey("phases.id"), nullable=True)
    payload_json = Column(JSON, nullable=True)
    start_at = Column(DateTime(timezone=True), nullable=False)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    bot_instance = relationship("BotInstance")
    phase = relationship("Phase")
    
    # Constraints and indexes
    __table_args__ = (
        CheckConstraint("(kind = 'full') OR (kind = 'phase' AND phase_id IS NOT NULL)", name="ck_schedule_kind_phase"),
        Index("ix_schedules_bot_instance_start", "bot_instance_id", "start_at"),
        Index("ix_schedules_start_dispatched", "start_at", "dispatched_at"),
    )
