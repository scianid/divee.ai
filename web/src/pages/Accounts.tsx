

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Reveal } from '../components/Reveal';

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

  useEffect(() => {
    fetchUserAndAccounts();
  }, []);

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
    <div className="container section" style={{ paddingTop: '50px' }}>
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
              style={{ borderRadius: 12 }}
            >
              + New Account
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <Reveal className="card" style={{ padding: '32px', marginBottom: '40px' }}>
          <h2 className="sectionTitle" style={{ fontSize: '24px', marginBottom: '24px' }}>{editingId ? 'Edit Account' : 'Create New Account'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px', maxWidth: '500px' }}>
            <div>
              <label className="inputLabel">Account Name *</label>
              <input 
                required
                className="inputField"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Marketing"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="inputLabel">Icon URL</label>
              <input
                className="inputField"
                name="icon_url"
                value={form.icon_url}
                onChange={handleChange}
                placeholder="https://... (optional)"
                disabled={submitting}
              />
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
                {submitting ? (editingId ? 'Saving...' : 'Creating...') : (editingId ? 'Save' : 'Create Account')}
              </button>
              <button 
                type="button" 
                className="btn btnSecondary"
                onClick={cancelEdit}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </Reveal>
      )}

      <div style={{ width: '100%', overflowX: 'auto', marginTop: 0 }}>
        {accounts.length === 0 && !showCreateForm ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center', borderStyle: 'dashed' }}>
            <p style={{ fontSize: '18px', color: 'var(--text)', opacity: 0.7 }}>No accounts found. Create one to get started!</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="btn btnPrimary"
              style={{ marginTop: '20px' }}
            >
              + New Account
            </button>
          </div>
        ) : (
          <table className="table-auto" style={{ width: '100%', minWidth: 500, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ececec' }}>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Icon</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Name</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Created</th>
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account, idx) => (
                <tr key={account.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <AccountAvatar name={account.name} iconUrl={account.icon_url} />
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{account.name}</td>
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
