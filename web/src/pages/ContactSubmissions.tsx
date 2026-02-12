import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- Interfaces ---

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface SubmissionsData {
  submissions: ContactSubmission[];
  total: number;
  limit: number;
  offset: number;
}

// --- Icons ---

const MailIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// --- Helper Components ---

function Card({ 
  children, 
  style = {}, 
  title, 
  className = '' 
}: { 
  children: React.ReactNode; 
  style?: React.CSSProperties; 
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {title && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: 0 }}>
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
}

// --- Main Component ---

export default function ContactSubmissions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SubmissionsData | null>(null);
  const navigate = useNavigate();
  
  const { user, isAdmin, isLoading } = useAuth();

  // Auth and admin check
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Don't render until admin check is complete
  if (isLoading || !user) {
    return (
      <div style={{ 
        padding: '48px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>
          {`@keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }`}
        </style>
        <div style={{ color: '#64748b', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Fetch contact submissions
  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `https://srv.divee.ai/functions/v1/contact-submissions`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch submissions');
      }

      const submissionsData: SubmissionsData = await response.json();
      setData(submissionsData);
    } catch (err) {
      console.error('Failed to fetch contact submissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (user && isAdmin) {
      fetchSubmissions();
    }
  }, [user, isAdmin]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ color: 'var(--primary)', display: 'flex' }}>
              <MailIcon />
            </div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 700, 
              color: 'var(--heading)', 
              margin: 0 
            }}>
              Contact Submissions
            </h1>
          </div>
          <p style={{ 
            fontSize: '15px', 
            color: 'var(--text-secondary)', 
            margin: 0 
          }}>
            Form submissions from the landing page
          </p>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={fetchSubmissions}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '999px',
            border: '1px solid #e2e8f0',
            background: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            color: '#334155',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          <RefreshIcon />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Loading State */}
      {loading && !data && (
        <Card>
          <div style={{ 
            textAlign: 'center', 
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>
              {`@keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }`}
            </style>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Loading submissions...</div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <div style={{ 
            padding: '16px', 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            fontSize: '14px'
          }}>
            Error: {error}
          </div>
        </Card>
      )}

      {/* Data Display */}
      {!loading && !error && data && (
        <>
          {/* Summary Card */}
          <Card style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
              Total Submissions
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#2563eb', marginBottom: '4px' }}>
              {data.total}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {data.submissions.length} shown
            </div>
          </Card>

          {/* Submissions Table */}
          {data.submissions.length > 0 ? (
            <Card title="Recent Submissions">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Date
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Name
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Email
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Phone
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Company
                      </th>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.submissions.map((submission, idx) => (
                      <tr 
                        key={submission.id}
                        style={{ 
                          borderBottom: idx < data.submissions.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}
                      >
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '13px', 
                          color: '#64748b',
                          whiteSpace: 'nowrap'
                        }}>
                          {formatDate(submission.created_at)}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '14px', 
                          color: '#334155',
                          fontWeight: 500 
                        }}>
                          {submission.name}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '14px', 
                          color: '#2563eb'
                        }}>
                          <a 
                            href={`mailto:${submission.email}`}
                            style={{ 
                              color: '#2563eb',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {submission.email}
                          </a>
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '14px', 
                          color: '#64748b'
                        }}>
                          {submission.phone ? (
                            <a 
                              href={`tel:${submission.phone}`}
                              style={{ 
                                color: '#64748b',
                                textDecoration: 'none'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                            >
                              {submission.phone}
                            </a>
                          ) : (
                            <span style={{ color: '#cbd5e1' }}>—</span>
                          )}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '14px', 
                          color: '#64748b'
                        }}>
                          {submission.company_name || <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '13px', 
                          color: '#94a3b8',
                          fontFamily: 'monospace'
                        }}>
                          {submission.ip_address || <span style={{ color: '#cbd5e1' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ 
                textAlign: 'center', 
                padding: '48px 24px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                  📬
                </div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#334155', 
                  marginBottom: '8px' 
                }}>
                  No Submissions Yet
                </h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                  Contact form submissions will appear here once users submit the form.
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
