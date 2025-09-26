// Server-side database using JSON files
// This file can only be imported by server-side code (API routes, server components)
import fs from 'fs'
import path from 'path'

// Data directory and file paths
const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const BOTS_FILE = path.join(DATA_DIR, 'bots.json')
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json')
const EMAIL_NOTIFICATIONS_FILE = path.join(DATA_DIR, 'email_notifications.json')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "client"
  userType: "agency" | "creator" | "admin"
  emailVerified: boolean
  subscription: {
    plan: "premium" | "enterprise"
    features: string[]
    maxBots: number
    maxConfigs: number
    expiresAt: string
  }
  permissions: string[]
  createdAt: string
  lastLoginAt: string
}

export interface Bot {
  id: string
  userId: string
  name: string
  platform: string
  type: string
  status: "active" | "inactive" | "error"
  config: any
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: "premium" | "enterprise"
  features: string[]
  maxBots: number
  maxConfigs: number
  price: number
  startDate: string
  endDate: string
  status: "active" | "cancelled" | "expired"
  createdAt: string
}

export interface EmailNotification {
  id: string
  userId: string
  type: "system" | "bot_status" | "subscription"
  subject: string
  content: string
  sent: boolean
  sentAt?: string
  createdAt: string
}

// In-memory storage
let users: User[] = []
let bots: Bot[] = []
let subscriptions: Subscription[] = []
let emailNotifications: EmailNotification[] = []

// Helper functions for file operations
function saveToFile<T>(filePath: string, data: T[]): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`Error saving to ${filePath}:`, error)
  }
}

function loadFromFile<T>(filePath: string, defaultValue: T[] = []): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error(`Error loading from ${filePath}:`, error)
  }
  return defaultValue
}

// Initialize with demo data
export function initializeDatabase() {
  console.log('Loading database from files...')
  
  // Load data from files
  users = loadFromFile(USERS_FILE)
  bots = loadFromFile(BOTS_FILE)
  subscriptions = loadFromFile(SUBSCRIPTIONS_FILE)
  emailNotifications = loadFromFile(EMAIL_NOTIFICATIONS_FILE)
  
  // If no users exist, create admin user
  if (users.length === 0) {
    console.log('No users found, creating admin user')
    users = [
      {
        id: "admin-1",
        email: "admin@botscontrol.com",
        name: "System Administrator",
        role: "admin",
        userType: "admin",
        emailVerified: true,
        subscription: {
          plan: "enterprise",
          features: ["all_bots", "all_platforms", "monitoring", "analytics", "subscription_management", "user_management"],
          maxBots: 1000,
          maxConfigs: 1000,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        permissions: ["*"],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }
    ]
    saveToFile(USERS_FILE, users)
  }
  
  console.log('Database loaded:', {
    users: users.length,
    bots: bots.length,
    subscriptions: subscriptions.length,
    emailNotifications: emailNotifications.length
  })
}

// User operations
export function getUserByEmail(email: string): User | null {
  const user = users.find(user => user.email === email) || null
  console.log('getUserByEmail:', email, 'found:', !!user, 'total users:', users.length)
  return user
}

export function getUserById(id: string): User | null {
  return users.find(user => user.id === id) || null
}

export function createUser(userData: Omit<User, "id" | "createdAt" | "lastLoginAt">): User {
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  }
  users.push(newUser)
  saveToFile(USERS_FILE, users)
  console.log('User created:', newUser.email, 'Total users:', users.length)
  
  // Send welcome email notification
  createEmailNotification({
    userId: newUser.id,
    type: "system",
    subject: "Welcome to Bots Control Plane!",
    content: `Welcome ${newUser.name}! Your ${newUser.subscription.plan} account has been created successfully.`,
    sent: false
  })
  
  return newUser
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const index = users.findIndex(user => user.id === id)
  if (index === -1) return null
  
  users[index] = { ...users[index], ...updates }
  saveToFile(USERS_FILE, users)
  return users[index]
}

export function getAllUsers(): User[] {
  console.log('getAllUsers called, returning', users.length, 'users:', users.map(u => ({ email: u.email, id: u.id })))
  return users
}

// Bot operations
export function getBotsByUserId(userId: string): Bot[] {
  return bots.filter(bot => bot.userId === userId)
}

export function getAllBots(): Bot[] {
  return bots
}

export function createBot(botData: Omit<Bot, "id" | "createdAt">): Bot {
  const newBot: Bot = {
    ...botData,
    id: `bot-${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  bots.push(newBot)
  saveToFile(BOTS_FILE, bots)
  return newBot
}

export function updateBot(id: string, updates: Partial<Bot>): Bot | null {
  const index = bots.findIndex(bot => bot.id === id)
  if (index === -1) return null
  
  bots[index] = { ...bots[index], ...updates }
  saveToFile(BOTS_FILE, bots)
  return bots[index]
}

export function deleteBot(id: string): boolean {
  const index = bots.findIndex(bot => bot.id === id)
  if (index === -1) return false
  
  bots.splice(index, 1)
  saveToFile(BOTS_FILE, bots)
  return true
}

// Subscription operations
export function getSubscriptionsByUserId(userId: string): Subscription[] {
  return subscriptions.filter(sub => sub.userId === userId)
}

export function getAllSubscriptions(): Subscription[] {
  return subscriptions
}

export function createSubscription(subData: Omit<Subscription, "id" | "createdAt">): Subscription {
  const newSub: Subscription = {
    ...subData,
    id: `sub-${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  subscriptions.push(newSub)
  saveToFile(SUBSCRIPTIONS_FILE, subscriptions)
  return newSub
}

export function updateSubscription(id: string, updates: Partial<Subscription>): Subscription | null {
  const index = subscriptions.findIndex(sub => sub.id === id)
  if (index === -1) return null
  
  subscriptions[index] = { ...subscriptions[index], ...updates }
  saveToFile(SUBSCRIPTIONS_FILE, subscriptions)
  return subscriptions[index]
}

// Email notification operations
export function createEmailNotification(notificationData: Omit<EmailNotification, "id" | "createdAt">): EmailNotification {
  const newNotification: EmailNotification = {
    ...notificationData,
    id: `email-${Date.now()}`,
    createdAt: new Date().toISOString()
  }
  emailNotifications.push(newNotification)
  saveToFile(EMAIL_NOTIFICATIONS_FILE, emailNotifications)
  return newNotification
}

export function getEmailNotificationsByUserId(userId: string): EmailNotification[] {
  return emailNotifications.filter(notification => notification.userId === userId)
}

export function getAllEmailNotifications(): EmailNotification[] {
  return emailNotifications
}

export function markEmailNotificationAsSent(id: string): boolean {
  const notification = emailNotifications.find(n => n.id === id)
  if (!notification) return false
  
  notification.sent = true
  notification.sentAt = new Date().toISOString()
  saveToFile(EMAIL_NOTIFICATIONS_FILE, emailNotifications)
  return true
}

export function notifyBotStatusChange(userId: string, botName: string, status: string): void {
  createEmailNotification({
    userId,
    type: "bot_status",
    subject: `Bot Status Update: ${botName}`,
    content: `Your bot "${botName}" status has changed to: ${status}`,
    sent: false
  })
}













