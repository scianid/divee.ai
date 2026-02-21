import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdminBadge } from '../components/AdminBadge'
import { useAdmin } from '../hooks/useAdmin'
import { useAuth } from '../contexts/AuthContext'

// Icons
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
)

const AccountsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const InventoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
)

const ArticlesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
)

const ConversationsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
)

const InsightsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
)

const AdReportsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
)

const UsageCostIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="14" x2="23" y2="14"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="14" x2="4" y2="14"></line>
  </svg>
)

const RevenuesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
)

const ContactIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
)

const ConversationAnalysisIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    <polyline points="9 10 12 13 16 9"></polyline>
  </svg>
)

// const ReportsIcon = () => (
//   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <line x1="18" y1="20" x2="18" y2="10"></line>
//     <line x1="12" y1="20" x2="12" y2="4"></line>
//     <line x1="6" y1="20" x2="6" y2="14"></line>
//   </svg>
// )

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { impersonating, impersonatedUser, stopImpersonation } = useAuth()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    fetchUser()
  }, [])

  const handleStopImpersonation = async () => {
    await stopImpersonation()
    navigate('/dashboard')
  }

  const handleLogout = async () => {
    try {
      // Add timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logout timeout after 5s')), 5000)
      )
      
      const signOutPromise = supabase.auth.signOut()
      
      const result = await Promise.race([signOutPromise, timeoutPromise]) as any
      
      if (result?.error) {
        alert('Failed to sign out: ' + result.error.message)
        return
      }
      
      sessionStorage.clear() // Clear admin status
      navigate('/login')
    } catch {
      // Even if signOut fails, still redirect to login
      sessionStorage.clear()
      navigate('/login')
    }
  }

  const isAdmin = useAdmin()

  const allNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { label: 'Revenues', path: '/revenues', icon: RevenuesIcon },
    { label: 'Accounts', path: '/accounts', icon: AccountsIcon },
    { label: 'Inventory', path: '/inventory', icon: InventoryIcon },
    { label: 'Articles', path: '/articles', icon: ArticlesIcon },
    { label: 'Conversations', path: '/conversations', icon: ConversationsIcon },
    { label: 'Insights', path: '/insights', icon: InsightsIcon },
  ]

  const adminNavItems = [
    { label: 'Ad Reports', path: '/ad-reports', icon: AdReportsIcon },
    { label: 'Usage & Cost', path: '/usage-cost', icon: UsageCostIcon },
    { label: 'Contact Submissions', path: '/contact-submissions', icon: ContactIcon },
    { label: 'Conversation Analysis', path: '/conversation-analysis', icon: ConversationAnalysisIcon },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>

      {/* Impersonation Banner */}
      {impersonating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          background: '#f59e0b',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <span>⚠️ Impersonating: {impersonatedUser?.email}</span>
          <button
            onClick={handleStopImpersonation}
            style={{
              background: '#fff',
              color: '#f59e0b',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Stop Impersonating
          </button>
        </div>
      )}

      {/* User Picker Modal removed — see /impersonate page */}

      {/* Sidebar */}
      <aside 
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        style={{
          width: collapsed ? '64px' : '240px',
          background: '#fff',
          boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
          borderRight: '1px solid rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'fixed',
          left: 0,
          top: impersonating ? '44px' : 0,
          bottom: 0,
          zIndex: 50,
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}
      >
        {/* Top: Icon Image as ID */}
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 20px',
          borderBottom: '1px solid rgba(0,0,0,0.04)',
          minWidth: '240px',
          gap: '8px'
        }}>
            <img 
              src="https://srv.divee.ai/storage/v1/object/public/public-files/divee.ai-logo.png" 
              alt="Logo"
              style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
            />
            <span style={{ 
               marginLeft: '4px', 
               fontWeight: 700, 
               fontSize: '18px', 
               color: 'var(--heading)',
               opacity: collapsed ? 0 : 1,
               transform: collapsed ? 'translateX(-10px)' : 'none',
               transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              Divee.AI
            </span>
            <div style={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? 'scale(0.8)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transformOrigin: 'left center'
            }}>
              <AdminBadge />
            </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '20px 0', flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              {allNavItems.map(item => {
                  const isActive = location.pathname === item.path
                  return (
                      <Link 
                          key={item.path}
                          to={item.path}
                          style={{
                              display: 'flex',
                              alignItems: 'center',
                              height: '48px',
                              padding: '0 20px',
                              color: isActive ? 'var(--primary)' : 'var(--text)',
                              background: isActive ? 'rgba(17, 65, 141, 0.08)' : 'transparent',
                              textDecoration: 'none',
                              boxShadow: isActive ? 'inset 3px 0 0 var(--primary)' : 'none',
                              marginBottom: '4px',
                              transition: 'all 0.2s'
                          }}
                      >
                          <div style={{ 
                              color: isActive ? 'var(--primary)' : 'currentColor', 
                              opacity: 0.8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              flexShrink: 0
                          }}>
                              <item.icon />
                          </div>
                           <span style={{ 
                              marginLeft: '12px',
                              fontSize: '14px', 
                              fontWeight: 500,
                              opacity: collapsed ? 0 : 1,
                              transform: collapsed ? 'translateX(-10px)' : 'none',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}>
                              {item.label}
                          </span>
                      </Link>
                  )
              })}
            </div>

            {/* Admin Section */}
            {isAdmin && adminNavItems.length > 0 && (
              <div>
                <div style={{ 
                  height: '1px', 
                  background: 'rgba(0,0,0,0.06)', 
                  margin: '12px 20px 16px'
                }} />

                {/* Impersonate link */}
                <Link
                  to="/impersonate"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '48px',
                    padding: '0 20px',
                    color: location.pathname === '/impersonate' ? '#7c3aed' : '#7c3aed',
                    background: location.pathname === '/impersonate' ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                    textDecoration: 'none',
                    boxShadow: location.pathname === '/impersonate' ? 'inset 3px 0 0 #7c3aed' : 'none',
                    marginBottom: '4px',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      <line x1="19" y1="8" x2="23" y2="12"/>
                      <line x1="23" y1="8" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <span style={{
                    marginLeft: '12px',
                    fontSize: '14px',
                    fontWeight: 500,
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-10px)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}>
                    Impersonate User
                  </span>
                </Link>

                {adminNavItems.map(item => {
                    const isActive = location.pathname === item.path
                    return (
                        <Link 
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                height: '48px',
                                padding: '0 20px',
                                color: isActive ? 'var(--primary)' : 'var(--text)',
                                background: isActive ? 'rgba(17, 65, 141, 0.08)' : 'transparent',
                                textDecoration: 'none',
                                boxShadow: isActive ? 'inset 3px 0 0 var(--primary)' : 'none',
                                marginBottom: '4px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ 
                                color: isActive ? 'var(--primary)' : 'currentColor', 
                                opacity: 0.8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                flexShrink: 0
                            }}>
                                <item.icon />
                            </div>
                             <span style={{ 
                                marginLeft: '12px',
                                fontSize: '14px', 
                                fontWeight: 500,
                                opacity: collapsed ? 0 : 1,
                                transform: collapsed ? 'translateX(-10px)' : 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
              </div>
            )}
        </nav>

        {/* Bottom Actions */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.04)', padding: '10px 0', minWidth: '240px' }}>
            {/* User Email */}
            {userEmail && (
              <div style={{
                padding: '12px 20px 8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: collapsed ? 0 : 1,
                  transform: collapsed ? 'translateX(-10px)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  {userEmail}
                </div>
              </div>
            )}
            
            <button
                onClick={() => handleLogout()}
                style={{
                    width: '100%',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    pointerEvents: 'auto'
                }}
            >
                <div style={{
                     width: '24px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     flexShrink: 0
                }}>
                    <LogoutIcon />
                </div>
                <span style={{ 
                    marginLeft: '12px',
                    fontSize: '14px',
                    opacity: collapsed ? 0 : 1,
                    transform: collapsed ? 'translateX(-10px)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                    Sign out
                </span>
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ 
        flex: 1, 
        marginLeft: collapsed ? '64px' : '64px',
        marginTop: impersonating ? '44px' : 0,
        padding: '32px',
        maxWidth: '1600px',
        width: '100%'
      }}>
        <Outlet />
      </main>
    </div>
  )
}
