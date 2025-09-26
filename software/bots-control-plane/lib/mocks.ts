import type { 
  Bot, 
  Platform, 
  Subscription, 
  SubscriptionEntitlements, 
  Schedule, 
  Run, 
  RunEvent, 
  KPIData, 
  AnalyticsData, 
  BillingHistory, 
  PaymentMethod,
  Organization,
  Secret,
  Cookie,
  NotificationSettings
} from './types'

// Platform catalog with all bots
export const platforms: Platform[] = [
  {
    id: "f2f",
    name: "F2F",
    description: "F2F platform automation",
    bots: [
      {
        id: "f2f-posting-creators",
        key: "f2f_posting_creators",
        name: "Posting Bot",
        platform: "f2f",
        kind: "posting",
        audience: "creators",
        description: "Automated content posting for creators",
        enabled: true,
        current_version: "2.1.0"
      },
      {
        id: "f2f-mass-dm-creators",
        key: "f2f_mass_dm_creators",
        name: "Mass DM Bot",
        platform: "f2f",
        kind: "mass_dm",
        audience: "creators",
        description: "Mass direct messaging for creators",
        enabled: true,
        current_version: "2.1.0"
      },
      {
        id: "f2f-posting-agencies",
        key: "f2f_posting_agencies",
        name: "Posting Bot",
        platform: "f2f",
        kind: "posting",
        audience: "agencies",
        description: "Agency-focused content posting",
        enabled: true,
        current_version: "2.1.0"
      },
      {
        id: "f2f-mass-dm-agencies",
        key: "f2f_mass_dm_agencies",
        name: "Mass DM Bot",
        platform: "f2f",
        kind: "mass_dm",
        audience: "agencies",
        description: "Agency-focused mass messaging",
        enabled: true,
        current_version: "2.1.0"
      }
    ]
  },
  {
    id: "onlyfans",
    name: "OnlyFans",
    description: "OnlyFans platform automation",
    bots: [
      {
        id: "onlyfans-posting-creators",
        key: "onlyfans_posting_creators",
        name: "Posting Bot",
        platform: "onlyfans",
        kind: "posting",
        audience: "creators",
        description: "Automated content posting for OnlyFans creators",
        enabled: true,
        current_version: "1.8.0"
      },
      {
        id: "onlyfans-mass-dm-creators",
        key: "onlyfans_mass_dm_creators",
        name: "Mass DM Bot",
        platform: "onlyfans",
        kind: "mass_dm",
        audience: "creators",
        description: "Mass direct messaging for OnlyFans creators",
        enabled: true,
        current_version: "1.8.0"
      },
      {
        id: "onlymonster-posting-creators",
        key: "onlymonster_posting_creators",
        name: "OnlyMonster Posting Bot (Creators)",
        platform: "onlyfans",
        kind: "posting",
        audience: "creators",
        description: "OnlyMonster platform posting automation",
        comingSoon: true,
        enabled: false
      },
      {
        id: "onlymonster-mass-dm-creators",
        key: "onlymonster_mass_dm_creators",
        name: "OnlyMonster Mass DM Bot (Creators)",
        platform: "onlyfans",
        kind: "mass_dm",
        audience: "creators",
        description: "OnlyMonster platform mass messaging",
        comingSoon: true,
        enabled: false
      },
      {
        id: "inflow-posting-creators",
        key: "inflow_posting_creators",
        name: "Inflow Posting Bot (Creators)",
        platform: "onlyfans",
        kind: "posting",
        audience: "creators",
        description: "Inflow platform posting automation",
        comingSoon: true,
        enabled: false
      },
      {
        id: "inflow-mass-dm-creators",
        key: "inflow_mass_dm_creators",
        name: "Inflow Mass DM Bot (Creators)",
        platform: "onlyfans",
        kind: "mass_dm",
        audience: "creators",
        description: "Inflow platform mass messaging",
        comingSoon: true,
        enabled: false
      }
    ]
  },
  {
    id: "fanvue",
    name: "Fanvue",
    description: "Fanvue platform automation",
    bots: [
      {
        id: "fanvue-posting-creators",
        key: "fanvue_posting_creators",
        name: "Posting Bot",
        platform: "fanvue",
        kind: "posting",
        audience: "creators",
        description: "Automated content posting for Fanvue creators",
        enabled: true,
        current_version: "1.5.0"
      },
      {
        id: "fanvue-mass-dm-creators",
        key: "fanvue_mass_dm_creators",
        name: "Mass DM Bot",
        platform: "fanvue",
        kind: "mass_dm",
        audience: "creators",
        description: "Mass direct messaging for Fanvue creators",
        enabled: true,
        current_version: "1.5.0"
      }
    ]
  },
  {
    id: "fancentro",
    name: "Fancentro",
    description: "Fancentro platform automation",
    comingSoon: true,
    bots: []
  },
  {
    id: "fansly",
    name: "Fansly",
    description: "Fansly platform automation",
    comingSoon: true,
    bots: []
  }
]

