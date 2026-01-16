
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
  account_id: string
}

interface Account {
  id: string
  user_id: string
  name: string
  created_at: string
}

export default function Inventory() {
      const [selectedAccount, setSelectedAccount] = useState<string>('all');
    // Sorting state
    const [sortField, setSortField] = useState<'client_name' | 'client_description' | 'id' | 'language'>('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    function handleSort(field: 'client_name' | 'client_description' | 'id' | 'language') {
      if (sortField === field) {
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    }

    function getSortIcon(field: string) {
      if (sortField !== field) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
      return sortOrder === 'asc' ? <span style={{ marginLeft: 4 }}>▲</span> : <span style={{ marginLeft: 4 }}>▼</span>;
    }

    // Helper to highlight search matches
    function highlight(text: string | number | null | undefined, query: string) {
      if (!query || !text) return text;
      const q = query.trim().toLowerCase();
      const str = text.toString();
      const idx = str.toLowerCase().indexOf(q);
      if (idx === -1) return str;
      return <>
        {str.substring(0, idx)}
        <mark style={{ background: '#ffe066', padding: 0 }}>{str.substring(idx, idx + q.length)}</mark>
        {str.substring(idx + q.length)}
      </>;
    }
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [search, setSearch] = useState('');

  // Form State
  const initialFormState = {
    account_id: '',
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

      // Fetch accounts for this user
      const { data: accountsData, error: accountsError } = await supabase
        .from('account')
        .select('id, name, user_id, created_at')
        .eq('user_id', user.id)
      if (accountsError) throw accountsError
      setAccounts(accountsData as Account[])

      const accountIds = (accountsData as Account[]).map(a => a.id)
      if (accountIds.length === 0) {
        setProjects([])
        return
      }

      // Fetch projects for these accounts
      const { data: projectsData, error: projectsError } = await supabase
        .from('project')
        .select('*')
        .in('account_id', accountIds)
        .order('created_at', { ascending: false })
      if (projectsError) throw projectsError
      setProjects(projectsData as Project[])
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

      // Use selected account for new projects
      if (!accounts.length) throw new Error('No account found for this user.')
      const selectedAccountId = formData.account_id || accounts[0].id;
      const newProject = {
        account_id: selectedAccountId,
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

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const { error } = await supabase.from('project').delete().eq('id', deleteId);
    if (error) {
      setDeleteError('Error deleting project');
      console.error(error);
    } else {
      setProjects(projects.filter(p => p.id !== deleteId));
      setDeleteId(null);
    }
    setDeleteLoading(false);
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteError(null);
  };

  if (loading) return <div className="container section">Loading...</div>

  // Type-safe onChange helpers
  const handleChange = (field: keyof typeof initialFormState, value: any) => {
     setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container section" style={{ paddingTop: '50px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 className="sectionTitle">Inventory</h1>
          <p className="sectionLead" style={{ marginTop: '8px', fontSize: '16px' }}>Manage your displayed widgets.</p>
        </div>
        <div style={{ flex: 2, minWidth: 260, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          {!showCreateForm && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btnPrimary"
              style={{ borderRadius: 12 }}
            >
              + New Item
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <Reveal className="card" style={{ padding: '32px', marginBottom: '40px' }}>
          <h2 className="sectionTitle" style={{ fontSize: '24px', marginBottom: '24px' }}>Create</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '24px', maxWidth: '800px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <label className="inputLabel">Account *</label>
                <select
                  className="inputField"
                  required
                  value={formData.account_id || accounts[0]?.id || ''}
                  onChange={e => handleChange('account_id', e.target.value)}
                  disabled={accounts.length === 0}
                  style={{ minHeight: 40, paddingRight: 60 }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
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
                    background: 'rgba(76, 76, 102, 0.08)', 
                    borderRadius: '99px', 
                    padding: '6px 12px', 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text)'
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
                        color: 'var(--text)',
                        opacity: 0.6
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
                placeholder="Internal description for this item"
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
                    background: 'rgba(76, 76, 102, 0.08)', 
                    borderRadius: '99px', 
                    padding: '6px 12px', 
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text)'
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
                        color: 'var(--text)',
                        opacity: 0.6
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
                {submitting ? 'Creating...' : 'Create Item'}
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

      {/* Account dropdown and search bar above the table */}
      <div style={{ width: '100%', margin: '0 0 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <select
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 15,
              background: '#fafbfc',
              outline: 'none',
              minWidth: 180,
              marginRight: 8
            }}
          >
            <option value="all">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            style={{
              padding: '10px 36px 10px 38px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 15,
              width: '100%',
              background: '#fafbfc',
              outline: 'none',
            }}
          />
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#b0b0b0',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', marginTop: 0 }}>
        {projects.filter(p => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return (
              (p.client_name && p.client_name.toLowerCase().includes(q)) ||
              (p.client_description && p.client_description.toLowerCase().includes(q)) ||
              (p.project_id && p.project_id.toLowerCase().includes(q)) ||
              (typeof p.id === 'number' && p.id.toString().includes(q))
            );
          }).length === 0 && !showCreateForm ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', borderStyle: 'dashed' }}>
            <p style={{ fontSize: '18px', color: 'var(--text)', opacity: 0.7 }}>No items found. Create one to get started!</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btnPrimary"
              style={{ marginTop: '20px' }}
            >
              + New Item
            </button>
          </div>
        ) : (
          <table className="table-auto" style={{ width: '100%', minWidth: 800, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ececec' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Icon</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none', cursor: 'pointer' }} onClick={() => handleSort('client_name')}>
                  Name {getSortIcon('client_name')}
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none', cursor: 'pointer' }} onClick={() => handleSort('client_description')}>
                  Description {getSortIcon('client_description')}
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  ID {getSortIcon('id')}
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Actions</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none', cursor: 'pointer' }} onClick={() => handleSort('language')}>
                  Language {getSortIcon('language')}
                </th>
              </tr>
            </thead>
            <tbody>
              {projects
                .filter(p => selectedAccount === 'all' || p.account_id === selectedAccount)
                .filter(p => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (p.client_name && p.client_name.toLowerCase().includes(q)) ||
                    (p.client_description && p.client_description.toLowerCase().includes(q)) ||
                    (p.project_id && p.project_id.toLowerCase().includes(q)) ||
                    (typeof p.id === 'number' && p.id.toString().includes(q))
                  );
                })
                .sort((a, b) => {
                  let aVal: string | number = a[sortField] ?? '';
                  let bVal: string | number = b[sortField] ?? '';
                  if (sortField === 'id') {
                    aVal = Number(aVal);
                    bVal = Number(bVal);
                  } else {
                    aVal = aVal.toString().toLowerCase();
                    bVal = bVal.toString().toLowerCase();
                  }
                  if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                  if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                  return 0;
                })
                .map((project, idx) => (
                <tr key={project.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '12px 16px' }}>
                    {project.icon_url && (
                      <img 
                        src={project.icon_url} 
                        alt={project.client_name} 
                        style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                      />
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{highlight(project.client_name, search)}</td>
                  <td style={{ padding: '12px 16px', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#555' }}>{highlight(project.client_description || '—', search)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <code 
                      onClick={() => handleCopy(project.project_id)}
                      title="Click to copy"
                      style={{ 
                        background: 'rgba(0,0,0,0.04)', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        color: copiedId === project.project_id ? '#10b981' : 'inherit',
                        fontSize: 13
                      }}
                    >
                      {highlight(project.project_id, search)}
                      {copiedId === project.project_id && (
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginLeft: 4 }}>Copied</span>
                      )}
                    </code>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => handleDelete(project.id)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                    <button 
                      title="Settings"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z" />
                      </svg>
                    </button>
                  </td>
                        {/* Delete confirmation modal */}
                        {deleteId !== null && (
                          <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(0,0,0,0.18)',
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', padding: 32, minWidth: 320, maxWidth: '90vw' }}>
                              <h3 style={{ fontSize: 20, marginBottom: 16 }}>Delete Project?</h3>
                              <p style={{ color: '#444', marginBottom: 24 }}>Are you sure you want to delete this project? This action cannot be undone.</p>
                              {deleteError && <div style={{ color: '#ef4444', marginBottom: 12 }}>{deleteError}</div>}
                              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button onClick={cancelDelete} className="btn btnSecondary" disabled={deleteLoading}>Cancel</button>
                                <button onClick={confirmDelete} className="btn btnPrimary" style={{ background: '#ef4444', borderColor: '#ef4444' }} disabled={deleteLoading}>
                                  {deleteLoading ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                  <td style={{ padding: '12px 16px', color: '#444', fontSize: 14 }}>{project.language}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
