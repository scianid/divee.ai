

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';

interface Account {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  icon_url?: string | null;
}

const AccountAvatar = ({ name, iconUrl }: { name: string; iconUrl?: string | null }) => {
  const [error, setError] = useState(false);

  if (iconUrl && !error) {
    return (
      <img
        src={iconUrl}
        alt={name}
        style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', background: '#f3f3f3', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

const initialFormState = { name: '', icon_url: '' };

const Accounts: React.FC = () => {
  const location = useLocation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Helper
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

  useEffect(() => {
    fetchUserAndAccounts();
    // Check if we should auto-open create form
    if (location.state?.openCreateForm) {
      setShowCreateForm(true);
    }
  }, [location]);

  async function fetchUserAndAccounts() {
    setLoading(true);
    try {
      console.log('[Accounts] Fetching user...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('[Accounts] User:', user);
      if (!user) {
        setError('Not logged in');
        setLoading(false);
        return;
      }
      setUserId(user.id);
      console.log('[Accounts] Querying accounts for user_id:', user.id);
      const { data, error } = await supabase
        .from('account')
        .select('id, name, user_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      console.log('[Accounts] Query result:', { data, error });
      if (error) throw error;
      setAccounts(data as Account[]);
    } catch (err: any) {
      setError(err.message || 'Error loading accounts');
      console.error('[Accounts] Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function startEdit(account: Account) {
    setEditingId(account.id);
    setForm({ name: account.name, icon_url: account.icon_url || '' });
    setShowCreateForm(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialFormState);
    setShowCreateForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !form.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('account')
          .update({ name: form.name, icon_url: form.icon_url })
          .eq('id', editingId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('account')
          .insert([{ name: form.name, icon_url: form.icon_url, user_id: userId }]);
        if (error) throw error;
      }
      setForm(initialFormState);
      setEditingId(null);
      setShowCreateForm(false);
      fetchUserAndAccounts();
    } catch (err: any) {
      setError(err.message || 'Error saving account');
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const { error } = await supabase.from('account').delete().eq('id', deleteId);
    if (error) {
      setDeleteError('Error deleting account');
    } else {
      setAccounts(accounts.filter(a => a.id !== deleteId));
      setDeleteId(null);
    }
    setDeleteLoading(false);
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteError(null);
  };

  if (loading) {
    return (
      <div className="container section" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 className="sectionTitle">Accounts</h1>
          <p className="sectionLead" style={{ marginTop: '8px', fontSize: '16px' }}>Manage your subaccounts.</p>
        </div>
        <div style={{ flex: 2, minWidth: 260, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          {!showCreateForm && (
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btnPrimary"
              style={{ 
                borderRadius: 12,
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              + New Account
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(23, 23, 28, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)', minWidth: 400, maxWidth: '95vw', width: 600, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header Section */}
            <div style={{ padding: '40px 40px 32px 40px', background: 'linear-gradient(to bottom right, #f8faff, #ffffff)', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div>
                  <h2 className="sectionTitle" style={{ fontSize: 22, margin: '0 0 4px 0', color: '#111827' }}>{editingId ? 'Edit Account' : 'Create New Account'}</h2>
                  <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Organization Management</div>
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', lineHeight: 1.6, color: '#4b5563', fontSize: 15 }}>
                 {editingId ? 'Update your account details below.' : 'Create a new sub-account to organize your widgets.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '32px 40px 40px 40px', flex: 1 }}>
              <div style={{ display: 'grid', gap: 24 }}>
                <div>
                  <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Account Name *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <input 
                      required
                      className="inputField"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Marketing"
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px 16px 12px 46px', fontSize: 15 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Icon URL</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    </div>
                    <input
                      className="inputField"
                      name="icon_url"
                      value={form.icon_url}
                      onChange={handleChange}
                      placeholder="https://... (optional)"
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px 16px 12px 46px', fontSize: 15 }}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: 24, padding: '12px 16px', background: '#fef2f2', borderRadius: 8, color: '#991b1b', fontSize: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                   {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'flex-end', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn"
                  onClick={cancelEdit}
                  disabled={submitting}
                  style={{ background: 'transparent', color: '#6b7280', border: 'none', padding: '0 16px', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btnPrimary"
                  disabled={submitting}
                  style={{ 
                    minWidth: 160, 
                    padding: '12px 24px', 
                    borderRadius: 12,
                    background: submitting ? '#ccc' : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    border: 'none',
                    boxShadow: submitting ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {submitting ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save Changes' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ width: '100%', margin: '0 0 18px 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search accounts..."
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

      <div style={{ width: '100%', marginTop: 0, padding: '2px' }}>
        {accounts.filter(a => !search.trim() || a.name.toLowerCase().includes(search.trim().toLowerCase())).length === 0 && !showCreateForm ? (
          <div className="card" style={{ padding: '64px 48px', textAlign: 'center', borderStyle: 'dashed', borderColor: '#e5e7eb' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 20, 
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#9ca3af'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
              {search.trim() ? 'No accounts match your search' : 'No accounts yet'}
            </h3>
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 32px' }}>
              {search.trim() 
                ? 'Try adjusting your search terms to find what you\'re looking for.' 
                : 'Accounts help you organize your widgets into separate sub-accounts. Create different accounts for teams, brands, or clients to keep everything organized.'}
            </p>
            {!search.trim() && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="btn btnPrimary"
                style={{ 
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  padding: '12px 24px',
                  fontSize: '15px'
                }}
              >
                + New Account
              </button>
            )}
          </div>
        ) : (
          <table className="table-auto" style={{ width: '100%', minWidth: 500, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 20px -5px rgba(0, 0, 0, 0.08)' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ececec' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Icon</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Name</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Created</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.filter(a => !search.trim() || a.name.toLowerCase().includes(search.trim().toLowerCase())).map((account, idx) => (
                <tr key={account.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <AccountAvatar name={account.name} iconUrl={account.icon_url} />
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{highlight(account.name, search)}</td>
                  <td style={{ padding: '12px 16px', color: '#555', fontSize: 14 }}>{new Date(account.created_at).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => startEdit(account)}
                      title="Edit"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(account.id)}
                      title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                    </button>
                  </td>
                  {/* Delete confirmation modal */}
                  {deleteId === account.id && (
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
                        <h3 style={{ fontSize: 20, marginBottom: 16 }}>Delete Account?</h3>
                        <p style={{ color: '#444', marginBottom: 24 }}>Are you sure you want to delete this account? This action cannot be undone.</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Accounts;
