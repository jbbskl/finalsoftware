import type { 
  Bot, 
  Platform, 
  Subscription, 
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
  NotificationSettings,
  BotConfig
} from './types'
import { 
  platforms, 
  mockSubscription, 
  mockSchedules, 
  mockRuns, 
  mockKPIs, 
  mockAnalytics,
  mockBillingHistory,
  mockPaymentMethods,
  mockOrganization,
  mockSecrets,
  mockCookies,
  mockNotificationSettings,
  generateMockRunEvents,
  generateCalendarData
} from './mocks'
import { 
  getBotsByUserId, 
  getSubscriptionsByUserId, 
  getAllBots, 
  getAllSubscriptions,
  type User as DBUser,
  type Bot as DBBot,
  type Subscription as DBSubscription
} from './database'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const USE_MOCKS = process.env.NEXT_PUBLIC_DEV_MOCK === "true"

// Helper function to handle API calls with fallback to mocks
async function apiCall<T>(endpoint: string, fallback: T): Promise<T> {
  if (USE_MOCKS) {
    return fallback
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`)
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn(`API call failed for ${endpoint}:`, error)
  }
  
  return fallback
}

// Subscription APIs
export async function getSubscription(): Promise<Subscription> {
  return apiCall('/subscription', mockSubscription)
}

export async function updateSubscription(input: Partial<Subscription>): Promise<Subscription> {
  if (USE_MOCKS) {
    return { ...mockSubscription, ...input }
  }
  
  try {
    const response = await fetch(`${API_BASE}/subscription`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to update subscription:', error)
  }
  
  return mockSubscription
}

// Platform and Bot APIs
export async function getPlatformsAndBots(): Promise<Platform[]> {
  return apiCall('/platforms', platforms)
}

// Schedule APIs
export async function getSchedules(): Promise<Schedule[]> {
  return apiCall('/schedules', mockSchedules)
}

export async function createSchedule(input: Omit<Schedule, 'id'>): Promise<Schedule> {
  if (USE_MOCKS) {
    const newSchedule: Schedule = {
      ...input,
      id: `sched_${Date.now()}`,
      next_fire_at: new Date().toISOString()
    }
    return newSchedule
  }
  
  try {
    const response = await fetch(`${API_BASE}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to create schedule:', error)
  }
  
  throw new Error('Failed to create schedule')
}

export async function updateSchedule(id: string, input: Partial<Schedule>): Promise<Schedule> {
  if (USE_MOCKS) {
    const existing = mockSchedules.find(s => s.id === id)
    if (!existing) throw new Error('Schedule not found')
    return { ...existing, ...input }
  }
  
  try {
    const response = await fetch(`${API_BASE}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to update schedule:', error)
  }
  
  throw new Error('Failed to update schedule')
}

export async function deleteSchedule(id: string): Promise<void> {
  if (USE_MOCKS) {
    return
  }
  
  try {
    const response = await fetch(`${API_BASE}/schedules/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('Failed to delete schedule')
    }
  } catch (error) {
    console.warn('Failed to delete schedule:', error)
    throw error
  }
}

// Calendar API
export async function getCalendarMonth(year: number, month: number) {
  return apiCall(`/calendar/${year}/${month}`, generateCalendarData(year, month))
}

