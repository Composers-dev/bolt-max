'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: LocalUser | null
  subscription: Subscription | null
  plan: string | null
  isLoading: boolean
  error: string | null
  resetAuth: () => Promise<void>
  refreshSubscription: () => Promise<void>
}

interface LocalUser {
  id: string
  email: string
}

interface Subscription {
  status: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const resetAuth = useCallback(async () => {
    try {
      setIsLoading(true)
      // Clear all storage
      localStorage.clear()
      sessionStorage.clear()
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      await supabase.auth.signOut()
      setUser(null)
      setSubscription(null)
      setPlan(null)
      setError(null)
      
      // Instead of reloading, just reset the state
      setIsInitialized(false)
      setIsLoading(false)
    } catch (error) {
      console.error('Error resetting auth:', error)
      setError('Failed to reset authentication')
      setIsLoading(false)
    }
  }, [])

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError)
      }
      setSubscription(subData || null)

      // Fetch user settings including plan
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('plan')
        .eq('user_id', userId)
        .single()

      if (settingsError) {
        console.error('Settings fetch error:', settingsError)
      } else {
        setPlan(settingsData?.plan || 'free')
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
      setSubscription(null)
      setPlan('free')
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      if (!mounted) return

      try {
        console.log('Initializing auth...')
        
        // First try to recover the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          throw sessionError
        }

        if (!mounted) return

        if (session?.user) {
          console.log('User found:', session.user.email)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          })
          fetchUserData(session.user.id)
        } else {
          console.log('No user found')
          setUser(null)
          setSubscription(null)
          setPlan(null)
        }
        
        setIsLoading(false)
        setIsInitialized(true)
      } catch (err) {
        console.error('Auth initialization error:', err)
        if (mounted) {
          await resetAuth()
        }
      }
    }

    // Set timeout for initialization
    const timeoutId = setTimeout(() => {
      if (!isInitialized && mounted) {
        console.log('Auth initialization timeout')
        resetAuth()
      }
    }, 5000) // Reduced timeout to 5 seconds

    // Setup auth state listener first
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        if (!mounted) return

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          })
          fetchUserData(session.user.id)
        } else {
          setUser(null)
          setSubscription(null)
          setPlan(null)
        }
        setIsLoading(false)
      }
    )

    // Then initialize auth
    initializeAuth()

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      authListener.unsubscribe()
    }
  }, [isInitialized, fetchUserData, resetAuth])

  const refreshSubscription = useCallback(async () => {
    if (!user) return Promise.resolve()
    return fetchUserData(user.id)
  }, [user, fetchUserData])

  // Add debug information to help diagnose issues
  console.log('Auth state:', {
    isLoading,
    isInitialized,
    hasUser: !!user,
    hasSubscription: !!subscription,
    hasError: !!error
  })

  return (
    <AuthContext.Provider 
      value={{
        user,
        subscription,
        plan,
        isLoading,
        error,
        resetAuth,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 