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
export async function checkIsAdmin(userId: string, accessToken: string): Promise<boolean> {
  try {
    console.log('[Admin Check] Checking user via /me endpoint:', userId)

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/me`
    console.log('[Admin Check] Fetching:', url)

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

    console.log('[Admin Check] Waiting for response...')
    const response = await Promise.race([queryPromise, timeoutPromise])
    
    console.log('[Admin Check] Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Admin Check] HTTP error:', response.status, errorText)
      return false
    }

    const data = await response.json()
    console.log('[Admin Check] Response received:', data)

    const isAdmin = data.isAdmin === true
    console.log('[Admin Check]', isAdmin ? '✅ User IS an admin!' : '❌ User is not an admin')
    return isAdmin
  } catch (err: any) {
    console.error('[Admin Check] Exception:', err.message)
    return false
  }
}

/**
 * Get the current authenticated user and their admin status
 */
export async function getAuthSession(): Promise<AuthSession> {
  try {
    console.log('[Auth] Getting user session...')
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    console.log('[Auth] getUser response:', { user: user?.email, error })

    if (error) {
      console.error('[Auth] Error getting user:', error)
      return {
        user: null,
        isAdmin: false,
        isLoading: false
      }
    }
    
    if (!user) {
      console.log('[Auth] ❌ No user logged in')
      return {
        user: null,
        isAdmin: false,
        isLoading: false
      }
    }

    console.log('[Auth] ✅ User found:', user.email)
    
    // Get session for access token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('[Auth] No session found for admin check')
      return {
        user,
        isAdmin: false,
        isLoading: false
      }
    }
    
    // Check admin status
    const isAdmin = await checkIsAdmin(user.id, session.access_token)
    console.log('[Auth] Final admin status:', isAdmin)

    return {
      user,
      isAdmin,
      isLoading: false
    }
  } catch (err) {
    console.error('[Auth] Error getting auth session:', err)
    return {
      user: null,
      isAdmin: false,
      isLoading: false
    }
  }
}
