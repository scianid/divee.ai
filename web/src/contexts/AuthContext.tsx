import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { getAuthSession, checkIsAdmin } from '../lib/auth'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  refreshAdminStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  refreshAdminStatus: async () => {}
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refreshAdminStatus = async () => {
    if (!user) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const adminStatus = await checkIsAdmin(user.id, session.access_token)
    setIsAdmin(adminStatus)
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
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        
        // Check admin status when signing in (pass access token to avoid getSession hang)
        const adminStatus = await checkIsAdmin(session.user.id, session.access_token)
        setIsAdmin(adminStatus)
        
        // Store in session storage
        sessionStorage.setItem('auth_session', JSON.stringify({
          userId: session.user.id,
          isAdmin: adminStatus,
          email: session.user.email
        }))
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAdmin(false)
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
    <AuthContext.Provider value={{ user, isAdmin, isLoading, refreshAdminStatus }}>
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
