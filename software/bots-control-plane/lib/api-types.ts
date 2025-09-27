/**
 * Type definitions for API responses
 */

export interface InvoiceRequest {
  kind: 'creator' | 'agency';
  bots?: string[];
  platforms?: string[];
  models?: number;
}

export interface InvoiceResponse {
  invoice_id: string;
  invoice_url: string;
}

export interface BotInstance {
  id: string;
  bot_code: string;
  status: 'inactive' | 'active' | 'running' | 'error';
  validation_status?: 'valid' | 'invalid' | null;
  last_validated_at?: string;
  created_at: string;
}

export interface Run {
  id: string;
  bot_id: string;
  status: string;
  queued_at: string;
  started_at?: string;
  finished_at?: string;
  exit_code?: number;
  error_code?: string;
  summary_json?: any;
}

export interface MonitoringOverview {
  bots_total: number;
  bots_active: number;
  runs_today: number;
  runs_last_7d: number;
  errors_last_24h: number;
}

export interface Phase {
  id: string;
  bot_instance_id: string;
  name: string;
  order_no: number;
  config_json: any;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  bot_instance_id: string;
  kind: 'full' | 'phase';
  phase_id?: string;
  payload_json?: any;
  start_at: string;
  dispatched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  status: string;
  plan: string;
  entitlements_json?: any;
  current_period_end?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  provider: string;
  status: string;
  amount_eur: number;
  url?: string;
  ext_id?: string;
  owner_type: string;
  owner_id: string;
  created_at: string;
  paid_at?: string;
}

export interface AffiliateInfo {
  code: string;
  clicks_count: number;
  signups_count: number;
  paid_total_eur: number;
}