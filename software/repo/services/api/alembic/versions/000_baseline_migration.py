"""Baseline migration - create all tables

Revision ID: 000_baseline_migration
Revises: 
Create Date: 2024-01-15 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '000_baseline_migration'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Create all baseline tables."""
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('role', sa.String(20), nullable=False, default='creator'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('owner_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create org_members table
    op.create_table(
        'org_members',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('user_id', sa.String(36), nullable=False),
        sa.Column('role', sa.String(50), nullable=False)
    )
    
    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('plan', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True)
    )
    
    # Create bots table
    op.create_table(
        'bots',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('current_version', sa.String(36), nullable=True)
    )
    
    # Create bot_versions table
    op.create_table(
        'bot_versions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('bot_id', sa.String(36), nullable=False),
        sa.Column('version', sa.String(50), nullable=False),
        sa.Column('image_ref', sa.String(255), nullable=False),
        sa.Column('config_schema', postgresql.JSON, nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Create org_bot_enable table
    op.create_table(
        'org_bot_enable',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('bot_id', sa.String(36), nullable=False),
        sa.Column('is_enabled', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Create bot_configs table
    op.create_table(
        'bot_configs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('bot_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('config_json', postgresql.JSON, nullable=False),
        sa.Column('is_default', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create runs table
    op.create_table(
        'runs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('bot_id', sa.String(36), nullable=False),
        sa.Column('config_id', sa.String(36), nullable=False),
        sa.Column('schedule_id', sa.String(36), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, default='queued'),
        sa.Column('queued_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('image_ref', sa.String(255), nullable=True),
        sa.Column('summary_json', postgresql.JSON, nullable=True)
    )
    
    # Create run_events table
    op.create_table(
        'run_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('run_id', sa.String(36), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('data_json', postgresql.JSON, nullable=True)
    )
    
    # Create cookies table
    op.create_table(
        'cookies',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('bot_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('path', sa.String(500), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Create secrets table
    op.create_table(
        'secrets',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('bot_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('path', sa.String(500), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Create invoices table
    op.create_table(
        'invoices',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('provider_invoice_id', sa.String(255), nullable=True),
        sa.Column('amount_cents', sa.Integer, nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, default='EUR'),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('invoice_url', sa.String(500), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create entitlements table
    op.create_table(
        'entitlements',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), nullable=False),
        sa.Column('bot_code', sa.String(50), nullable=False),
        sa.Column('units', sa.Integer, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True)
    )
    
    # Create bot_instances table
    op.create_table(
        'bot_instances',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('owner_type', sa.String(20), nullable=False),
        sa.Column('owner_id', sa.String(36), nullable=False),
        sa.Column('bot_code', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='inactive'),
        sa.Column('config_path', sa.String(500), nullable=False),
        sa.Column('validation_status', sa.String(50), nullable=True),
        sa.Column('last_validated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create phases table
    op.create_table(
        'phases',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('bot_instance_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('order_no', sa.Integer, nullable=False),
        sa.Column('config_json', postgresql.JSON, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create schedules table
    op.create_table(
        'schedules',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('bot_instance_id', sa.String(36), nullable=False),
        sa.Column('kind', sa.String(20), nullable=False),
        sa.Column('phase_id', sa.String(36), nullable=True),
        sa.Column('payload_json', postgresql.JSON, nullable=True),
        sa.Column('start_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('dispatched_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    
    # Create webhook_events table
    op.create_table(
        'webhook_events',
        sa.Column('id', sa.String(100), primary_key=True),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('event_id', sa.String(100), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('processed', sa.Boolean, nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text, nullable=True)
    )
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(100), primary_key=True),
        sa.Column('user_id', sa.String(100), nullable=True),
        sa.Column('user_role', sa.String(20), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=True),
        sa.Column('resource_id', sa.String(100), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('success', sa.Boolean, nullable=False),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metadata', postgresql.JSON, nullable=True)
    )


def downgrade():
    """Drop all tables."""
    op.drop_table('audit_logs')
    op.drop_table('webhook_events')
    op.drop_table('schedules')
    op.drop_table('phases')
    op.drop_table('bot_instances')
    op.drop_table('entitlements')
    op.drop_table('invoices')
    op.drop_table('secrets')
    op.drop_table('cookies')
    op.drop_table('run_events')
    op.drop_table('runs')
    op.drop_table('bot_configs')
    op.drop_table('org_bot_enable')
    op.drop_table('bot_versions')
    op.drop_table('bots')
    op.drop_table('subscriptions')
    op.drop_table('org_members')
    op.drop_table('organizations')
    op.drop_table('users')