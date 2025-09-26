import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, updateUser, initializeDatabase } from '@/lib/server-database'

// Initialize database on first import
initializeDatabase()

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    
    const user = getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    
    // For demo purposes, accept any non-empty password
    if (!password || password.trim() === '') {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    
    // Update last login time
    updateUser(user.id, { lastLoginAt: new Date().toISOString() })
    
    // Set cookies for session management
    const response = NextResponse.json({ success: true, user })
    
    // Set session cookies
    response.cookies.set('uid', user.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    response.cookies.set('email', user.email, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    response.cookies.set('role', user.userType, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
  } catch (error) {
    console.error('Error in POST /api/auth/login:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




