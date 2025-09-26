// Mock database module for development
// In production, this would connect to a real database

export type User = {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  userType: "creator" | "agency"
  timezone?: string
  selectedAutomations?: Array<{ platform: string; key: string }>
  subscription: {
    plan: "free" | "premium" | "enterprise"
    features: string[]
    maxBots: number
    maxConfigs: number
    expiresAt: string
  }
  createdAt: string
}

export type Bot = {
  id: string
  name: string
  platform: "f2f" | "onlyfans" | "fanvue" | "fancentro" | "fansly"
  type: "posting" | "mass_dm"
  status: "active" | "inactive" | "error"
  userId: string
  createdAt: string
  updatedAt: string
}

export type Subscription = {
  id: string
  userId: string
  plan: "free" | "premium" | "enterprise"
  status: "active" | "past_due" | "canceled"
  features: string[]
  maxBots: number
  maxConfigs: number
  price: number
  billingCycle: "monthly" | "yearly"
  startDate: string
  endDate: string
  createdAt: string
}

// Mock data
const mockUsers: User[] = [
  {
    id: "user_1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    userType: "agency",
    subscription: {
      plan: "enterprise",
      features: ["unlimited_bots", "priority_support", "custom_integrations"],
      maxBots: 100,
      maxConfigs: 500,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "user_2",
    email: "creator@example.com",
    name: "Creator User",
    role: "user",
    userType: "creator",
    subscription: {
      plan: "premium",
      features: ["basic_bots", "email_support"],
      maxBots: 5,
      maxConfigs: 20,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const mockBots: Bot[] = [
  {
    id: "bot_1",
    name: "F2F Posting Bot",
    platform: "f2f",
    type: "posting",
    status: "active",
    userId: "user_1",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "bot_2",
    name: "Fanvue Mass DM Bot",
    platform: "fanvue",
    type: "mass_dm",
    status: "active",
    userId: "user_1",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "bot_3",
    name: "OnlyFans Posting Bot",
    platform: "onlyfans",
    type: "posting",
    status: "inactive",
    userId: "user_2",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
]

const mockSubscriptions: Subscription[] = [
  {
    id: "sub_1",
    userId: "user_1",
    plan: "enterprise",
    status: "active",
    features: ["unlimited_bots", "priority_support", "custom_integrations"],
    maxBots: 100,
    maxConfigs: 500,
    price: 999.99,
    billingCycle: "monthly",
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "sub_2",
    userId: "user_2",
    plan: "premium",
    status: "active",
    features: ["basic_bots", "email_support"],
    maxBots: 5,
    maxConfigs: 20,
    price: 29.99,
    billingCycle: "monthly",
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Database functions
export async function getBotsByUserId(userId: string): Promise<Bot[]> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockBots.filter(bot => bot.userId === userId)
}

export async function getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockSubscriptions.filter(sub => sub.userId === userId)
}

export async function getAllBots(): Promise<Bot[]> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockBots
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockSubscriptions
}

export async function getUserById(userId: string): Promise<User | null> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockUsers.find(user => user.id === userId) || null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockUsers.find(user => user.email === email) || null
}

export async function createBot(bot: Omit<Bot, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bot> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const newBot: Bot = {
    ...bot,
    id: `bot_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  mockBots.push(newBot)
  return newBot
}

export async function updateBot(id: string, updates: Partial<Bot>): Promise<Bot | null> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const botIndex = mockBots.findIndex(bot => bot.id === id)
  if (botIndex === -1) return null
  
  mockBots[botIndex] = {
    ...mockBots[botIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  return mockBots[botIndex]
}

export async function deleteBot(id: string): Promise<boolean> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const botIndex = mockBots.findIndex(bot => bot.id === id)
  if (botIndex === -1) return false
  
  mockBots.splice(botIndex, 1)
  return true
}

export async function createUser(userData: {
  email: string
  name: string
  userType: "creator" | "agency"
  password: string
}): Promise<User> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const newUser: User = {
    id: `user_${Date.now()}`,
    email: userData.email,
    name: userData.name,
    role: "user",
    userType: userData.userType,
    subscription: {
      plan: "free",
      features: ["basic_bots"],
      maxBots: userData.userType === "creator" ? 3 : 10,
      maxConfigs: userData.userType === "creator" ? 10 : 50,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    createdAt: new Date().toISOString()
  }
  
  mockUsers.push(newUser)
  return newUser
}