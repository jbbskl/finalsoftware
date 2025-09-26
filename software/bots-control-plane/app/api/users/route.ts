import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserByEmail, 
  getUserById, 
  createUser, 
  updateUser, 
  getAllUsers,
  initializeDatabase 
} from '@/lib/server-database'

// Initialize database on first import
initializeDatabase()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const id = searchParams.get('id')
    
    if (email) {
      const user = getUserByEmail(email)
      return NextResponse.json(user)
    }
    
    if (id) {
      const user = getUserById(id)
      return NextResponse.json(user)
    }
    
    // Return all users (admin only)
    const users = getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    const newUser = createUser(userData)
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    const updatedUser = updateUser(id, updates)
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error in PUT /api/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




