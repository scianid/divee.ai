import { useAuth } from '../contexts/AuthContext'

/**
 * Simple hook to check if current user is an admin
 * Usage:
 * 
 * const isAdmin = useAdmin()
 * 
 * if (isAdmin) {
 *   // Show admin-only content
 * }
 */
export function useAdmin(): boolean {
  const { isAdmin } = useAuth()
  return isAdmin
}
