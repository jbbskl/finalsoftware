-- Initial database schema for bot management platform
-- This migration creates the core tables for users, organizations, subscriptions, and bot management

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(36) PRIMARY KEY,
    owner_user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS org_members (
    org_id VARCHAR(36) REFERENCES organizations(id),
    user_id VARCHAR(36) REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (org_id, user_id)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL REFERENCES organizations(id),
    status VARCHAR(50) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    entitlements_json JSONB,
    current_period_end TIMESTAMP WITH TIME ZONE
);

-- Entitlements table (for tracking what each subscription allows)
CREATE TABLE IF NOT EXISTS entitlements (
    id VARCHAR(36) PRIMARY KEY,
    subscription_id VARCHAR(36) NOT NULL REFERENCES subscriptions(id),
    resource_type VARCHAR(100) NOT NULL,
    resource_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot instances table (renamed from bots to match requirements)
CREATE TABLE IF NOT EXISTS bot_instances (
    id VARCHAR(36) PRIMARY KEY,
    org_id VARCHAR(36) NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'inactive',
    config_dir VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Runs table
CREATE TABLE IF NOT EXISTS runs (
    id VARCHAR(36) PRIMARY KEY,
    bot_instance_id VARCHAR(36) NOT NULL REFERENCES bot_instances(id),
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    worker_host VARCHAR(255),
    exit_code INTEGER,
    error_code VARCHAR(100),
    logs_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_bot_instances_org ON bot_instances(org_id);
CREATE INDEX IF NOT EXISTS idx_runs_bot_instance ON runs(bot_instance_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_queued_at ON runs(queued_at);