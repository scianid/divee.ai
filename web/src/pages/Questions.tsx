import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Question {
  id: number
  project_id: string
  event_type: string
  event_data: {
    question?: string
    article_url?: string
    url?: string
  }
  created_at: string
}

interface Project {
  project_id: string
  client_name: string
  icon_url: string | null
}

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([])
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

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [selectedProject, searchQuery, dateRange])

  useEffect(() => {
    fetchQuestions()
  }, [selectedProject, searchQuery, currentPage, projects, dateRange])

  async function fetchProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's owned accounts
      const { data: ownedAccounts } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', user.id)

      // Fetch user's collaborated accounts
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

      // Fetch projects
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

  async function fetchQuestions() {
    if (projects.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const projectIds = projects.map(p => p.project_id)

      // Build the query with filters
      let query = supabase
        .from('analytics_events')
        .select('id, project_id, event_type, event_data, created_at', { count: 'exact' })
        .in('project_id', projectIds)
        .in('event_type', ['custom_question_asked', 'suggestion_question_asked'])

      // Apply project filter
      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      // Apply date range filter
      if (dateRange.start) {
        query = query.gte('created_at', `${dateRange.start}T00:00:00`)
      }
      if (dateRange.end) {
        query = query.lte('created_at', `${dateRange.end}T23:59:59`)
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      // Order results by creation date (newest first)
      query = query.order('created_at', { ascending: false })

      const { data: questionsData, count, error } = await query

      if (error) {
        console.error('Error fetching questions:', error)
        return
      }

      // Filter by search query client-side (searching in event_data.question)
      let filteredData = questionsData || []
      if (searchQuery.trim() !== '') {
        const searchLower = searchQuery.toLowerCase()
        filteredData = filteredData.filter(q => 
          q.event_data?.question?.toLowerCase().includes(searchLower) ||
          q.event_data?.article_url?.toLowerCase().includes(searchLower) ||
          q.event_data?.url?.toLowerCase().includes(searchLower)
        )
      }

      setQuestions(filteredData)
      setTotalCount(searchQuery ? filteredData.length : (count || 0))
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.project_id === projectId)
    return project?.client_name || projectId
  }

  const getQuestionTypeLabel = (eventType: string) => {
    if (eventType === 'suggestion_question_asked') return 'Suggested'
    if (eventType === 'custom_question_asked') return 'Freeform'
    return eventType
  }

  const getQuestionTypeColor = (eventType: string) => {
    if (eventType === 'suggestion_question_asked') return { bg: '#dbeafe', text: '#1d4ed8' }
    if (eventType === 'custom_question_asked') return { bg: '#fce7f3', text: '#be185d' }
    return { bg: '#f1f5f9', text: '#64748b' }
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

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div style={{ fontFamily: 'var(--font-display)', color: '#334155' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Questions
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
          View all questions asked by users across your widgets
        </p>
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
            placeholder="Search questions..."
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
        {loading ? 'Loading...' : `${totalCount} question${totalCount !== 1 ? 's' : ''} found`}
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
        ) : questions.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>No questions found</p>
            <p style={{ margin: '8px 0 0', fontSize: '14px' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Question</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Widget</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Article</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => {
                const typeColor = getQuestionTypeColor(question.event_type)
                const articleUrl = question.event_data?.article_url || question.event_data?.url || ''
                return (
                  <tr key={question.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1e293b', maxWidth: '400px' }}>
                      <div style={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        maxWidth: '400px'
                      }}>
                        {question.event_data?.question || '-'}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '4px 10px', 
                        borderRadius: '999px', 
                        fontSize: '12px', 
                        fontWeight: 500,
                        background: typeColor.bg,
                        color: typeColor.text
                      }}>
                        {getQuestionTypeLabel(question.event_type)}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>
                      {getProjectName(question.project_id)}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', maxWidth: '250px' }}>
                      {articleUrl ? (
                        <a 
                          href={articleUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: '#2563eb', 
                            textDecoration: 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            maxWidth: '250px'
                          }}
                        >
                          {new URL(articleUrl).pathname || articleUrl}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDate(question.created_at)}
                    </td>
                  </tr>
                )
              })}
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
