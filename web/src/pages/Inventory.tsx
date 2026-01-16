import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ProjectFunnelModal } from '../components/ProjectFunnelModal';

interface Project {
  id: number;
  created_at: string;
  direction: 'ltr' | 'rtl';
  language: string;
  icon_url: string | null;
  client_name: string;
  client_description: string | null;
  highlight_color: string[] | null;
  show_ad: boolean;
  input_text_placeholders: string[];
  allowed_urls: string[] | null;
  project_id: string;
  account_id: string;
}

interface Account {
  id: string;
  user_id: string;
  icon_url?: string | null;
  name: string;
  created_at: string;
}

function Inventory() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [sortField, setSortField] = useState<'client_name' | 'client_description' | 'id' | 'language'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Helpers
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

  // Data fetching
  useEffect(() => {
    fetchUserAndProjects();
  }, []);

  async function fetchUserAndProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('account')
        .select('id, name, user_id, created_at, icon_url')
        .eq('user_id', user.id);
      
      if (accountsError) throw accountsError;
      setAccounts(accountsData as Account[]);

      const accountIds = (accountsData as Account[]).map(a => a.id);
      if (accountIds.length === 0) {
        setProjects([]);
        return;
      }

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('project')
        .select('*')
        .in('account_id', accountIds)
        .order('created_at', { ascending: false });
      
      if (projectsError) throw projectsError;
      setProjects(projectsData as Project[]);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  }

  // Actions
  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  async function handleFunnelSubmit(form: any) {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const placeholders = form.input_text_placeholders.map((s: string) => s.trim()).filter(Boolean);
      const urls = form.allowed_urls.map((s: string) => s.trim()).filter(Boolean);
      const colors = [form.highlight_color_1, form.highlight_color_2].map((s: string) => s.trim()).filter(Boolean);
      
      if (!accounts.length) throw new Error('No account found for this user.');
      const selectedAccountId = form.account_id || accounts[0].id;
      
      const newProject = {
        account_id: selectedAccountId,
        client_name: form.client_name,
        client_description: form.client_description,
        language: 'English',
        direction: 'ltr',
        icon_url: form.icon_url || null,
        highlight_color: colors.length > 0 ? colors : null,
        input_text_placeholders: placeholders.length > 0 ? placeholders : ['Ask a question...'],
        allowed_urls: urls.length > 0 ? urls : null,
        show_ad: true
      };
      
      const { data, error } = await supabase
        .from('project')
        .insert([newProject])
        .select();
        
      if (error) throw error;
      if (data) {
        setProjects([data[0] as Project, ...projects]);
        setShowCreateForm(false);
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

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

  // Render
  if (loading) return <div className="container section">Loading...</div>;

  return (
    <div className="container section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Projects Inventory</h2>
        <button
          className="btn btnPrimary"
          style={{ borderRadius: 12 }}
          onClick={() => setShowCreateForm(true)}
        >
          + New Item
        </button>
      </div>

      {showCreateForm && (
        <ProjectFunnelModal
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleFunnelSubmit}
          accounts={accounts.map(a => ({ id: a.id, name: a.name }))}
        />
      )}

      {/* Account dropdown and search bar above the table */}
      <div style={{ width: '100%', margin: '0 0 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
              <option key={acc.id} value={acc.id}>
                {acc.icon_url ? '🖼️ ' : ''}{acc.name}
              </option>
            ))}
          </select>
          {/* Show icon next to dropdown if selected */}
          {selectedAccount !== 'all' && (() => {
            const acc = accounts.find(a => a.id === selectedAccount);
            if (!acc) return null;
            return acc.icon_url ? (
              <img src={acc.icon_url} alt={acc.name} style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', marginLeft: 8, verticalAlign: 'middle', background: '#f3f3f3' }} />
            ) : (
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#f3f3f3', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8, color: '#bbb', fontSize: 18 }}>?</span>
            );
          })()}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            style={{
              width: '100%',
              padding: '10px 36px 10px 36px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontSize: 15,
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
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none', cursor: 'pointer' }} onClick={() => handleSort('language')}>
                  Language {getSortIcon('language')}
                </th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Account</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Actions</th>
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
                    <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Project icon */}
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
                    <td style={{ padding: '12px 16px', color: '#444', fontSize: 14 }}>{project.language}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>
                      {(() => {
                        const acc = accounts.find(a => a.id === project.account_id);
                        return acc ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {acc.icon_url && <img src={acc.icon_url} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }} />}
                            <span>{acc.name}</span>
                          </div>
                        ) : '—';
                      })()}
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
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal (Global) */}
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
    </div>
  );
}

export default Inventory;
