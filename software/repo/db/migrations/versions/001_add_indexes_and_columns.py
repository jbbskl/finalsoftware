"""Add essential indexes and minor schema columns

Revision ID: 001_add_indexes_and_columns
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_indexes_and_columns'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Add indexes and columns for performance and functionality."""
    
    # Add indexes for runs table
    op.create_index(
        'idx_runs_bot_instance_id_started_at',
        'runs',
        ['bot_instance_id', 'started_at'],
        postgresql_using='btree'
    )
    
    # Add indexes for schedules table
    op.create_index(
        'idx_schedules_bot_instance_id_start_at',
        'schedules',
        ['bot_instance_id', 'start_at'],
        postgresql_using='btree'
    )
    
    # Add indexes for bot_instances table
    op.create_index(
        'idx_bot_instances_owner_type_owner_id_bot_code',
        'bot_instances',
        ['owner_type', 'owner_id', 'bot_code'],
        postgresql_using='btree'
    )
    
    # Add indexes for invoices table
    op.create_index(
        'idx_invoices_status_paid_at',
        'invoices',
        ['status', 'paid_at'],
        postgresql_using='btree'
    )
    
    # Add indexes for subscriptions table
    op.create_index(
        'idx_subscriptions_org_id_status',
        'subscriptions',
        ['org_id', 'status'],
        postgresql_using='btree'
    )
    
    # Add indexes for phases table
    op.create_index(
        'idx_phases_bot_instance_id_order_no',
        'phases',
        ['bot_instance_id', 'order_no'],
        postgresql_using='btree'
    )
    
    # Add validation columns to bot_instances if they don't exist
    # Check if columns exist first
    conn = op.get_bind()
    
    # Check if validation_status column exists
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('bot_instances')]
    
    if 'validation_status' not in columns:
        op.add_column('bot_instances', sa.Column('validation_status', sa.String(20), nullable=True))
    
    if 'last_validated_at' not in columns:
        op.add_column('bot_instances', sa.Column('last_validated_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add dispatched_at column to schedules if it doesn't exist
    schedule_columns = [col['name'] for col in inspector.get_columns('schedules')]
    if 'dispatched_at' not in schedule_columns:
        op.add_column('schedules', sa.Column('dispatched_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add schedule_id column to runs if it doesn't exist
    run_columns = [col['name'] for col in inspector.get_columns('runs')]
    if 'schedule_id' not in run_columns:
        op.add_column('runs', sa.Column('schedule_id', sa.String(100), nullable=True))
        
        # Add foreign key constraint
        op.create_foreign_key(
            'fk_runs_schedule_id',
            'runs',
            'schedules',
            ['schedule_id'],
            ['id'],
            ondelete='SET NULL'
        )
    
    # Add webhook_events table for idempotency
    op.create_table(
        'webhook_events',
        sa.Column('id', sa.String(100), primary_key=True),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('event_id', sa.String(100), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('processed', sa.Boolean, nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.UniqueConstraint('provider', 'event_id', name='uq_webhook_events_provider_event_id')
    )
    
    # Add index for webhook_events
    op.create_index(
        'idx_webhook_events_provider_event_id',
        'webhook_events',
        ['provider', 'event_id'],
        postgresql_using='btree'
    )
    
    # Add audit_logs table for security auditing
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
        sa.Column('metadata', sa.JSON, nullable=True)
    )
    
    # Add indexes for audit_logs
    op.create_index(
        'idx_audit_logs_user_id_created_at',
        'audit_logs',
        ['user_id', 'created_at'],
        postgresql_using='btree'
    )
    
    op.create_index(
        'idx_audit_logs_action_created_at',
        'audit_logs',
        ['action', 'created_at'],
        postgresql_using='btree'
    )
    
    op.create_index(
        'idx_audit_logs_resource_type_resource_id',
        'audit_logs',
        ['resource_type', 'resource_id'],
        postgresql_using='btree'
    )


def downgrade():
    """Remove indexes and columns."""
    
    # Drop indexes
    op.drop_index('idx_audit_logs_resource_type_resource_id', 'audit_logs')
    op.drop_index('idx_audit_logs_action_created_at', 'audit_logs')
    op.drop_index('idx_audit_logs_user_id_created_at', 'audit_logs')
    op.drop_index('idx_webhook_events_provider_event_id', 'webhook_events')
    op.drop_index('idx_phases_bot_instance_id_order_no', 'phases')
    op.drop_index('idx_subscriptions_org_id_status', 'subscriptions')
    op.drop_index('idx_invoices_status_paid_at', 'invoices')
    op.drop_index('idx_bot_instances_owner_type_owner_id_bot_code', 'bot_instances')
    op.drop_index('idx_schedules_bot_instance_id_start_at', 'schedules')
    op.drop_index('idx_runs_bot_instance_id_started_at', 'runs')
    
    # Drop tables
    op.drop_table('audit_logs')
    op.drop_table('webhook_events')
    
    # Drop foreign key constraints
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Check if schedule_id column exists in runs
    run_columns = [col['name'] for col in inspector.get_columns('runs')]
    if 'schedule_id' in run_columns:
        op.drop_constraint('fk_runs_schedule_id', 'runs', type_='foreignkey')
        op.drop_column('runs', 'schedule_id')
    
    # Drop columns from schedules
    schedule_columns = [col['name'] for col in inspector.get_columns('schedules')]
    if 'dispatched_at' in schedule_columns:
        op.drop_column('schedules', 'dispatched_at')
    
    # Drop columns from bot_instances
    bot_columns = [col['name'] for col in inspector.get_columns('bot_instances')]
    if 'last_validated_at' in bot_columns:
        op.drop_column('bot_instances', 'last_validated_at')
    if 'validation_status' in bot_columns:
        op.drop_column('bot_instances', 'validation_status')