// Sample subscription data
export const mockSubscription: Subscription = {
  id: "sub_123",
  plan: "custom",
  status: "active",
  entitlements: {
    models: 3,
    scriptsPerModel: 4,
    pricePerScriptPerModel: 50,
    concurrency: 4
  },
  nextRenewalAt: "2024-02-15T00:00:00Z",
  monthlyTotal: 600
}

// Sample schedules for current month
export const mockSchedules: Schedule[] = [
  {
    id: "sched_1",
    bot_id: "f2f-posting-creators",
    name: "Morning Posts",
    cron_expr: "0 8 * * *",
    timezone: "Europe/Amsterdam",
    is_active: true,
    next_fire_at: "2024-01-16T08:00:00Z"
  },
  {
    id: "sched_2",
    bot_id: "f2f-mass-dm-creators",
    name: "Afternoon DMs",
    cron_expr: "0 14 * * *",
    timezone: "Europe/Amsterdam",
    is_active: true,
    next_fire_at: "2024-01-16T14:00:00Z"
  }
]

// Sample runs data
export const mockRuns: Run[] = [
  {
    id: "run_1",
    bot_id: "f2f-posting-creators",
    status: "success",
    queued_at: "2024-01-15T08:00:00Z",
    started_at: "2024-01-15T08:01:00Z",
    finished_at: "2024-01-15T08:15:00Z",
    exit_code: 0,
    bot_name: "F2F Posting Script (Creators)",
    platform: "f2f",
    artifacts: ["logs.txt", "screenshots.zip"]
  },
  {
    id: "run_2",
    bot_id: "f2f-mass-dm-creators",
    status: "running",
    queued_at: "2024-01-15T14:00:00Z",
    started_at: "2024-01-15T14:01:00Z",
    bot_name: "F2F Mass DM Script (Creators)",
    platform: "f2f"
  },
  {
    id: "run_3",
    bot_id: "onlyfans-posting-creators",
    status: "error",
    queued_at: "2024-01-15T09:00:00Z",
    started_at: "2024-01-15T09:01:00Z",
    finished_at: "2024-01-15T09:05:00Z",
    exit_code: 1,
    bot_name: "OnlyFans Posting Bot (Creators)",
    platform: "onlyfans",
    artifacts: ["error_log.txt"]
  }
]

// Sample KPI data
export const mockKPIs: KPIData = {
  active_runs: 1,
  scheduled_this_week: 14,
  bots_enabled: 8,
  failed_24h: 2,
  total_bots: 12,
  active_bots: 8,
  success_rate: 95,
  monthly_revenue: 2400,
  total_runs: 156,
  failed_runs: 8,
  avg_duration: 45
}

// Sample analytics data
export const mockAnalytics: AnalyticsData = {
  total_runs: 156,
  success_rate: 94.2,
  avg_duration: 12.5,
  concurrent_peak: 3,
  runs_over_time: [
    { time: "00:00", runs: 2 },
    { time: "04:00", runs: 1 },
    { time: "08:00", runs: 8 },
    { time: "12:00", runs: 6 },
    { time: "16:00", runs: 7 },
    { time: "20:00", runs: 4 }
  ],
  success_vs_failure: { success: 147, failure: 9 },
  duration_per_bot: [
    { bot_name: "F2F Posting", avg_duration: 10.2 },
    { bot_name: "F2F Mass DM", avg_duration: 15.8 },
    { bot_name: "OnlyFans Posting", avg_duration: 8.5 }
  ]
}