// Run APIs
export async function createRunDev(input: { image_ref: string; run_id: string; config: any }): Promise<Run> {
  if (USE_MOCKS) {
    const newRun: Run = {
      id: input.run_id,
      bot_id: 'mock-bot',
      status: 'queued',
      queued_at: new Date().toISOString(),
      image_ref: input.image_ref
    }
    return newRun
  }
  
  try {
    const response = await fetch(`${API_BASE}/runs/dev`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to create dev run:', error)
  }
  
  throw new Error('Failed to create dev run')
}

export async function getRuns(params?: { status?: string; platform?: string; bot?: string; date_from?: string; date_to?: string }): Promise<Run[]> {
  const queryString = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
  return apiCall(`/runs?${queryString}`, mockRuns)
}

export async function getRun(id: string): Promise<Run> {
  const run = mockRuns.find(r => r.id === id)
  if (!run) throw new Error('Run not found')
  return apiCall(`/runs/${id}`, run)
}

export async function getRunEvents(id: string): Promise<RunEvent[]> {
  return apiCall(`/runs/${id}/events`, generateMockRunEvents(id))
}

// Dashboard APIs
export async function getKPIs(): Promise<KPIData> {
  return apiCall('/dashboard/kpis', mockKPIs)
}

export async function getChartData(): Promise<AnalyticsData> {
  return apiCall('/dashboard/chart', mockAnalytics)
}

// Organization APIs
export async function getOrganization(): Promise<Organization> {
  return apiCall('/organization', mockOrganization)
}

export async function updateOrganization(input: Partial<Organization>): Promise<Organization> {
  if (USE_MOCKS) {
    return { ...mockOrganization, ...input }
  }
  
  try {
    const response = await fetch(`${API_BASE}/organization`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to update organization:', error)
  }
  
  return mockOrganization
}

// Secrets APIs
export async function getSecrets(): Promise<Secret[]> {
  return apiCall('/secrets', mockSecrets)
}

// Cookies APIs
export async function getCookies(): Promise<Cookie[]> {
  return apiCall('/cookies', mockCookies)
}

// Billing APIs
export async function getBillingHistory(): Promise<BillingHistory[]> {
  return apiCall('/billing/history', mockBillingHistory)
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return apiCall('/billing/payment-methods', mockPaymentMethods)
}

// Notification APIs
export async function getNotificationSettings(): Promise<NotificationSettings> {
  return apiCall('/notifications', mockNotificationSettings)
}

export async function updateNotificationSettings(input: Partial<NotificationSettings>): Promise<NotificationSettings> {
  if (USE_MOCKS) {
    return { ...mockNotificationSettings, ...input }
  }
  
  try {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to update notification settings:', error)
  }
  
  return mockNotificationSettings
}

// Bot Management APIs
export async function getBots(userId?: string): Promise<Bot[]> {
  if (userId) {
    // Return user-specific bots from database
    const userBots = await getBotsByUserId(userId)
    return userBots.map(dbBot => ({
      id: dbBot.id,
      key: `${dbBot.platform}-${dbBot.type}`,
      name: dbBot.name,
      platform: dbBot.platform,
      kind: dbBot.type,
      audience: "creators" as const, // Default audience
      description: `Automated ${dbBot.platform} ${dbBot.type} bot`,
      enabled: dbBot.status === "active",
      current_version: "1.0.0"
    }))
  }
  
  // Return all available bots for admin or when no user specified
  const allBots = platforms.flatMap(p => p.bots)
  return apiCall('/bots', allBots)
}

// Configuration Management APIs
export async function getConfigs(userId?: string): Promise<BotConfig[]> {
  // For new users, return empty array - they need to create configs
  if (userId) {
    return []
  }
  
  // Generate mock configs for development (admin view)
  const mockConfigs: BotConfig[] = [
    {
      id: 'config_1',
      name: 'Default F2F Posting',
      bot_id: 'f2f-posting-creators',
      bot_name: 'F2F Posting Script (Creators)',
      config_data: {
        posting_frequency: 'daily',
        content_type: 'mixed',
        auto_hashtags: true,
        timezone: 'UTC'
      },
      is_default: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      description: 'Default configuration for F2F posting bot',
      environment: 'production'
    },
    {
      id: 'config_2',
      name: 'Mass DM Campaign',
      bot_id: 'f2f-mass-dm-creators',
      bot_name: 'F2F Mass DM Script (Creators)',
      config_data: {
        message_template: 'Hi! Check out my latest content!',
        target_audience: 'followers',
        daily_limit: 50,
        delay_between_messages: 30
      },
      is_default: false,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      description: 'Mass DM campaign configuration',
      environment: 'production'
    }
  ]
  
  return apiCall('/configs', mockConfigs)
}

export async function createConfig(input: Omit<BotConfig, 'id' | 'created_at' | 'updated_at'>): Promise<BotConfig> {
  if (USE_MOCKS) {
    const newConfig: BotConfig = {
      ...input,
      id: `config_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    return newConfig
  }
  
  try {
    const response = await fetch(`${API_BASE}/configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to create config:', error)
  }
  
  throw new Error('Failed to create config')
}

export async function updateConfig(id: string, input: Partial<BotConfig>): Promise<BotConfig> {
  if (USE_MOCKS) {
    const configs = await getConfigs()
    const existing = configs.find(c => c.id === id)
    if (!existing) throw new Error('Config not found')
    return { ...existing, ...input, updated_at: new Date().toISOString() }
  }
  
  try {
    const response = await fetch(`${API_BASE}/configs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to update config:', error)
  }
  
  throw new Error('Failed to update config')
}

export async function deleteConfig(id: string): Promise<void> {
  if (USE_MOCKS) {
    return
  }
  
  try {
    const response = await fetch(`${API_BASE}/configs/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error('Failed to delete config')
    }
  } catch (error) {
    console.warn('Failed to delete config:', error)
    throw error
  }
}
