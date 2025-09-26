export type ID = string
export type Status = "queued" | "running" | "success" | "error"
export type RunStatus = Status // Alias for backward compatibility
export type PlatformKey = "f2f" | "onlyfans" | "fanvue" | "fancentro" | "fansly"

export type Bot = {
  id: ID
  key: string
  name: string
  platform: PlatformKey
  kind: "posting" | "mass_dm"
  audience: "creators" | "agencies"
  comingSoon?: boolean
  current_version?: string
  enabled?: boolean
  description?: string
  type?: string // For compatibility with database
  status?: string // For compatibility with database
}

export type Platform = {
  id: string
  name: string
  bots: Bot[]
  comingSoon?: boolean
  description?: string
}

export type SubscriptionEntitlements = {
  models: number // how many "models" the org manages
  scriptsPerModel: number // how many scripts per model are enabled
  pricePerScriptPerModel: number // resolved via pricing function
  concurrency: number // max concurrent runs
}

export type Subscription = {
  id: ID
  plan: "custom" | "free" | "premium" | "enterprise"
  status: "active" | "past_due" | "canceled"
  entitlements: SubscriptionEntitlements
  nextRenewalAt: string // ISO
  monthlyTotal: number | string // computed
  // New fields for updated interface
  features?: string[]
  maxBots?: number
  maxConfigs?: number
  price?: number
  billingCycle?: "monthly" | "yearly"
  startDate?: string
  endDate?: string
  createdAt?: string
}

export type Schedule = {
  id: ID
  bot_id: ID
  config_id?: ID
  name: string
  cron_expr: string
  timezone: string
  is_active: boolean
  next_fire_at?: string
  // calendar convenience:
  days?: Array<{ date: string; runs: number }>
}

export type Run = {
  id: ID
  bot_id: ID
  status: Status
  queued_at?: string
  started_at?: string
  finished_at?: string
  image_ref?: string
  exit_code?: number
  artifacts?: string[]
  bot_name?: string
  platform?: string
  config_name?: string
  duration?: number // Duration in seconds
}

export type RunEvent = {
  id: number
  run_id: ID
  ts: string
  level: "info" | "warn" | "error"
  code: string
  message: string
  data_json?: any
}

export type KPIData = {
  active_runs: number
  scheduled_this_week: number
  bots_enabled: number
  failed_24h: number
  // New fields for updated dashboard
  total_bots: number
  active_bots: number
  success_rate: number
  monthly_revenue: number
  total_runs: number
  failed_runs: number
  avg_duration: number
}

export type ChartDataPoint = {
  time: string
  runs: number
}

export type AnalyticsData = {
  total_runs: number
  success_rate: number
  avg_duration: number
  concurrent_peak: number
  runs_over_time: ChartDataPoint[]
  success_vs_failure: { success: number; failure: number }
  duration_per_bot: { bot_name: string; avg_duration: number }[]
}

export type NotificationSettings = {
  email_enabled: boolean
  webhook_enabled: boolean
  webhook_url?: string
  notify_on_failure: boolean
  notify_on_success: boolean
  notify_on_schedule: boolean
}

export type Organization = {
  id: string
  name: string
  timezone: string
}

export type Secret = {
  name: string
  provider: string
  last_used?: string
}

export type Cookie = {
  label: string
  bot: string
  stored_at: string
  expires_at?: string
  status: "active" | "expired"
}

export type BillingHistory = {
  id: string
  date: string
  amount: number
  description: string
  status: "paid" | "pending" | "failed"
}

export type PaymentMethod = {
  id: string
  type: "card" | "bank"
  last4?: string
  brand?: string
  expiry?: string
  is_default: boolean
}

// Bot Configuration type
export type BotConfig = {
  id: ID
  name: string
  bot_id: ID
  bot_name: string
  config_data: Record<string, any>
  is_default: boolean
  created_at: string
  updated_at: string
  description?: string
  tags?: string[]
  environment?: "development" | "staging" | "production"
}

// Pricing logic helpers
export function pricePerScriptPerModel(models: number): number | "enterprise" {
  if (models > 25) return "enterprise"
  if (models > 20) return 30
  if (models > 15) return 35
  if (models > 10) return 40
  if (models > 5) return 45
  return 50
}

export function monthlyTotal(models: number, scriptsPerModel: number): number | string {
  const p = pricePerScriptPerModel(models)
  if (p === "enterprise") return "Contact sales"
  return models * scriptsPerModel * p
}

export function calculateConcurrency(models: number): number {
  return Math.min(6, 2 + Math.floor(models / 5))
}
