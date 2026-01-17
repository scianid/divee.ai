import React, { useState } from 'react';

export interface ProjectFunnelFormData {
  account_id: string;
  client_name: string;
  icon_url: string;
  client_description: string;
  allowed_urls: string[];
  highlight_color_1: string;
  highlight_color_2: string;
  input_text_placeholders: string[];
}

export interface ProjectFunnelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFunnelFormData) => void;
  accounts: { id: string; name: string }[];
  initialData?: Partial<ProjectFunnelFormData>;
}

export function ProjectFunnelModal({ open, onClose, onSubmit, accounts, initialData }: ProjectFunnelProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProjectFunnelFormData>({
    account_id: initialData?.account_id || accounts[0]?.id || '',
    client_name: initialData?.client_name || '',
    icon_url: initialData?.icon_url || '',
    client_description: initialData?.client_description || '',
    allowed_urls: initialData?.allowed_urls || [],
    highlight_color_1: initialData?.highlight_color_1 || '#68E5FD',
    highlight_color_2: initialData?.highlight_color_2 || '#A389E0',
    input_text_placeholders: initialData?.input_text_placeholders || ['Ask anything about this article', 'I can help you understand this article'],
  });
  const [tempUrl, setTempUrl] = useState('');
  const [tempPlaceholder, setTempPlaceholder] = useState('');

  // Reset form when modal opens with new initialData
  React.useEffect(() => {
    if (open && initialData) {
      setForm({
        account_id: initialData.account_id || accounts[0]?.id || '',
        client_name: initialData.client_name || '',
        icon_url: initialData.icon_url || '',
        client_description: initialData.client_description || '',
        allowed_urls: initialData.allowed_urls || [],
        highlight_color_1: initialData.highlight_color_1 || '#68E5FD',
        highlight_color_2: initialData.highlight_color_2 || '#A389E0',
        input_text_placeholders: initialData.input_text_placeholders || ['Ask anything about this article', 'I can help you understand this article'],
      });
      // Skip setup step if we have data (optional, but maybe good for "Edit")
      // setStep(1); 
    } else if (open && !initialData) {
      // Reset to defaults for new project
      setForm({
        account_id: accounts[0]?.id || '',
        client_name: '',
        icon_url: '',
        client_description: '',
        allowed_urls: [],
        highlight_color_1: '#68E5FD',
        highlight_color_2: '#A389E0',
        input_text_placeholders: ['Ask anything about this article', 'I can help you understand this article'],
      });
      setStep(1);
    }
  }, [open, initialData, accounts]);


  if (!open) return null;

  function handleChange(field: keyof ProjectFunnelFormData, value: any) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function next() { setStep(s => Math.min(s + 1, 3)); }
  function back() { setStep(s => Math.max(s - 1, 1)); }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); onSubmit(form); }

  return (
    <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(23, 23, 28, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)', minWidth: 400, maxWidth: '95vw', width: 600, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Section */}
        <div style={{ padding: '40px 40px 32px 40px', background: 'linear-gradient(to bottom right, #f8faff, #ffffff)', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}>
               {initialData ? (
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
               ) : (
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
               )}
            </div>
            <div>
              <h2 className="sectionTitle" style={{ fontSize: 22, margin: '0 0 4px 0', color: '#111827' }}>
                {initialData ? 'Edit Widget Configuration' : 'Create Manual Widget'}
              </h2>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {step === 1 ? 'Step 1: General Setup' : step === 2 ? 'Step 2: Security & Access' : 'Step 3: Customization'}
              </div>
            </div>
          </div>
          <p style={{ margin: '8px 0 0 0', lineHeight: 1.6, color: '#4b5563', fontSize: 15 }}>
            {step === 1 && "Configure the core identity and metadata for your new widget project."}
            {step === 2 && "Define where this widget can be embedded and used for security."}
            {step === 3 && "Customize the visual appearance and default behavior."}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px 40px 40px 40px', flex: 1 }}>
          {step === 1 && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div>
                <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Account *</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    className="inputField" 
                    required 
                    value={form.account_id} 
                    onChange={e => handleChange('account_id', e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', appearance: 'none', background: '#f9fafb', fontSize: 15 }}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Widget Name *</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="inputField" 
                    required 
                    value={form.client_name} 
                    onChange={e => handleChange('client_name', e.target.value)} 
                    placeholder="e.g. My Awesome Project" 
                    style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                  />
                </div>
              </div>
              <div>
                <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Icon URL</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="inputField" 
                    value={form.icon_url} 
                    onChange={e => handleChange('icon_url', e.target.value)} 
                    placeholder="https://example.com/logo.png" 
                    style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                  />
                </div>
              </div>
              <div>
                <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Description</label>
                <input 
                  className="inputField" 
                  value={form.client_description} 
                  onChange={e => handleChange('client_description', e.target.value)} 
                  placeholder="Internal description (optional)" 
                  style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                />
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div>
              <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Allowed URLs (up to 10)</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input 
                  className="inputField" 
                  value={tempUrl} 
                  onChange={e => setTempUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!tempUrl.trim() || form.allowed_urls.length >= 10) return; handleChange('allowed_urls', [...form.allowed_urls, tempUrl.trim()]); setTempUrl(''); } }}
                  placeholder="https://example.com/*" 
                  style={{ flex: 1, padding: '12px 16px', fontSize: 15 }}
                />
                <button 
                  type="button" 
                  className="btn btnSecondary" 
                  onClick={() => { if (!tempUrl.trim() || form.allowed_urls.length >= 10) return; handleChange('allowed_urls', [...form.allowed_urls, tempUrl.trim()]); setTempUrl(''); }}
                  style={{ whiteSpace: 'nowrap', borderRadius: 8 }}
                >
                  Add URL
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 120, alignContent: 'flex-start' }}>
                {form.allowed_urls.length === 0 && (
                  <div style={{ color: '#9ca3af', fontSize: 14, fontStyle: 'italic' }}>No URLs allowed yet. (Wildcards * supported)</div>
                )}
                {form.allowed_urls.map((url, idx) => (
                  <div key={idx} style={{ background: '#f3f4f6', borderRadius: 99, padding: '6px 14px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#374151', border: '1px solid #e5e7eb' }}>
                    {url}
                    <button type="button" onClick={() => handleChange('allowed_urls', form.allowed_urls.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div style={{ display: 'grid', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Primary Color</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                      <input type="color" style={{ position: 'absolute', top: -5, left: -5, width: 60, height: 60, padding: 0, border: 'none', cursor: 'pointer' }} value={form.highlight_color_1} onChange={e => handleChange('highlight_color_1', e.target.value)} />
                    </div>
                    <input 
                      className="inputField" 
                      style={{ flex: 1, padding: '12px 16px', fontSize: 15 }} 
                      value={form.highlight_color_1} 
                      onChange={e => handleChange('highlight_color_1', e.target.value)} 
                      placeholder="#68E5FD" 
                    />
                  </div>
                </div>
                <div>
                  <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Secondary Color</label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                      <input type="color" style={{ position: 'absolute', top: -5, left: -5, width: 60, height: 60, padding: 0, border: 'none', cursor: 'pointer' }} value={form.highlight_color_2} onChange={e => handleChange('highlight_color_2', e.target.value)} />
                    </div>
                    <input 
                      className="inputField" 
                      style={{ flex: 1, padding: '12px 16px', fontSize: 15 }} 
                      value={form.highlight_color_2} 
                      onChange={e => handleChange('highlight_color_2', e.target.value)} 
                      placeholder="#A389E0" 
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Input Placeholders</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input 
                    className="inputField" 
                    value={tempPlaceholder} 
                    onChange={e => setTempPlaceholder(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!tempPlaceholder.trim()) return; handleChange('input_text_placeholders', [...form.input_text_placeholders, tempPlaceholder.trim()]); setTempPlaceholder(''); } }}
                    placeholder="Type placeholder and press Enter..." 
                    style={{ flex: 1, padding: '12px 16px', fontSize: 15 }}
                  />
                  <button 
                    type="button" 
                    className="btn btnSecondary" 
                    onClick={() => { if (!tempPlaceholder.trim()) return; handleChange('input_text_placeholders', [...form.input_text_placeholders, tempPlaceholder.trim()]); setTempPlaceholder(''); }}
                    style={{ whiteSpace: 'nowrap', borderRadius: 8 }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {form.input_text_placeholders.map((ph, idx) => (
                    <div key={idx} style={{ background: '#f3f4f6', borderRadius: 99, padding: '6px 14px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#374151', border: '1px solid #e5e7eb' }}>
                      {ph}
                      <button type="button" onClick={() => handleChange('input_text_placeholders', form.input_text_placeholders.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#6b7280' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'flex-end', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn" 
              onClick={onClose} 
              style={{ background: 'transparent', color: '#6b7280', border: 'none', padding: '0 16px', fontWeight: 500 }}
            >
              Cancel
            </button>
            
            {step > 1 && (
              <button 
                type="button" 
                className="btn btnSecondary" 
                onClick={back}
                style={{ borderRadius: 12, marginRight: 'auto' }}
              >
                Back
              </button>
            )}

            {step < 3 && (
              <button 
                type="button" 
                className="btn btnPrimary" 
                onClick={next}
                style={{ 
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  minWidth: 100
                }}
              >
                Next
              </button>
            )}
            
            {step === 3 && (
              <button 
                type="submit" 
                className="btn btnPrimary"
                style={{ 
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  minWidth: 140
                }}
              >
                {initialData ? 'Save Changes' : 'Create Project'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

