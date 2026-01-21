import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Collaborator {
  id: number
  user_id: string
  role: string
  created_at: string
  email?: string
}

interface CollaboratorsModalProps {
  accountId: string
  accountName: string
  isOwner: boolean
  onClose: () => void
}

export default function CollaboratorsModal({ accountId, accountName, isOwner, onClose }: CollaboratorsModalProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCollaborators()
  }, [accountId])

  async function fetchCollaborators() {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('account_collaborator')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch user emails for each collaborator
      const collaboratorsWithEmails = await Promise.all(
        (data || []).map(async (collab) => {
          try {
            const { data: { user } } = await supabase.auth.admin.getUserById(collab.user_id)
            return { ...collab, email: user?.email || 'Unknown' }
          } catch {
            return { ...collab, email: 'Unknown' }
          }
        })
      )

      setCollaborators(collaboratorsWithEmails)
    } catch (err: any) {
      console.error('Error fetching collaborators:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      setInviting(true)
      setError(null)

      // Get user by email using auth admin (Note: This requires service role or special permissions)
      // For now, we'll need to implement this via an edge function
      // Simplified version: just show error that user must exist
      
      const { error: searchError } = await supabase
        .from('account')
        .select('user_id')
        .limit(1)
      
      if (searchError) {
        throw new Error('Unable to search for users. Please use a Supabase Edge Function to invite collaborators.')
      }

      // This is a placeholder - you'd need an edge function to:
      // 1. Look up user by email
      // 2. Insert into account_collaborator
      // 3. Optionally send invitation email
      
      setError('Invite feature requires an Edge Function. Please implement /functions/invite-collaborator')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(collaboratorId: number) {
    if (!confirm('Remove this collaborator?')) return

    try {
      const { error } = await supabase
        .from('account_collaborator')
        .delete()
        .eq('id', collaboratorId)

      if (error) throw error

      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 600,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Collaborators
            </h2>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              {accountName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#334155'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px 28px',
          overflowY: 'auto',
          flex: 1
        }}>
          {error && (
            <div style={{
              padding: 12,
              marginBottom: 16,
              borderRadius: 8,
              background: '#fee',
              border: '1px solid #fcc',
              color: '#c33',
              fontSize: 13
            }}>
              {error}
            </div>
          )}

          {/* Invite Form - Only for owners */}
          {isOwner && (
            <form onSubmit={handleInvite} style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 8
              }}>
                Invite by Email
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    fontSize: 14,
                    color: '#334155'
                  }}
                  disabled={inviting}
                />
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: inviting || !inviteEmail.trim() ? '#cbd5e1' : '#4f46e5',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: inviting || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s'
                  }}
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          )}

          {/* Collaborators List */}
          <div>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 12
            }}>
              Team Members ({collaborators.length})
            </h3>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #f3f4f6', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              </div>
            ) : collaborators.length === 0 ? (
              <div style={{
                padding: 40,
                textAlign: 'center',
                color: '#64748b',
                background: '#f8fafc',
                borderRadius: 8
              }}>
                <p>No collaborators yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 2 }}>
                        {collab.email}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {collab.role} · Added {new Date(collab.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(collab.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          background: '#fff',
                          color: '#ef4444',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fee'
                          e.currentTarget.style.borderColor = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff'
                          e.currentTarget.style.borderColor = '#e2e8f0'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
