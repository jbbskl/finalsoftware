import { NextRequest, NextResponse } from 'next/server'
import { 
  getBotsByUserId, 
  getAllBots, 
  createBot, 
  updateBot, 
  deleteBot,
  initializeDatabase 
} from '@/lib/server-database'

// Initialize database on first import
initializeDatabase()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (userId) {
      const bots = getBotsByUserId(userId)
      return NextResponse.json(bots)
    }
    
    // Return all bots (admin only)
    const bots = getAllBots()
    return NextResponse.json(bots)
  } catch (error) {
    console.error('Error in GET /api/bots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const botData = await request.json()
    const newBot = createBot(botData)
    return NextResponse.json(newBot, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    const updatedBot = updateBot(id, updates)
    
    if (!updatedBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedBot)
  } catch (error) {
    console.error('Error in PUT /api/bots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }
    
    const success = deleteBot(id)
    if (!success) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/bots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




