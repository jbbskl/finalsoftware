import { NextRequest, NextResponse } from 'next/server'
import { 
  getSubscriptionsByUserId, 
  getAllSubscriptions, 
  createSubscription, 
  updateSubscription,
  initializeDatabase 
} from '@/lib/server-database'

// Initialize database on first import
initializeDatabase()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (userId) {
      const subscriptions = getSubscriptionsByUserId(userId)
      return NextResponse.json(subscriptions)
    }
    
    // Return all subscriptions (admin only)
    const subscriptions = getAllSubscriptions()
    return NextResponse.json(subscriptions)
  } catch (error) {
    console.error('Error in GET /api/subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const subscriptionData = await request.json()
    const newSubscription = createSubscription(subscriptionData)
    return NextResponse.json(newSubscription, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    const updatedSubscription = updateSubscription(id, updates)
    
    if (!updatedSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedSubscription)
  } catch (error) {
    console.error('Error in PUT /api/subscriptions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




