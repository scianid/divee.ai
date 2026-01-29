import { useAuth } from '../contexts/AuthContext'

/**
 * Admin badge component - shows when user is an admin
 * Displays a small badge to indicate admin privileges
 */
export function AdminBadge() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading || !isAdmin) return null

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 600,
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      Admin
    </div>
  )
}

/**
 * Simple text indicator for admin status
 */
export function AdminIndicator() {
  const { isAdmin, isLoading, user } = useAuth()

  if (isLoading || !isAdmin) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      background: 'rgba(245, 158, 11, 0.1)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#d97706'
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span style={{ fontWeight: 500 }}>
        System Administrator
      </span>
      {user?.email && (
        <span style={{ opacity: 0.7, fontSize: '12px' }}>
          ({user.email})
        </span>
      )}
    </div>
  )
}
