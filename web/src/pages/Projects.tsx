import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Reveal } from '../components/Reveal'

interface Project {
  id: number
  created_at: string
  direction: 'ltr' | 'rtl'
  language: string
  icon_url: string | null
  client_name: string
  client_description: string | null
  highlight_color: string[] | null
  show_ad: boolean
  input_text_placeholders: string[]
  allowed_urls: string[] | null
  project_id: string
  user_id: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Form State
  const initialFormState = {
    client_name: '',
    client_description: '',
    language: 'English',
    direction: 'ltr',
    icon_url: '',
    highlight_color_1: '#68E5FD',
    highlight_color_2: '#A389E0',
    input_text_placeholders: [
      'Ask anything about this article',
      'I can help you understand this article'
    ],
    allowed_urls: []
  }
  const [formData, setFormData] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [tempPlaceholder, setTempPlaceholder] = useState('')
  const [tempUrl, setTempUrl] = useState('')

  useEffect(() => {
    fetchUserAndProjects()
  }, [])

  async function fetchUserAndProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data, error } = await supabase
        .from('project')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setProjects(data as Project[])
    } catch (err) {
      console.error('Error loading projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setSubmitting(true)
    setError(null)

    try {
      const placeholders = (formData.input_text_placeholders as unknown as string[])
        .map(s => s.trim())
        .filter(Boolean)
      
      const urls = (formData.allowed_urls as unknown as string[])
        .map(s => s.trim())
        .filter(Boolean)

      const colors = [formData.highlight_color_1, formData.highlight_color_2]
        .map(s => s.trim())
        .filter(Boolean)

      const newProject = {
        user_id: userId,
        client_name: formData.client_name,
        client_description: formData.client_description,
        language: formData.language,
        direction: formData.direction,
        icon_url: formData.icon_url || null,
        highlight_color: colors.length > 0 ? colors : null,
        input_text_placeholders: placeholders.length > 0 ? placeholders : ['Ask a question...'],
        allowed_urls: urls.length > 0 ? urls : null,
        show_ad: true
      }

      const { data, error } = await supabase
        .from('project')
        .insert([newProject])
        .select()

      if (error) throw error

      if (data) {
        setProjects([data[0] as Project, ...projects])
        setShowCreateForm(false)
        setFormData(initialFormState)
      }
    } catch (err: any) {
      console.error('Error creating project:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
      if (!confirm('Are you sure you want to delete this project?')) return;
      
      const { error } = await supabase.from('project').delete().eq('id', id);
      if (error) {
          alert('Error deleting project');
          console.error(error);
      } else {
          setProjects(projects.filter(p => p.id !== id));
      }
  }

  if (loading) return <div className="container section">Loading...</div>

  // Type-safe onChange helpers
  const handleChange = (field: keyof typeof initialFormState, value: any) => {
     setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container section" style={{ paddingTop: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="sectionTitle">My Projects</h1>
          <p className="sectionLead" style={{ marginTop: '8px', fontSize: '16px' }}>Manage your Divee.AI widgets</p>
        </div>
        {!showCreateForm && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btnPrimary"
          >
            + New Project
          </button>
        )}
      </div>

      {showCreateForm && (
        <Reveal className="card" style={{ padding: '32px', marginBottom: '40px' }}>
          <h2 className="sectionTitle" style={{ fontSize: '24px', marginBottom: '24px' }}>Create New Project</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="inputLabel">Client Name *</label>
                <input 
                  required
                  className="inputField"
                  value={formData.client_name}
                  onChange={e => handleChange('client_name', e.target.value)}
                  placeholder="e.g. CNN"
                />
              </div>
              <div>
                <label className="inputLabel">Icon URL</label>
                <input 
                  className="inputField"
                  value={formData.icon_url}
                  onChange={e => handleChange('icon_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="inputLabel">Language</label>
                <input 
                  className="inputField"
                  value={formData.language}
                  onChange={e => handleChange('language', e.target.value)}
                  placeholder="en"
                />
              </div>
              <div>
                <label className="inputLabel">Direction</label>
                <select 
                  className="inputField"
                  value={formData.direction}
                  onChange={e => handleChange('direction', e.target.value)}
                >
                  <option value="ltr">LTR (Left to Right)</option>
                  <option value="rtl">RTL (Right to Left)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="inputLabel">Allowed URLs</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  className="inputField"
                  value={tempUrl}
                  onChange={e => setTempUrl(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!tempUrl.trim()) return
                      const newArr = [...(formData.allowed_urls as unknown as string[]), tempUrl.trim()]
                      handleChange('allowed_urls', newArr)
                      setTempUrl('')
                    }
                  }}
                  placeholder="Type URL and press Enter (e.g. https://example.com/*)"
                />
                <button 
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => {
                    if (!tempUrl.trim()) return
                    const newArr = [...(formData.allowed_urls as unknown as string[]), tempUrl.trim()]
                    handleChange('allowed_urls', newArr)
                    setTempUrl('')
                  }}
                >
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(formData.allowed_urls as unknown as string[]).map((url, idx) => (
                  <div key={idx} style={{ 
                    background: 'rgba(2, 48, 71, 0.05)', 
                    borderRadius: '99px', 
                    padding: '6px 12px', 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--heading)'
                  }}>
                    {url}
                    <button 
                      type="button"
                      onClick={() => {
                        const current = formData.allowed_urls as unknown as string[]
                        const newArr = current.filter((_, i) => i !== idx)
                        handleChange('allowed_urls', newArr)
                      }}
                      style={{ 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer', 
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'rgba(2, 48, 71, 0.4)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
            </div>
            </div>

            <div>
              <label className="inputLabel">Description</label>
              <input 
                className="inputField"
                value={formData.client_description}
                onChange={e => handleChange('client_description', e.target.value)}
                placeholder="Internal description for this project"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                 <label className="inputLabel">Highlight Color 1</label>
                 <div style={{ display: 'flex', gap: '12px' }}>
                   <input 
                     type="color"
                     style={{ height: '42px', width: '42px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                     value={formData.highlight_color_1}
                     onChange={e => handleChange('highlight_color_1', e.target.value)}
                   />
                   <input 
                      className="inputField"
                      style={{ flex: 1 }}
                      value={formData.highlight_color_1}
                      onChange={e => handleChange('highlight_color_1', e.target.value)}
                      placeholder="#68E5FD"
                   />
                 </div>
              </div>
              <div>
                 <label className="inputLabel">Highlight Color 2</label>
                 <div style={{ display: 'flex', gap: '12px' }}>
                   <input 
                     type="color"
                     style={{ height: '42px', width: '42px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                     value={formData.highlight_color_2}
                     onChange={e => handleChange('highlight_color_2', e.target.value)}
                   />
                   <input 
                      className="inputField"
                      style={{ flex: 1 }}
                      value={formData.highlight_color_2}
                      onChange={e => handleChange('highlight_color_2', e.target.value)}
                      placeholder="#A389E0"
                   />
                 </div>
              </div>
            </div>

            <div>
              <label className="inputLabel">Input Placeholders</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  className="inputField"
                  value={tempPlaceholder}
                  onChange={e => setTempPlaceholder(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!tempPlaceholder.trim()) return
                      const newArr = [...(formData.input_text_placeholders as unknown as string[]), tempPlaceholder.trim()]
                      handleChange('input_text_placeholders', newArr)
                      setTempPlaceholder('')
                    }
                  }}
                  placeholder="Type placeholder and press Enter..."
                />
                <button 
                  type="button"
                  className="btn btnSecondary"
                  onClick={() => {
                    if (!tempPlaceholder.trim()) return
                    const newArr = [...(formData.input_text_placeholders as unknown as string[]), tempPlaceholder.trim()]
                    handleChange('input_text_placeholders', newArr)
                    setTempPlaceholder('')
                  }}
                >
                  Add
                </button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(formData.input_text_placeholders as unknown as string[]).map((ph, idx) => (
                  <div key={idx} style={{ 
                    background: 'rgba(2, 48, 71, 0.05)', 
                    borderRadius: '99px', 
                    padding: '6px 12px', 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--heading)'
                  }}>
                    {ph}
                    <button 
                      type="button"
                      onClick={() => {
                        const current = formData.input_text_placeholders as unknown as string[]
                        const newArr = current.filter((_, i) => i !== idx)
                        handleChange('input_text_placeholders', newArr)
                      }}
                      style={{ 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer', 
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'rgba(2, 48, 71, 0.4)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ color: '#ef4444', marginBottom: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <button 
                type="submit" 
                className="btn btnPrimary"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Project'}
              </button>
              <button 
                type="button" 
                className="btn btnSecondary"
                onClick={() => setShowCreateForm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </Reveal>
      )}

      <div style={{ display: 'grid', gap: '24px' }}>
        {projects.length === 0 && !showCreateForm ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', borderStyle: 'dashed' }}>
             <p style={{ fontSize: '18px', color: 'rgba(2, 48, 71, 0.6)' }}>No projects found. Create one to get started!</p>
             <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btnPrimary"
              style={{ marginTop: '20px' }}
            >
              + New Project
            </button>
          </div>
        ) : (
          projects.map((project, idx) => (
            <Reveal key={project.id} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }} delay={idx * 50}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  {project.icon_url && (
                    <img 
                      src={project.icon_url} 
                      alt={project.client_name} 
                      style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                  )}
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--heading)' }}>{project.client_name}</h3>
                  <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '99px', background: 'rgba(142, 202, 230, 0.2)', color: 'var(--heading)' }}>
                    {project.language.toUpperCase()}
                  </span>
                </div>
                
                <p style={{ color: 'rgba(2, 48, 71, 0.7)', marginBottom: '12px', fontSize: '13px', lineHeight: '1.4' }}>{project.client_description || 'No description provided.'}</p>
                
                <div style={{ display: 'grid', gap: '6px', fontSize: '13px', color: 'rgba(2, 48, 71, 0.5)' }}>
                   <div>
                     <span style={{ fontWeight: 600 }}>Project ID:</span> 
                     <code 
                        onClick={() => handleCopy(project.project_id)}
                        title="Click to copy"
                        style={{ 
                          background: 'rgba(0,0,0,0.04)', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          marginLeft: '6px', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                          color: copiedId === project.project_id ? '#10b981' : 'inherit'
                        }}
                     >
                        {project.project_id}
                        {copiedId === project.project_id ? (
                          <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Copied</span>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        )}
                     </code>
                   </div>
                   <div>
                     <span style={{ fontWeight: 600 }}>Inputs:</span> {project.input_text_placeholders.join(', ')}
                   </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                 <button 
                    onClick={() => handleDelete(project.id)}
                    className="btn"
                    style={{ color: '#ef4444', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                 >
                    Delete
                 </button>
                 <button className="btn btnSecondary" style={{ height: '40px', fontSize: '14px' }}>
                    Settings
                 </button>
              </div>
            </Reveal>
          ))
        )}
      </div>
    </div>
  )
}