// Sample billing history
export const mockBillingHistory: BillingHistory[] = [
  {
    id: "bill_1",
    date: "2024-01-01",
    amount: 600,
    description: "Monthly subscription - 3 models, 4 scripts",
    status: "paid"
  },
  {
    id: "bill_2",
    date: "2023-12-01",
    amount: 600,
    description: "Monthly subscription - 3 models, 4 scripts",
    status: "paid"
  }
]

// Sample payment methods
export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "card",
    last4: "4242",
    brand: "Visa",
    expiry: "12/25",
    is_default: true
  }
]

// Sample organization
export const mockOrganization: Organization = {
  id: "org_1",
  name: "My Bot Agency",
  timezone: "Europe/Amsterdam"
}

// Sample secrets
export const mockSecrets: Secret[] = [
  {
    name: "proxy_credentials",
    provider: "Bright Data",
    last_used: "2024-01-15T10:00:00Z"
  },
  {
    name: "captcha_service",
    provider: "2Captcha",
    last_used: "2024-01-14T15:30:00Z"
  }
]


// Sample notification settings
export const mockNotificationSettings: NotificationSettings = {
  email_enabled: true,
  webhook_enabled: false,
  notify_on_failure: true,
  notify_on_success: false,
  notify_on_schedule: true
}

// Generate mock run events
export function generateMockRunEvents(runId: string): RunEvent[] {
  return [
    {
      id: 1,
      run_id: runId,
      ts: new Date(Date.now() - 300000).toISOString(),
      level: "info",
      code: "BOT_STARTED",
      message: "Bot initialization started"
    },
    {
      id: 2,
      run_id: runId,
      ts: new Date(Date.now() - 240000).toISOString(),
      level: "info",
      code: "BROWSER_LAUNCHED",
      message: "Browser launched successfully"
    },
    {
      id: 3,
      run_id: runId,
      ts: new Date(Date.now() - 180000).toISOString(),
      level: "info",
      code: "LOGIN_SUCCESS",
      message: "Logged in to platform"
    },
    {
      id: 4,
      run_id: runId,
      ts: new Date(Date.now() - 120000).toISOString(),
      level: "info",
      code: "CONTENT_POSTED",
      message: "Content posted successfully"
    }
  ]
}

// Generate calendar data for current month
export function generateCalendarData(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const itemsByDay: Record<string, number> = {}
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    itemsByDay[date] = Math.floor(Math.random() * 5) + 1
  }
  
  return itemsByDay
}

// Creator user data for development
export const mockCreatorUser = {
  id: "creator-1",
  email: "creator@example.com",
  name: "Creator User",
  role: "user" as const,
  userType: "creator" as const,
  timezone: "Europe/Amsterdam",
  selectedAutomations: [
    { platform: "onlyfans", key: "onlyfans_posting" },
    { platform: "fanvue", key: "fanvue_posting" }
  ],
  subscription: {
    plan: "premium" as const,
    features: ["onlyfans_posting", "fanvue_posting"],
    maxBots: 6,
    maxConfigs: 10,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  createdAt: new Date().toISOString()
}

// Mock invoices for billing
export const mockInvoices = [
  {
    id: "inv_001",
    amount: 80,
    currency: "EUR",
    status: "paid",
    date: "2024-01-01",
    description: "OnlyFans Posting + Fanvue Posting"
  },
  {
    id: "inv_002", 
    amount: 40,
    currency: "EUR",
    status: "paid",
    date: "2023-12-01",
    description: "OnlyFans Posting"
  }
]

// Mock cookies for /cookies page
export const mockCookies = [
  {
    label: "OnlyFans Session",
    bot: "onlyfans_posting",
    stored_at: "2024-01-15T10:00:00Z",
    status: "active" as const
  },
  {
    label: "Fanvue Auth",
    bot: "fanvue_posting", 
    stored_at: "2024-01-10T10:00:00Z",
    status: "active" as const
  }
]
