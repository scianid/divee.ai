import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface QAPair {
  question: string
  answer: string
}

interface FreeformQuestion {
  id: number
  project_id: string
  article_unique_id: string
  question: string
  answer: string | null
  created_at: string
}

interface Article {
  url: string
  title: string
  content: string | null
  cache: any
  project_id: string
  article_unique_id?: string
}

interface Project {
  project_id: string
  client_name: string
  icon_url: string | null
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [qaModalOpen, setQaModalOpen] = useState(false)
  const [selectedArticleQA, setSelectedArticleQA] = useState<QAPair[]>([])
  const [selectedArticleTitle, setSelectedArticleTitle] = useState('')
  const [freeformQuestions, setFreeformQuestions] = useState<FreeformQuestion[]>([])
  const [freeformCounts, setFreeformCounts] = useState<Record<string, number>>({})
  const [activeQATab, setActiveQATab] = useState<'regular' | 'freeform'>('regular')
  const [selectedFreeformQA, setSelectedFreeformQA] = useState<any[]>([])

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [selectedProject, searchQuery])

  useEffect(() => {
    fetchArticles()
    fetchFreeformQuestions()
  }, [selectedProject, searchQuery, currentPage, projects])

  async function fetchProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's accounts
      const { data: accountsData } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', user.id)

      if (!accountsData || accountsData.length === 0) {
        return
      }

      const accountIds = accountsData.map(a => a.id)

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('project')
        .select('project_id, client_name, icon_url')
        .in('account_id', accountIds)

      if (projectsData) {
        setProjects(projectsData)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  async function fetchFreeformQuestions() {
    if (projects.length === 0) return

    try {
      const projectIds = projects.map(p => p.project_id)

      let query = supabase
        .from('freeform_qa')
        .select('*')
        .in('project_id', projectIds)

      // Apply project filter
      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      const { data: freeformData, error } = await query

      if (error) {
        console.error('Error fetching freeform questions:', error)
        return
      }

      if (freeformData) {
        setFreeformQuestions(freeformData)
        
        // Calculate counts per article_unique_id
        const counts: Record<string, number> = {}
        freeformData.forEach(q => {
          counts[q.article_unique_id] = (counts[q.article_unique_id] || 0) + 1
        })
        setFreeformCounts(counts)
      }
    } catch (error) {
      console.error('Error fetching freeform questions:', error)
    }
  }

  async function fetchArticles() {
    if (projects.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const projectIds = projects.map(p => p.project_id)

      // Build the query with filters
      let query = supabase
        .from('article')
        .select('url, title, content, cache, project_id, unique_id', { count: 'exact' })
        .in('project_id', projectIds)

      // Apply project filter
      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      // Apply search filter
      if (searchQuery.trim() !== '') {
        query = query.or(`title.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`)
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1
      query = query.range(from, to)

      // Order results
      query = query.order('url', { ascending: true })

      const { data: articlesData, count } = await query

      if (articlesData) {
        // Map unique_id to article_unique_id for consistency
        const articlesWithUniqueId = articlesData.map(a => ({
          ...a,
          article_unique_id: a.unique_id
        }))
        
        setArticles(articlesWithUniqueId)
        setTotalCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.project_id === projectId)
    return project?.client_name || projectId
  }

  const getQACount = (cache: any, articleUniqueId: string): number => {
    let cacheCount = 0
    if (cache) {
      try {
        const cacheData = typeof cache === 'string' ? JSON.parse(cache) : cache
        if (Array.isArray(cacheData)) {
          cacheCount = cacheData.length
        } else if (cacheData.suggestions && Array.isArray(cacheData.suggestions)) {
          cacheCount = cacheData.suggestions.length
        } else if (cacheData.qa && Array.isArray(cacheData.qa)) {
          cacheCount = cacheData.qa.length
        } else if (cacheData.questions && Array.isArray(cacheData.questions)) {
          cacheCount = cacheData.questions.length
        }
      } catch (e) {
        console.error('Error parsing cache:', e)
      }
    }
    
    // Add freeform questions count
    const freeformCount = freeformCounts[articleUniqueId] || 0
    return cacheCount + freeformCount
  }

  const extractQAPairs = (cache: any): QAPair[] => {
    if (!cache) return []
    try {
      const cacheData = typeof cache === 'string' ? JSON.parse(cache) : cache
      
      // Try different possible structures
      if (Array.isArray(cacheData)) {
        return cacheData
      }
      if (cacheData.suggestions && Array.isArray(cacheData.suggestions)) {
        return cacheData.suggestions.map((item: any) => ({
          question: item.question,
          answer: item.answer || 'No answer yet'
        }))
      }
      if (cacheData.qa && Array.isArray(cacheData.qa)) {
        return cacheData.qa
      }
      if (cacheData.questions && Array.isArray(cacheData.questions)) {
        return cacheData.questions
      }
      
      // If it's an object with question/answer properties
      if (cacheData.question && cacheData.answer) {
        return [{ question: cacheData.question, answer: cacheData.answer }]
      }
    } catch (e) {
      console.error('Error extracting Q&A:', e)
    }
    return []
  }

  const openQAModal = (article: Article, tab: 'regular' | 'freeform' = 'regular') => {
    const qaPairs = extractQAPairs(article.cache)
    
    // Add freeform questions for this article using article_unique_id
    const freeformForArticle = freeformQuestions
      .filter(q => q.article_unique_id === article.article_unique_id)
      .map(q => ({
        question: q.question,
        answer: q.answer || 'Pending answer',
        isFreeform: true,
        created_at: q.created_at
      }))
    
    // Store both separately
    setSelectedArticleQA(qaPairs)
    setSelectedFreeformQA(freeformForArticle)
    setSelectedArticleTitle(article.title || article.url)
    setActiveQATab(tab)
    setQaModalOpen(true)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1600, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a' }}>Articles</h1>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#4f46e5' }}>
            {totalCount} {totalCount === 1 ? 'article' : 'articles'}
          </span>
          {freeformQuestions.length > 0 && (
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#10b981',
              padding: '4px 12px',
              borderRadius: 6,
              background: 'rgba(16, 185, 129, 0.1)'
            }}>
              {freeformQuestions.length} freeform {freeformQuestions.length === 1 ? 'question' : 'questions'}
            </span>
          )}
        </div>
        <p style={{ fontSize: 15, color: '#64748b' }}>
          Articles where your widgets are embedded. here you will see articles where the widget already was loaded at least once.
        </p>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 14,
            fontWeight: 500,
            color: '#334155',
            background: '#fff',
            cursor: 'pointer',
            minWidth: 200
          }}
        >
          <option value="all">All Widgets</option>
          {projects.map(project => (
            <option key={project.project_id} value={project.project_id}>
              {project.client_name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search articles by title or URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 250,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 14,
            color: '#334155',
            background: '#fff'
          }}
        />
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px dashed #cbd5e1'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
            {searchQuery.trim() !== '' || selectedProject !== 'all' ? 'No articles found' : 'No articles yet'}
          </h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {searchQuery.trim() !== '' || selectedProject !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Articles will appear here once your widget is embedded and loaded on pages'
            }
          </p>
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 10px 20px -5px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Article
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Widget
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  URL
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Q&A
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Freeform Q&A
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article, idx) => (
                <tr 
                  key={article.url}
                  style={{
                    borderBottom: idx < articles.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                    {article.title || 'Untitled'}
                  </td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {(() => {
                        const project = projects.find(p => p.project_id === article.project_id);
                        return project?.icon_url ? (
                          <img 
                            src={project.icon_url} 
                            alt={project.client_name}
                            style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(79,70,229,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#4f46e5' }}>
                            {project?.client_name.charAt(0).toUpperCase()}
                          </div>
                        );
                      })()}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(79,70,229,0.1))',
                        color: '#4f46e5',
                        fontSize: 13,
                        fontWeight: 500
                      }}>
                        {getProjectName(article.project_id)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#64748b' }}>
                    <a 
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#4f46e5',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {article.url.length > 60 ? article.url.substring(0, 60) + '...' : article.url}
                      <span style={{ fontSize: 16 }}>↗</span>
                    </a>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {(() => {
                      const cacheQACount = extractQAPairs(article.cache).length
                      
                      if (cacheQACount === 0) {
                        return (
                          <span style={{ fontSize: 13, color: '#94a3b8' }}>
                            —
                          </span>
                        )
                      }
                      return (
                        <button
                          onClick={() => openQAModal(article, 'regular')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            color: '#4f46e5',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8fafc'
                            e.currentTarget.style.borderColor = '#4f46e5'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff'
                            e.currentTarget.style.borderColor = '#e2e8f0'
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Q</span>
                          {cacheQACount} {cacheQACount === 1 ? 'Q&A' : 'Q&As'}
                        </button>
                      )
                    })()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {(() => {
                      const freeformCount = freeformCounts[article.article_unique_id || ''] || 0
                      
                      if (freeformCount === 0) {
                        return (
                          <span style={{ fontSize: 13, color: '#94a3b8' }}>
                            —
                          </span>
                        )
                      }
                      return (
                        <button
                          onClick={() => openQAModal(article, 'freeform')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            background: 'rgba(16, 185, 129, 0.05)',
                            color: '#10b981',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                            e.currentTarget.style.borderColor = '#10b981'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 600 }}>Q</span>
                          {freeformCount} {freeformCount === 1 ? 'question' : 'questions'}
                        </button>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalCount > itemsPerPage && (
            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: 14, color: '#64748b' }}>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: currentPage === 1 ? '#f8fafc' : '#fff',
                    color: currentPage === 1 ? '#94a3b8' : '#334155',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.background = '#f8fafc'
                      e.currentTarget.style.borderColor = '#cbd5e1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.background = '#fff'
                      e.currentTarget.style.borderColor = '#e2e8f0'
                    }
                  }}
                >
                  Previous
                </button>
                
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {(() => {
                    const totalPages = Math.ceil(totalCount / itemsPerPage)
                    const pages = []
                    const maxVisible = 5
                    
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1)
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1)
                    }
                    
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => setCurrentPage(1)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            color: '#334155',
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            minWidth: 40
                          }}
                        >
                          1
                        </button>
                      )
                      if (startPage > 2) {
                        pages.push(
                          <span key="dots1" style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
                        )
                      }
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: i === currentPage ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                            background: i === currentPage ? '#4f46e5' : '#fff',
                            color: i === currentPage ? '#fff' : '#334155',
                            fontSize: 14,
                            fontWeight: i === currentPage ? 600 : 500,
                            cursor: 'pointer',
                            minWidth: 40,
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            if (i !== currentPage) {
                              e.currentTarget.style.background = '#f8fafc'
                              e.currentTarget.style.borderColor = '#cbd5e1'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (i !== currentPage) {
                              e.currentTarget.style.background = '#fff'
                              e.currentTarget.style.borderColor = '#e2e8f0'
                            }
                          }}
                        >
                          {i}
                        </button>
                      )
                    }
                    
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <span key="dots2" style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
                        )
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            color: '#334155',
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            minWidth: 40
                          }}
                        >
                          {totalPages}
                        </button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    background: currentPage >= Math.ceil(totalCount / itemsPerPage) ? '#f8fafc' : '#fff',
                    color: currentPage >= Math.ceil(totalCount / itemsPerPage) ? '#94a3b8' : '#334155',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: currentPage >= Math.ceil(totalCount / itemsPerPage) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage < Math.ceil(totalCount / itemsPerPage)) {
                      e.currentTarget.style.background = '#f8fafc'
                      e.currentTarget.style.borderColor = '#cbd5e1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage < Math.ceil(totalCount / itemsPerPage)) {
                      e.currentTarget.style.background = '#fff'
                      e.currentTarget.style.borderColor = '#e2e8f0'
                    }
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Q&A Modal */}
      {qaModalOpen && (
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
          onClick={() => setQaModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 800,
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
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    Questions & Answers
                  </h2>
                  <p style={{ fontSize: 14, color: '#64748b' }}>
                    {selectedArticleTitle}
                  </p>
                </div>
                <button
                  onClick={() => setQaModalOpen(false)}
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

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setActiveQATab('regular')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeQATab === 'regular' ? '#4f46e5' : 'transparent',
                    color: activeQATab === 'regular' ? '#fff' : '#64748b',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeQATab !== 'regular') {
                      e.currentTarget.style.background = '#f8fafc'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeQATab !== 'regular') {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  Regular Q&A ({selectedArticleQA.length})
                </button>
                <button
                  onClick={() => setActiveQATab('freeform')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: activeQATab === 'freeform' ? '#10b981' : 'transparent',
                    color: activeQATab === 'freeform' ? '#fff' : '#64748b',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (activeQATab !== 'freeform') {
                      e.currentTarget.style.background = '#f8fafc'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeQATab !== 'freeform') {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  Freeform Q&A ({selectedFreeformQA.length})
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{
              padding: '24px 28px',
              overflowY: 'auto',
              flex: 1
            }}>
              {activeQATab === 'regular' ? (
                selectedArticleQA.length === 0 ? (
                  <div style={{
                    padding: 40,
                    textAlign: 'center',
                    color: '#64748b'
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>?</div>
                    <p>No regular questions and answers found</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {selectedArticleQA.map((qa: any, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 20,
                          borderRadius: 12,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ marginBottom: 12 }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#4f46e5',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: 8
                          }}>
                            <span style={{ fontWeight: 700 }}>Q</span>
                            Question
                          </div>
                          <p style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: '#0f172a',
                            lineHeight: 1.6,
                            margin: 0
                          }}>
                            {qa.question}
                          </p>
                        </div>
                        <div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#059669',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: 8
                          }}>
                            <span style={{ fontWeight: 700 }}>A</span>
                            Answer
                          </div>
                          <p style={{
                            fontSize: 14,
                            color: '#334155',
                            lineHeight: 1.7,
                            margin: 0,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {qa.answer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                selectedFreeformQA.length === 0 ? (
                  <div style={{
                    padding: 40,
                    textAlign: 'center',
                    color: '#64748b'
                  }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>?</div>
                    <p>No freeform questions found</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {selectedFreeformQA.map((qa: any, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 20,
                          borderRadius: 12,
                          background: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <div style={{ marginBottom: 12 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 8
                          }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#10b981',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <span style={{ fontWeight: 700 }}>Q</span>
                              Question
                            </div>
                            <span style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#10b981',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'rgba(16, 185, 129, 0.15)'
                            }}>
                              FREEFORM
                            </span>
                          </div>
                          <p style={{
                            fontSize: 15,
                            fontWeight: 500,
                            color: '#0f172a',
                            lineHeight: 1.6,
                            margin: 0
                          }}>
                            {qa.question}
                          </p>
                        </div>
                        <div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#059669',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: 8
                          }}>
                            <span style={{ fontWeight: 700 }}>A</span>
                            Answer
                          </div>
                          <p style={{
                            fontSize: 14,
                            color: '#334155',
                            lineHeight: 1.7,
                            margin: 0,
                            whiteSpace: 'pre-wrap'
                          }}>
                            {qa.answer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
