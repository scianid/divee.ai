import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../hooks/useAdmin';
import { ProjectFunnelModal } from '../components/ProjectFunnelModal';
import { ScanSiteModal } from '../components/ScanSiteModal';

// Helper for safe account icons
const AccountIcon = ({ url, name, size = 20 }: { url?: string | null, name: string, size?: number }) => {
  const [error, setError] = useState(false);
  if (url && !error) {
    return <img 
      src={url} 
      alt={name} 
      onError={() => setError(true)}
      style={{ width: size, height: size, borderRadius: 4, objectFit: 'cover' }} 
    />;
  }
  return <div style={{ 
    width: size, 
    height: size, 
    borderRadius: 4, 
    background: '#e5e7eb', 
    color: '#6b7280', 
    fontSize: size * 0.6, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    fontWeight: 600
  }}>
    {name.slice(0, 1).toUpperCase()}
  </div>;
};

interface Project {
  project_id: string; // Primary key (UUID)
  created_at: string;
  direction: 'ltr' | 'rtl';
  language: string;
  icon_url: string | null;
  client_name: string;
  client_description: string | null;
  highlight_color: string[] | null;
  show_ad: boolean;
  ad_tag_id?: string; // Admin-only field from project_config
  input_text_placeholders: string[];
  allowed_urls: string[] | null;
  account_id: string;
  display_mode: string;
  display_position: string;
  article_class: string | null;
  widget_container_class: string | null;
}

interface Account {
  id: string;
  user_id: string;
  icon_url?: string | null;
  name: string;
  created_at: string;
}

