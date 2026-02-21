import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAdmin } from '../hooks/useAdmin'

interface UserEntry {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function ImpersonateUser() {
  const navigate = useNavigate()
  const isAdmin = useAdmin()
  const { startImpersonation } = useAuth()

  const [users, setUsers] = useState<UserEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [isAdmin])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load users')
      setUsers(data.users)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleImpersonate(userId: string) {
    setImpersonatingId(userId)
    try {
      await startImpersonation(userId)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setImpersonatingId(null)
    }
  }

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px', color: 'var(--heading)' }}>
          Impersonate User
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Select a user to impersonate. You will be signed in as that user until you stop impersonation.
          All actions will be performed under their identity.
        </p>
      </div>

      {/* Warning banner */}
      <div style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        fontSize: '13px',
        color: '#92400e',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span>
          <strong>Admin action:</strong> Impersonation grants full access to this user's account.
          A yellow banner will appear at the top of the screen while impersonating. Click "Stop Impersonating" to restore your admin session.
        </span>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* User list */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            Loading users...
          </div>
        )}

        {error && (
          <div style={{ padding: '20px 24px', color: '#ef4444', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No users found.
          </div>
        )}

        {!loading && filtered.map((u, i) => (
          <div
            key={u.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '14px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#ede9fe', color: '#7c3aed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '14px', flexShrink: 0,
            }}>
              {u.email?.[0]?.toUpperCase() ?? '?'}
            </div>

            {/* Info */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 500, fontSize: '14px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.email}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Last sign in: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => handleImpersonate(u.id)}
              disabled={impersonatingId !== null}
              style={{
                background: impersonatingId === u.id ? '#7c3aed' : 'transparent',
                color: impersonatingId === u.id ? '#fff' : '#7c3aed',
                border: '1px solid #7c3aed',
                borderRadius: '6px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: impersonatingId !== null ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!impersonatingId) {
                  e.currentTarget.style.background = '#7c3aed'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (impersonatingId !== u.id) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#7c3aed'
                }
              }}
            >
              {impersonatingId === u.id ? 'Switching...' : 'Impersonate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
