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
    <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', padding: 36, minWidth: 400, maxWidth: '90vw', width: 500 }}>
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <h2 className="sectionTitle" style={{ fontSize: 22, marginBottom: 18 }}>Setup</h2>
              <div style={{ display: 'grid', gap: 18 }}>
                <div>
                  <label className="inputLabel">Account *</label>
                  <select className="inputField" required value={form.account_id} onChange={e => handleChange('account_id', e.target.value)}>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="inputLabel">Name *</label>
                  <input className="inputField" required value={form.client_name} onChange={e => handleChange('client_name', e.target.value)} placeholder="e.g. CNN" />
                </div>
                <div>
                  <label className="inputLabel">Icon URL</label>
                  <input className="inputField" value={form.icon_url} onChange={e => handleChange('icon_url', e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className="inputLabel">Description</label>
                  <input className="inputField" value={form.client_description} onChange={e => handleChange('client_description', e.target.value)} placeholder="Internal description (optional)" />
                </div>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="sectionTitle" style={{ fontSize: 22, marginBottom: 18 }}>Security</h2>
              <div>
                <label className="inputLabel">Allowed URLs (up to 10)</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="inputField" value={tempUrl} onChange={e => setTempUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!tempUrl.trim() || form.allowed_urls.length >= 10) return; handleChange('allowed_urls', [...form.allowed_urls, tempUrl.trim()]); setTempUrl(''); } }}
                    placeholder="Type URL and press Enter (e.g. https://example.com/*)" />
                  <button type="button" className="btn btnSecondary" onClick={() => { if (!tempUrl.trim() || form.allowed_urls.length >= 10) return; handleChange('allowed_urls', [...form.allowed_urls, tempUrl.trim()]); setTempUrl(''); }}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {form.allowed_urls.map((url, idx) => (
                    <div key={idx} style={{ background: 'rgba(76,76,102,0.08)', borderRadius: 99, padding: '6px 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                      {url}
                      <button type="button" onClick={() => handleChange('allowed_urls', form.allowed_urls.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text)', opacity: 0.6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="sectionTitle" style={{ fontSize: 22, marginBottom: 18 }}>Display</h2>
              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <label className="inputLabel">Highlight Color 1</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input type="color" style={{ height: 42, width: 42, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} value={form.highlight_color_1} onChange={e => handleChange('highlight_color_1', e.target.value)} />
                      <input className="inputField" style={{ flex: 1 }} value={form.highlight_color_1} onChange={e => handleChange('highlight_color_1', e.target.value)} placeholder="#68E5FD" />
                    </div>
                  </div>
                  <div>
                    <label className="inputLabel">Highlight Color 2</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <input type="color" style={{ height: 42, width: 42, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} value={form.highlight_color_2} onChange={e => handleChange('highlight_color_2', e.target.value)} />
                      <input className="inputField" style={{ flex: 1 }} value={form.highlight_color_2} onChange={e => handleChange('highlight_color_2', e.target.value)} placeholder="#A389E0" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="inputLabel">Input Placeholders</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="inputField" value={tempPlaceholder} onChange={e => setTempPlaceholder(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!tempPlaceholder.trim()) return; handleChange('input_text_placeholders', [...form.input_text_placeholders, tempPlaceholder.trim()]); setTempPlaceholder(''); } }}
                      placeholder="Type placeholder and press Enter..." />
                    <button type="button" className="btn btnSecondary" onClick={() => { if (!tempPlaceholder.trim()) return; handleChange('input_text_placeholders', [...form.input_text_placeholders, tempPlaceholder.trim()]); setTempPlaceholder(''); }}>Add</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {form.input_text_placeholders.map((ph, idx) => (
                      <div key={idx} style={{ background: 'rgba(76,76,102,0.08)', borderRadius: 99, padding: '6px 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                        {ph}
                        <button type="button" onClick={() => handleChange('input_text_placeholders', form.input_text_placeholders.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text)', opacity: 0.6 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
            {step > 1 && <button type="button" className="btn btnSecondary" onClick={back}>Back</button>}
            {step < 3 && <button type="button" className="btn btnPrimary" onClick={next}>Next</button>}
            {step === 3 && <button type="submit" className="btn btnPrimary">{initialData ? 'Save Changes' : 'Create Project'}</button>}
            <button type="button" className="btn btnSecondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