function Inventory() {
  const location = useLocation();
  const isAdmin = useAdmin();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [_submitting, setSubmitting] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [sortField, setSortField] = useState<'client_name' | 'client_description' | 'project_id' | 'language'>('project_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [embedModalProject, setEmbedModalProject] = useState<Project | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Helpers
  function handleSort(field: 'client_name' | 'client_description' | 'project_id' | 'language') {
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

  // Open new widget modal if navigated from CreateWidgetModal
  useEffect(() => {
    if (location.state?.openNewWidget) {
      setShowScanModal(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  async function fetchUserAndProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      // Fetch owned accounts
      const { data: ownedAccounts, error: ownedError } = await supabase
        .from('account')
        .select('id, name, user_id, created_at, icon_url')
        .eq('user_id', user.id);
      
      if (ownedError) throw ownedError;

      // Fetch collaborated accounts
      const { data: collaboratedAccounts, error: collabError } = await supabase
        .from('account_collaborator')
        .select('account_id, account:account_id(id, name, user_id, created_at, icon_url)')
        .eq('user_id', user.id);
      
      if (collabError) throw collabError;

      // Combine and deduplicate accounts
      const collaboratedAccountData = collaboratedAccounts?.map((c: any) => c.account).filter(Boolean) || [];
      
      // Merge and deduplicate
      const allAccountsMap = new Map();
      [...(ownedAccounts || []), ...collaboratedAccountData].forEach(acc => {
        if (acc && acc.id) allAccountsMap.set(acc.id, acc);
      });
      const allAccounts = Array.from(allAccountsMap.values());
      
      setAccounts(allAccounts as Account[]);

      const accountIds = allAccounts.map(a => a.id);
      if (accountIds.length === 0) {
        setProjects([]);
        return;
      }

      // Fetch projects for all accounts (owned + collaborated)
      const { data: projectsData, error: projectsError } = await supabase
        .from('project')
        .select('*')
        .in('account_id', accountIds)
        .order('created_at', { ascending: false });
      
      if (projectsError) throw projectsError;
      
      let finalProjects = projectsData || [];
      
      // If admin, fetch project_config separately to avoid RLS join issues
      if (isAdmin && finalProjects.length > 0) {
        const projectUuids = finalProjects.map(p => p.project_id); // Use UUID, not integer ID
        const { data: configData } = await supabase
          .from('project_config')
          .select('project_id, ad_tag_id')
          .in('project_id', projectUuids);
        
        // Merge config data into projects
        if (configData) {
          const configMap = new Map(configData.map(c => [c.project_id, c]));
          finalProjects = finalProjects.map(p => ({
            ...p,
            ad_tag_id: configMap.get(p.project_id)?.ad_tag_id || '' // Match by UUID
          }));
        }
      }
      
      setProjects(finalProjects as Project[]);
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

  function handleScanSuccess(newProject: Project) {
    setProjects(prev => [newProject, ...prev]);
  }

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
      
      const payload = {
        account_id: selectedAccountId,
        client_name: form.client_name,
        client_description: form.client_description,
        icon_url: form.icon_url || null,
        highlight_color: colors.length > 0 ? colors : null,
        input_text_placeholders: placeholders.length > 0 ? placeholders : ['Ask a question...'],
        allowed_urls: urls.length > 0 ? urls : null,
        language: form.language || 'English',
        direction: form.direction || 'ltr',
        display_mode: form.display_mode || 'anchored',
        display_position: form.display_position || 'bottom-right',
        article_class: form.article_class || '.article',
        widget_container_class: form.widget_container_class || null,
        show_ad: form.show_ad !== undefined ? form.show_ad : true,
      };

      let result;
      if (editingProject) {
        result = await supabase
          .from('project')
          .update(payload)
          .eq('project_id', editingProject.project_id)
          .select();
      } else {
        result = await supabase
          .from('project')
          .insert([payload])
          .select();
      }
        
      const { data, error } = result;
      if (error) throw error;
      if (data) {
        const savedProject = data[0] as Project;
        
        // Save admin-only ad_tag_id to project_config if user is admin and ad_tag_id is provided
        if (form.ad_tag_id !== undefined && form.ad_tag_id !== '') {
          
          const configPayload = {
            project_id: savedProject.project_id, // Use UUID, not integer ID
            ad_tag_id: form.ad_tag_id || null,
          };
          
          // Check if config exists
          const { data: existingConfig } = await supabase
            .from('project_config')
            .select('id')
            .eq('project_id', savedProject.project_id)
            .maybeSingle();
          
          if (existingConfig) {
            // Update existing config
            await supabase
              .from('project_config')
              .update(configPayload)
              .eq('project_id', savedProject.project_id);
          } else {
            // Insert new config
            await supabase
              .from('project_config')
              .insert([configPayload]);
            // Non-blocking errors are ignored
          }
        }
        
        // Preserve admin-only fields that aren't in the project table response
        const updatedProject = {
          ...savedProject,
          ad_tag_id: form.ad_tag_id || editingProject?.ad_tag_id || ''
        };
        
        const isEditing = !!editingProject;
        const editingProjectId = editingProject?.project_id;
        
        // Close modal first to prevent form reset visual glitch
        setShowCreateForm(false);
        setEditingProject(null);
        
        if (isEditing && editingProjectId) {
          setProjects(projects.map(p => p.project_id === editingProjectId ? updatedProject : p));
        } else {
          setProjects([updatedProject, ...projects]);
        }
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const { error } = await supabase.from('project').delete().eq('project_id', deleteId);
    if (error) {
      setDeleteError('Error deleting project');
      console.error(error);
    } else {
      setProjects(projects.filter(p => p.project_id !== deleteId));
      setDeleteId(null);
    }
    setDeleteLoading(false);
  };

  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteError(null);
  };

  const handleCopySDK = (projectId: string) => {
    const sdkCode = `<script 
  src="https://srv.divee.ai/storage/v1/object/public/sdk/divee.sdk.latest.js" 
  data-project-id="${projectId}" 
</script>`;
    
    navigator.clipboard.writeText(sdkCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleOpenEmbedModal = (project: Project) => {
    setEmbedModalProject(project);
    setEmbedCopied(false);
  };

  // Render
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 className="sectionTitle">Inventory</h1>
        <div style={{ display: 'flex', gap: 12 }}>
            <button
            className="btn btnPrimary"
            style={{ 
              borderRadius: 12,
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
            onClick={() => setShowScanModal(true)}
            >
            New Widget
            </button>
            <button
            className="btn btnSecondary"
            style={{ borderRadius: 12 }}
            onClick={() => setShowCreateForm(true)}
            >
            Manual Widget
            </button>
        </div>
      </div>

      {showScanModal && (
        <ScanSiteModal
          open={showScanModal}
          onClose={() => setShowScanModal(false)}
          onSuccess={handleScanSuccess}
          accounts={accounts.map(a => ({ id: a.id, name: a.name }))}
          existingProjects={projects}
        />
      )}

      {showCreateForm && (
        <ProjectFunnelModal
          open={showCreateForm}
          onClose={() => { setShowCreateForm(false); setEditingProject(null); }}
          onSubmit={handleFunnelSubmit}
          accounts={accounts.map(a => ({ id: a.id, name: a.name }))}
          initialData={editingProject ? {
            account_id: editingProject.account_id,
            client_name: editingProject.client_name,
            icon_url: editingProject.icon_url || '',
            client_description: editingProject.client_description || '',
            allowed_urls: editingProject.allowed_urls || [],
            highlight_color_1: editingProject.highlight_color?.[0],
            highlight_color_2: editingProject.highlight_color?.[1],
            input_text_placeholders: editingProject.input_text_placeholders,
            language: editingProject.language,
            direction: editingProject.direction,
            display_mode: editingProject.display_mode,
            display_position: editingProject.display_position,
            article_class: editingProject.article_class || '',
            widget_container_class: editingProject.widget_container_class || '',
            show_ad: editingProject.show_ad,
            ad_tag_id: editingProject.ad_tag_id || ''
          } : undefined}
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
                {acc.name}
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

      <div style={{ width: '100%', marginTop: 0 }}>
        {accounts.length === 0 ? (
          <div className="card" style={{ padding: '64px 48px', textAlign: 'center', borderStyle: 'dashed', borderColor: '#e5e7eb' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: 20, 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: '#f59e0b'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
              Create an account first
            </h3>
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 32px' }}>
              Looks like you haven't set up any accounts yet! <br/><br/> Before creating widgets, you need to set up at least one account. Accounts help you organize your widgets by team, brand, or client.
            </p>
            <a 
              href="/accounts"
              className="btn btnPrimary"
              style={{ 
                borderRadius: 12,
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                padding: '12px 24px',
                fontSize: '15px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Go to Accounts
            </a>
          </div>
        ) : projects.filter(p => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return (
            (p.client_name && p.client_name.toLowerCase().includes(q)) ||
            (p.client_description && p.client_description.toLowerCase().includes(q)) ||
            (p.project_id && p.project_id.toLowerCase().includes(q))
          );
        }).length === 0 && !showCreateForm ? (
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
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
              {search.trim() || selectedAccount !== 'all' ? 'No widgets found' : 'No widgets yet'}
            </h3>
            <p style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 32px' }}>
              {search.trim() || selectedAccount !== 'all'
                ? 'Try adjusting your filters or search terms to find what you\'re looking for.' 
                : 'Widgets are AI-powered chat interfaces that you can embed on your website. Create your first widget to get started with engaging your visitors.'}
            </p>
            {!search.trim() && selectedAccount === 'all' && (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                <button 
                  onClick={() => setShowScanModal(true)}
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
                  New Widget
                </button>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="btn btnSecondary"
                  style={{ 
                    borderRadius: 12,
                    padding: '12px 24px',
                    fontSize: '15px'
                  }}
                >
                  Manual Widget
                </button>
              </div>
            )}
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
                <th style={{ padding: '14px 16px', fontWeight: 600, fontSize: 15, borderBottom: '1px solid #ececec', background: 'none', cursor: 'pointer' }} onClick={() => handleSort('project_id')}>
                  ID {getSortIcon('project_id')}
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
                    (p.project_id && p.project_id.toLowerCase().includes(q))
                  );
                })
                .sort((a, b) => {
                  let aVal: string | number = a[sortField] ?? '';
                  let bVal: string | number = b[sortField] ?? '';
                  if (sortField === 'project_id') {
                    aVal = aVal.toString().toLowerCase();
                    bVal = bVal.toString().toLowerCase();
                  } else {
                    aVal = aVal.toString().toLowerCase();
                    bVal = bVal.toString().toLowerCase();
                  }
                  if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
                  if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
                  return 0;
                })
                .map((project, idx) => (
                  <tr key={project.project_id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
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
                            <AccountIcon url={acc.icon_url} name={acc.name} />
                            <span>{acc.name}</span>
                          </div>
                        ) : '—';
                      })()}
                    </td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: 8, position: 'relative' }}>
                      <button 
                        onClick={() => handleDelete(project.project_id)}
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
                        onClick={() => {
                          setEditingProject(project);
                          setShowCreateForm(true);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', padding: 4, display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z" />
                        </svg>
                      </button>
                      <button 
                        title="Embed Widget"
                        onClick={() => handleOpenEmbedModal(project)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, display: 'flex', alignItems: 'center', fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}
                      >
                        &lt;/&gt;
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Embed Modal */}
      {embedModalProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '32px 32px 24px 32px', 
              borderBottom: '1px solid #f3f4f6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#111827', margin: 0 }}>Embed Widget</h3>
                <button
                  onClick={() => setEmbedModalProject(null)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: '#9ca3af',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Close"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                Copy this code and paste it into your HTML page, just before the closing <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>&lt;/body&gt;</code> tag.
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '24px 32px 32px 32px' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8,
                    background: embedModalProject.icon_url ? 'transparent' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {embedModalProject.icon_url ? (
                      <img src={embedModalProject.icon_url} alt={embedModalProject.client_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{embedModalProject.client_name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Project ID: {embedModalProject.project_id}</div>
                  </div>
                </div>
              </div>

              <div style={{ 
                background: '#1e293b', 
                borderRadius: 12, 
                padding: '20px',
                position: 'relative',
                overflow: 'auto'
              }}>
                <pre style={{ 
                  margin: 0, 
                  fontSize: 13, 
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  <span style={{ color: '#7dd3fc' }}>&lt;script</span>{'\n'}
                  <span style={{ color: '#a5b4fc' }}>  src</span>
                  <span style={{ color: '#e2e8f0' }}>=</span>
                  <span style={{ color: '#a3e635' }}>"https://srv.divee.ai/storage/v1/object/public/sdk/divee.sdk.latest.js"</span>{'\n'}
                  <span style={{ color: '#a5b4fc' }}>  data-project-id</span>
                  <span style={{ color: '#e2e8f0' }}>=</span>
                  <span style={{ color: '#a3e635' }}>"{embedModalProject.project_id}"</span>
                  <span style={{ color: '#7dd3fc' }}>&gt;</span>{'\n'}
                  <span style={{ color: '#7dd3fc' }}>&lt;/script&gt;</span>
                </pre>
              </div>

              <div style={{ 
                marginTop: 20,
                padding: '16px',
                background: '#eff6ff',
                borderRadius: 8,
                borderLeft: '3px solid #3b82f6'
              }}>
                <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>💡 Tip:</strong>
                  Use the <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: 4 }}>cog wheel</code> in the inventory screen to customize your project look and behavior.
                </div>
              </div>

              <button
                onClick={() => handleCopySDK(embedModalProject.project_id)}
                className="btn btnPrimary"
                style={{ 
                  width: '100%',
                  marginTop: 24,
                  borderRadius: 12,
                  background: embedCopied ? '#10b981' : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  border: 'none',
                  boxShadow: embedCopied ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(79, 70, 229, 0.3)',
                  padding: '14px 24px',
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.2s'
                }}
              >
                {embedCopied ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
