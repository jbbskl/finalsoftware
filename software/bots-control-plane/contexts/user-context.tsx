"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getUserById, getUserByEmail, type User } from '@/lib/database'

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  isAdmin: boolean
  isClient: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for stored user session
    const checkAuth = async () => {
      try {
        const storedUserId = localStorage.getItem('userId')
        if (storedUserId) {
          const userData = await getUserById(storedUserId)
          if (userData) {
            setUser(userData)
          } else {
            localStorage.removeItem('userId')
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        setError('Failed to verify authentication')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Attempting login for:', email)
      
      // Call the login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Login successful:', data.user.email, 'ID:', data.user.id)
        setUser(data.user)
        localStorage.setItem('userId', data.user.id)
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Login failed')
        return false
      }
    } catch (err) {
      console.error('Login failed:', err)
      setError('Login failed. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('userId')
    setError(null)
    
    // Clear cookies by calling logout API
    fetch('/api/auth/logout', { method: 'POST' }).catch(console.error)
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  const isAdmin = user?.role === "admin"
  const isClient = user?.role === "user"

  const value: UserContextType = {
    user,
    loading,
    error,
    isAdmin,
    isClient,
    login,
    logout,
    updateUser
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Convenience hook for getting user role
export function useRole(): "admin" | "user" | null {
  const { user } = useUser()
  return user?.role || null
}