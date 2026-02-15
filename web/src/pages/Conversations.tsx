import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../hooks/useAdmin'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface Conversation {
  id: string
  project_id: string
  article_unique_id: string
  visitor_id: string
  session_id: string
  article_title: string
  messages: Message[]
  started_at: string
  last_message_at: string
  message_count: number
  total_chars: number
}

interface Project {
  project_id: string
  client_name: string
  icon_url: string | null
}

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null)
  const isAdmin = useAdmin()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedProject, searchQuery, dateRange])

  useEffect(() => {
    fetchConversations()
  }, [selectedProject, searchQuery, currentPage, projects, dateRange])

  async function fetchProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ownedAccounts } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', user.id)

      const { data: collaboratedAccounts } = await supabase
        .from('account_collaborator')
        .select('account_id')
        .eq('user_id', user.id)

      const ownedIds = ownedAccounts?.map(a => a.id) || []
      const collaboratedIds = collaboratedAccounts?.map(a => a.account_id) || []
      const allAccountIds = [...new Set([...ownedIds, ...collaboratedIds])]

      if (allAccountIds.length === 0) {
        setLoading(false)
        return
      }

      const { data: projectsData } = await supabase
        .from('project')
        .select('project_id, client_name, icon_url')
        .in('account_id', allAccountIds)

      if (projectsData) {
        setProjects(projectsData)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  async function fetchConversations() {
    if (projects.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const projectIds = projects.map(p => p.project_id)

      let query = supabase
        .from('conversations')
        .select('id, project_id, article_unique_id, visitor_id, session_id, article_title, messages, started_at, last_message_at, message_count, total_chars', { count: 'exact' })
        .in('project_id', projectIds)

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      if (dateRange.start) {
        query = query.gte('started_at', `${dateRange.start}T00:00:00`)
      }
      if (dateRange.end) {
        query = query.lte('started_at', `${dateRange.end}T23:59:59`)
      }

      // Search in article title
      if (searchQuery.trim() !== '') {
        query = query.ilike('article_title', `%${searchQuery}%`)
      }

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)
      query = query.order('last_message_at', { ascending: false })

      const { data: conversationsData, count, error } = await query

      if (error) {
        console.error('Error fetching conversations:', error)
        return
      }

      setConversations(conversationsData || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.project_id === projectId)
    return project?.client_name || projectId
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFirstUserMessage = (messages: Message[]) => {
    const userMsg = messages?.find(m => m.role === 'user')
    return userMsg?.content || '-'
  }

  const formatDuration = (startedAt: string, lastMessageAt: string) => {
    const start = new Date(startedAt).getTime()
    const end = new Date(lastMessageAt).getTime()
    const diffMs = end - start
    if (diffMs < 0) return '-'
    const totalSeconds = Math.floor(diffMs / 1000)
    if (totalSeconds < 60) return '<1m'
    const totalMinutes = Math.floor(totalSeconds / 60)
    if (totalMinutes < 60) return `${totalMinutes}m`
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  const analyzeConversations = async () => {
    if (selectedProject === 'all') {
      setAnalyzeResult('Please select a specific project first')
      setTimeout(() => setAnalyzeResult(null), 3000)
      return
    }

    setAnalyzing(true)
    setAnalyzeResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setAnalyzeResult('Not authenticated')
        return
      }

      const response = await fetch(
        `https://srv.divee.ai/functions/v1/analyze-conversations?projectId=${selectedProject}&limit=15`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze conversations')
      }

      setAnalyzeResult(`✓ Analyzed ${data.processed} conversations`)
      fetchConversations() // Refresh the list
      setTimeout(() => setAnalyzeResult(null), 5000)
    } catch (error) {
      console.error('Failed to analyze conversations:', error)
      setAnalyzeResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => setAnalyzeResult(null), 5000)
    } finally {
      setAnalyzing(false)
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div style={{ fontFamily: 'var(--font-display)', color: '#334155' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Conversations
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
            View all user conversations from your widgets
          </p>
        </div>
        
        {/* Admin: Analyze Conversations Button */}
        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button
              onClick={analyzeConversations}
              disabled={analyzing || selectedProject === 'all'}
              style={{
                padding: '10px 20px',
                background: analyzing ? '#94a3b8' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: analyzing || selectedProject === 'all' ? 'not-allowed' : 'pointer',
                opacity: analyzing || selectedProject === 'all' ? 0.6 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {analyzing ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze Conversations
                </>
              )}
            </button>
            {analyzeResult && (
              <div style={{
                fontSize: '13px',
                color: analyzeResult.startsWith('✓') ? '#10b981' : '#ef4444',
                fontWeight: 500
              }}>
                {analyzeResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by article title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: '#fff'
            }}
          />
          <svg 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#94a3b8" 
            strokeWidth="2"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        {/* Project Filter */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            background: '#fff',
            cursor: 'pointer',
            minWidth: '180px'
          }}
        >
          <option value="all">All Widgets</option>
          {projects.map(project => (
            <option key={project.project_id} value={project.project_id}>
              {project.client_name}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            style={{
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: '#fff',
              cursor: 'pointer'
            }}
          />
          <span style={{ color: '#94a3b8' }}>→</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            style={{
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: '#fff',
              cursor: 'pointer'
            }}
          />
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              style={{
                padding: '10px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#fff',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
        {loading ? 'Loading...' : `${totalCount} conversation${totalCount !== 1 ? 's' : ''} found`}
      </div>

      {/* Table */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ 
              display: 'inline-block', 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f4f6', 
              borderTop: '4px solid #2563eb', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>No conversations found</p>
            <p style={{ margin: '8px 0 0', fontSize: '14px' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Article</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>First Message</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Widget</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Messages</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Started</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>View</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr 
                  key={conversation.id} 
                  style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <td style={{ padding: '16px', fontSize: '14px', color: '#1e293b', maxWidth: '200px' }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      maxWidth: '200px',
                      fontWeight: 500
                    }}>
                      {conversation.article_title || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', maxWidth: '300px' }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      maxWidth: '300px'
                    }}>
                      {getFirstUserMessage(conversation.messages)}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>
                    {getProjectName(conversation.project_id)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 10px', 
                      borderRadius: '999px', 
                      fontSize: '12px', 
                      fontWeight: 500,
                      background: '#dbeafe',
                      color: '#1d4ed8'
                    }}>
                      {conversation.message_count}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {formatDuration(conversation.started_at, conversation.last_message_at)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatDate(conversation.started_at)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedConversation(conversation)
                      }}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#2563eb',
                        fontWeight: 500
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#fff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                fontSize: '14px'
              }}
            >
              Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      background: currentPage === pageNum ? '#2563eb' : '#fff',
                      color: currentPage === pageNum ? '#fff' : '#334155',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: currentPage === pageNum ? 600 : 400
                    }}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#fff',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                fontSize: '14px'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Conversation Modal */}
      {selectedConversation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedConversation(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#1e293b', 
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedConversation.article_title}
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                  <span>{getProjectName(selectedConversation.project_id)}</span>
                  <span>•</span>
                  <span>{selectedConversation.message_count} messages</span>
                  <span>•</span>
                  <span>{formatDate(selectedConversation.started_at)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((message, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: message.role === 'user' ? '#2563eb' : '#f1f5f9',
                      color: message.role === 'user' ? '#fff' : '#1e293b',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {message.content}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      marginTop: '4px',
                      padding: '0 4px'
                    }}>
                      {message.role === 'user' ? 'User' : 'Assistant'}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                  No messages in this conversation
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
