import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { getAuthSession, checkIsAdmin } from '../lib/auth'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  impersonating: boolean
  impersonatedUser: User | null
  refreshAdminStatus: () => Promise<void>
  startImpersonation: (targetUserId: string) => Promise<void>
  stopImpersonation: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  impersonating: false,
  impersonatedUser: null,
  refreshAdminStatus: async () => {},
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [impersonating, setImpersonating] = useState(false)
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null)
  // Store the real admin session so we can restore it after impersonation ends
  const adminSessionRef = useRef<Session | null>(null)

  const refreshAdminStatus = async () => {
    if (!user) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const adminStatus = await checkIsAdmin(user.id, session.access_token)
    setIsAdmin(adminStatus)
  }

  const startImpersonation = async (targetUserId: string) => {
    // Save the current admin session before swapping
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) throw new Error('No active session')

    adminSessionRef.current = currentSession

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/impersonate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId }),
      }
    )

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to start impersonation')
    }

    const { access_token, refresh_token, user: targetUser } = await res.json()

    // Swap the Supabase client session to the impersonated user's session
    await supabase.auth.setSession({ access_token, refresh_token })

    setImpersonatedUser(targetUser)
    setImpersonating(true)
    setUser(targetUser)
    setIsAdmin(false) // Impersonated user is not an admin in this context
  }

  const stopImpersonation = async () => {
    if (!adminSessionRef.current) return

    // Restore the admin session
    await supabase.auth.setSession({
      access_token: adminSessionRef.current.access_token,
      refresh_token: adminSessionRef.current.refresh_token,
    })

    const adminUser = adminSessionRef.current.user
    adminSessionRef.current = null
    setImpersonating(false)
    setImpersonatedUser(null)
    setUser(adminUser)
    setIsAdmin(true)
  }

  useEffect(() => {
    // Initial session check
    getAuthSession()
      .then(session => {
        setUser(session.user)
        setIsAdmin(session.isAdmin)
        setIsLoading(false)

        // Store in session storage for quick access
        if (session.user) {
          sessionStorage.setItem('auth_session', JSON.stringify({
            userId: session.user.id,
            isAdmin: session.isAdmin,
            email: session.user.email
          }))
        }
      })
      .catch(() => {
        setIsLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore auth state changes triggered by impersonation swaps
      if (event === 'SIGNED_IN' && session?.user) {
        // Only update if we're NOT in the middle of an impersonation swap
        if (!adminSessionRef.current) {
          setUser(session.user)
          const adminStatus = await checkIsAdmin(session.user.id, session.access_token)
          setIsAdmin(adminStatus)
          sessionStorage.setItem('auth_session', JSON.stringify({
            userId: session.user.id,
            isAdmin: adminStatus,
            email: session.user.email
          }))
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAdmin(false)
        setImpersonating(false)
        setImpersonatedUser(null)
        adminSessionRef.current = null
        sessionStorage.removeItem('auth_session')
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Don't block rendering - show content immediately
  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      isLoading,
      impersonating,
      impersonatedUser,
      refreshAdminStatus,
      startImpersonation,
      stopImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
