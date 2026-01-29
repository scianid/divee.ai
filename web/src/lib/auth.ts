import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthSession {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
}

/**
 * Check if the current user is a system admin
 * Uses the /me edge function for secure, RLS-bypassing admin check
 */
export async function checkIsAdmin(_userId: string, accessToken: string): Promise<boolean> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me`

    // Add timeout to detect hanging queries
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout after 10s')), 10000)
    )
    
    const queryPromise = fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    })

    const response = await Promise.race([queryPromise, timeoutPromise])
    
    if (!response.ok) {
      return false
    }

    const data = await response.json()
    const isAdmin = data.isAdmin === true
    return isAdmin
  } catch {
    return false
  }
}

/**
 * Get the current authenticated user and their admin status
 */
export async function getAuthSession(): Promise<AuthSession> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return {
        user: null,
        isAdmin: false,
        isLoading: false
      }
    }
    
    if (!user) {
      return {
        user: null,
        isAdmin: false,
        isLoading: false
      }
    }
    
    // Get session for access token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return {
        user,
        isAdmin: false,
        isLoading: false
      }
    }
    
    // Check admin status
    const isAdmin = await checkIsAdmin(user.id, session.access_token)

    return {
      user,
      isAdmin,
      isLoading: false
    }
  } catch {
    return {
      user: null,
      isAdmin: false,
      isLoading: false
    }
  }
}
