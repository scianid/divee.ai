import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface QAPair {
  question: string
  answer: string
}

interface Article {
  url: string
  title: string
  content: string | null
  cache: any
  project_id: string
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
  const [qaModalOpen, setQaModalOpen] = useState(false)
  const [selectedArticleQA, setSelectedArticleQA] = useState<QAPair[]>([])
  const [selectedArticleTitle, setSelectedArticleTitle] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's accounts
      const { data: accountsData } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', user.id)

      if (!accountsData || accountsData.length === 0) {
        setLoading(false)
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

      // Fetch all articles for these projects
      const projectIds = (projectsData || []).map(p => p.project_id)
      if (projectIds.length > 0) {
        const { data: articlesData } = await supabase
          .from('article')
          .select('*')
          .in('project_id', projectIds)
          .order('url', { ascending: true })

        if (articlesData) {
          setArticles(articlesData)
        }
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = selectedProject === 'all' 
    ? articles 
    : articles.filter(a => a.project_id === selectedProject)

  const searchedArticles = searchQuery.trim() === ''
    ? filteredArticles
    : filteredArticles.filter(article => 
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.url.toLowerCase().includes(searchQuery.toLowerCase())
      )

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.project_id === projectId)
    return project?.client_name || projectId
  }

  const getQACount = (cache: any): number => {
    if (!cache) return 0
    try {
      const cacheData = typeof cache === 'string' ? JSON.parse(cache) : cache
      if (Array.isArray(cacheData)) {
        return cacheData.length
      }
      if (cacheData.suggestions && Array.isArray(cacheData.suggestions)) {
        return cacheData.suggestions.length
      }
      if (cacheData.qa && Array.isArray(cacheData.qa)) {
        return cacheData.qa.length
      }
      if (cacheData.questions && Array.isArray(cacheData.questions)) {
        return cacheData.questions.length
      }
    } catch (e) {
      console.error('Error parsing cache:', e)
    }
    return 0
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

  const openQAModal = (article: Article) => {
    const qaPairs = extractQAPairs(article.cache)
    setSelectedArticleQA(qaPairs)
    setSelectedArticleTitle(article.title || article.url)
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
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Articles</h1>
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
      {searchedArticles.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px dashed #cbd5e1'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
            {searchQuery.trim() !== '' ? 'No articles found' : 'No articles yet'}
          </h3>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {searchQuery.trim() !== '' 
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
              </tr>
            </thead>
            <tbody>
              {searchedArticles.map((article, idx) => (
                <tr 
                  key={article.url}
                  style={{
                    borderBottom: idx < searchedArticles.length - 1 ? '1px solid #f1f5f9' : 'none',
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
                      const qaCount = getQACount(article.cache)
                      if (qaCount === 0) {
                        return (
                          <span style={{ fontSize: 13, color: '#94a3b8' }}>
                            —
                          </span>
                        )
                      }
                      return (
                        <button
                          onClick={() => openQAModal(article)}
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
                          {qaCount} {qaCount === 1 ? 'Q&A' : 'Q&As'}
                        </button>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
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

            {/* Content */}
            <div style={{
              padding: '24px 28px',
              overflowY: 'auto',
              flex: 1
            }}>
              {selectedArticleQA.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>?</div>
                  <p>No questions and answers found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {selectedArticleQA.map((qa, idx) => (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
