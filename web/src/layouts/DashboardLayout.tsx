import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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

const ReportsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
)

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
    { label: 'Accounts', path: '/accounts', icon: AccountsIcon },
    { label: 'Inventory', path: '/inventory', icon: InventoryIcon },
    // { label: 'Reports', path: '/analytics', icon: ReportsIcon },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
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
          top: 0,
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
          minWidth: '240px'
        }}>
            <img 
              src="https://srv.divee.ai/storage/v1/object/public/public-files/divee.ai-logo.png" 
              alt="Logo"
              style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }}
            />
            <span style={{ 
               marginLeft: '12px', 
               fontWeight: 700, 
               fontSize: '18px', 
               color: 'var(--heading)',
               opacity: collapsed ? 0 : 1,
               transform: collapsed ? 'translateX(-10px)' : 'none',
               transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              Divee.AI
            </span>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '20px 0', flex: 1, minWidth: '240px' }}>
            {navItems.map(item => {
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
        </nav>

        {/* Bottom Actions */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.04)', padding: '10px 0', minWidth: '240px' }}>
            <button
                onClick={handleLogout}
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
        marginLeft: collapsed ? '64px' : '64px', // Keep content margin constant to avoid layout shift, or '240px' if pushing page. 
        // User said "expand on hover". Typically hover sidebars float OVER content or push content. 
        // If it pushes content on hover, the whole page jitters. Better to float over or keep fixed narrow margin.
        // But if I keep fixed narrow margin (64px), when expanded (240px), the sidebar will cover the left side of the content.
        // Let's assume standard behavior: Sidebar expands OVER content (z-index 50).
        padding: '32px',
        maxWidth: '1600px',
        width: '100%'
      }}>
        <Outlet />
      </main>
    </div>
  )
}
