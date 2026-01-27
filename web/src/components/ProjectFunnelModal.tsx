import React, { useState, useCallback } from 'react';

// EditSectionCard component moved outside to prevent recreation on each render
const EditSectionCard = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <div style={{ background: '#f9fafb', borderRadius: 16, padding: 20, border: '1px solid #f3f4f6' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#111827', fontWeight: 600, fontSize: 14 }}>
      {icon}
      {title}
    </div>
    {children}
  </div>
);

export interface ProjectFunnelFormData {
  account_id: string;
  client_name: string;
  icon_url: string;
  client_description: string;
  allowed_urls: string[];
  highlight_color_1: string;
  highlight_color_2: string;
  input_text_placeholders: string[];
  language: string;
  direction: 'ltr' | 'rtl';
  display_mode: string;
  display_position: string;
  article_class: string;
  widget_container_class: string;
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
  const isEditMode = !!initialData;
  const [form, setForm] = useState<ProjectFunnelFormData>({
    account_id: initialData?.account_id || accounts[0]?.id || '',
    client_name: initialData?.client_name || '',
    icon_url: initialData?.icon_url || '',
    client_description: initialData?.client_description || '',
    allowed_urls: initialData?.allowed_urls || [],
    highlight_color_1: initialData?.highlight_color_1 || '#68E5FD',
    highlight_color_2: initialData?.highlight_color_2 || '#A389E0',
    input_text_placeholders: initialData?.input_text_placeholders || ['Ask anything about this article', 'I can help you understand this article'],
    language: initialData?.language || 'English',
    direction: initialData?.direction || 'ltr',
    display_mode: initialData?.display_mode || 'anchored',
    display_position: initialData?.display_position || 'bottom-right',
    article_class: initialData?.article_class || '.article',
    widget_container_class: initialData?.widget_container_class || '',
  });
  const [tempUrl, setTempUrl] = useState('');
  const [tempPlaceholder, setTempPlaceholder] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
        language: initialData.language || 'English',
        direction: initialData.direction || 'ltr',
        display_mode: initialData.display_mode || 'anchored',
        display_position: initialData.display_position || 'bottom-right',
        article_class: initialData.article_class || '.article',
        widget_container_class: initialData.widget_container_class || '',
      });
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
        language: 'English',
        direction: 'ltr',
        display_mode: 'anchored',
        display_position: 'bottom-right',
        article_class: '.article',
        widget_container_class: '',
      });
      setStep(1);
    }
  }, [open, initialData, accounts]);


  if (!open) return null;

  const handleChange = useCallback((field: keyof ProjectFunnelFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  function next() { setStep(s => Math.min(s + 1, 3)); }
  function back() { setStep(s => Math.max(s - 1, 1)); }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); onSubmit(form); }

  // Component for the Identity Section
  const IdentitySection = React.useMemo(() => (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Top Row: Account & Name */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 12 }}>
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Account</label>
            <div style={{ position: 'relative' }}>
            <select 
              className="inputField" 
              required 
              value={form.account_id} 
              onChange={e => handleChange('account_id', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', appearance: 'none', background: '#fff', fontSize: 14, borderRadius: 10, border: '1px solid #e5e7eb' }}
            >
              {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Widget Name</label>
          <input 
            className="inputField" 
            required 
            value={form.client_name} 
            onChange={e => handleChange('client_name', e.target.value)} 
            placeholder="e.g. My Project" 
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 10, border: '1px solid #e5e7eb' }}
          />
        </div>
      </div>

      {/* Second Row: Icon Preview & Visual Inputs */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Icon Preview */}
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Icon</label>
          <div style={{ 
            width: 72, height: 72, 
            borderRadius: 16, 
            background: '#fff', 
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
             {form.icon_url ? (
                <img 
                  src={form.icon_url} 
                  alt="Icon" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} 
                />
             ) : (
                <div style={{ color: '#e5e7eb' }}>
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                </div>
             )}
          </div>
        </div>

        {/* Inputs Stack */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
           <div>
              <label className="inputLabel" style={{ marginBottom: 4, display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Icon URL Source</label>
              <input 
                className="inputField" 
                value={form.icon_url} 
                onChange={e => handleChange('icon_url', e.target.value)} 
                placeholder="https://..." 
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fafbfc', color: '#6b7280' }}
              />
           </div>
           <div>
              <label className="inputLabel" style={{ marginBottom: 4, display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280' }}>Internal Description</label>
              <input 
                className="inputField" 
                value={form.client_description} 
                onChange={e => handleChange('client_description', e.target.value)} 
                placeholder="Brief description..." 
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
           </div>
        </div>
      </div>

      {/* Third Row: Language & Direction */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Language</label>
          <div style={{ position: 'relative' }}>
            <select 
              className="inputField" 
              value={form.language} 
              onChange={e => handleChange('language', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', appearance: 'none', background: '#fff', fontSize: 14, borderRadius: 10, border: '1px solid #e5e7eb' }}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Italian">Italian</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Hebrew">Hebrew</option>
              <option value="Arabic">Arabic</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="Russian">Russian</option>
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Text Direction</label>
          <div style={{ position: 'relative' }}>
            <select 
              className="inputField" 
              value={form.direction} 
              onChange={e => handleChange('direction', e.target.value as 'ltr' | 'rtl')}
              style={{ width: '100%', padding: '10px 12px', appearance: 'none', background: '#fff', fontSize: 14, borderRadius: 10, border: '1px solid #e5e7eb' }}
            >
              <option value="ltr">Left to Right (LTR)</option>
              <option value="rtl">Right to Left (RTL)</option>
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [form.account_id, form.client_name, form.icon_url, form.client_description, form.language, form.direction, accounts, handleChange]);

  // Component for Security Section
  const SecuritySection = React.useMemo(() => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Active List */}
      <div style={{ flex: 1, marginBottom: 16 }}>
        <label className="inputLabel" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>
           <span>Active Restrictions</span>
           <span style={{ fontSize: 11, background: form.allowed_urls.length > 0 ? '#eff6ff' : '#f3f4f6', color: form.allowed_urls.length > 0 ? '#2563eb' : '#9ca3af', padding: '2px 8px', borderRadius: 99 }}>
             {form.allowed_urls.length} Rules
           </span>
        </label>
        
        {form.allowed_urls.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', background: '#fff', border: '1px dashed #e5e7eb', borderRadius: 12 }}>
            <div style={{ color: '#10b981', fontWeight: 600, fontSize: 13, marginBottom: 2 }}>Publicly Accessible</div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>No URL restrictions are active.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
            {form.allowed_urls.map((url, idx) => (
              <div key={idx} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                   <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{url}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleChange('allowed_urls', form.allowed_urls.filter((_, i) => i !== idx))} 
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#9ca3af', minWidth: 24, justifyContent: 'center', borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Input */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 4, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <input 
          value={tempUrl} 
          onChange={e => setTempUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!tempUrl.trim() || form.allowed_urls.length >= 10) return; handleChange('allowed_urls', [...form.allowed_urls, tempUrl.trim()]); setTempUrl(''); } }}
          placeholder="Add allowed URL..." 
          style={{ flex: 1, padding: '8px 12px', fontSize: 13, border: 'none', outline: 'none', background: 'transparent' }}
        />
        <button 
          type="button" 
          onClick={() => { if (!tempUrl.trim() || form.allowed_urls.length >= 10) return; handleChange('allowed_urls', [...form.allowed_urls, tempUrl.trim()]); setTempUrl(''); }}
          disabled={!tempUrl.trim()}
          style={{ 
            whiteSpace: 'nowrap', borderRadius: 8, 
            background: tempUrl.trim() ? '#111827' : '#f3f4f6', 
            color: tempUrl.trim() ? '#fff' : '#d1d5db', 
            padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: tempUrl.trim() ? 'pointer' : 'default', border: 'none',
            transition: 'all 0.2s'
          }}
        >
          Add
        </button>
      </div>
    </div>
  ), [form.allowed_urls, tempUrl, handleChange]);

  // Component for Styling (Colors)
  const StyleSection = React.useMemo(() => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div>
        <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Primary</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
            <input type="color" style={{ position: 'absolute', top: -5, left: -5, width: 50, height: 50, padding: 0, border: 'none', cursor: 'pointer' }} value={form.highlight_color_1} onChange={e => handleChange('highlight_color_1', e.target.value)} />
          </div>
          <input 
            className="inputField" 
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb', color: '#6b7280' }} 
            value={form.highlight_color_1} 
            onChange={e => handleChange('highlight_color_1', e.target.value)} 
          />
        </div>
      </div>
      <div>
        <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Secondary</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
            <input type="color" style={{ position: 'absolute', top: -5, left: -5, width: 50, height: 50, padding: 0, border: 'none', cursor: 'pointer' }} value={form.highlight_color_2} onChange={e => handleChange('highlight_color_2', e.target.value)} />
          </div>
          <input 
            className="inputField" 
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb', color: '#6b7280' }} 
            value={form.highlight_color_2} 
            onChange={e => handleChange('highlight_color_2', e.target.value)} 
          />
        </div>
      </div>
    </div>
  ), [form.highlight_color_1, form.highlight_color_2, handleChange]);

  // Component for Widget Display Configuration
  const WidgetDisplaySection = React.useMemo(() => (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Styling Colors Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Primary Color</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
              <input type="color" style={{ position: 'absolute', top: -5, left: -5, width: 50, height: 50, padding: 0, border: 'none', cursor: 'pointer' }} value={form.highlight_color_1} onChange={e => handleChange('highlight_color_1', e.target.value)} />
            </div>
            <input 
              type="text"
              className="inputField" 
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb', color: '#374151' }} 
              value={form.highlight_color_1} 
              onChange={e => handleChange('highlight_color_1', e.target.value)} 
            />
          </div>
        </div>
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Secondary Color</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 38, height: 38, borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
              <input type="color" style={{ position: 'absolute', top: -5, left: -5, width: 50, height: 50, padding: 0, border: 'none', cursor: 'pointer' }} value={form.highlight_color_2} onChange={e => handleChange('highlight_color_2', e.target.value)} />
            </div>
            <input 
              type="text"
              className="inputField" 
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb', color: '#374151' }} 
              value={form.highlight_color_2} 
              onChange={e => handleChange('highlight_color_2', e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Display Mode & Position Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Display Mode</label>
          <div style={{ position: 'relative' }}>
            <select 
              className="inputField" 
              value={form.display_mode} 
              onChange={e => handleChange('display_mode', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', appearance: 'none', background: '#fff', fontSize: 14, borderRadius: 10, border: '1px solid #e5e7eb' }}
            >
              <option value="anchored">Anchored</option>
              <option value="floating">Floating</option>
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Display Position</label>
          <div style={{ position: 'relative' }}>
            <select 
              className="inputField" 
              value={form.display_position} 
              onChange={e => handleChange('display_position', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', appearance: 'none', background: '#fff', fontSize: 14, borderRadius: 10, border: '1px solid #e5e7eb' }}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Article Class & Widget Container Class Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Article Selector Class</label>
          <input 
            className="inputField" 
            value={form.article_class} 
            onChange={e => handleChange('article_class', e.target.value)} 
            placeholder=".article" 
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 10, border: '1px solid #e5e7eb' }}
          />
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>CSS selector for the article container</div>
        </div>

        <div>
          <label className="inputLabel" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Widget Container Class</label>
          <input 
            className="inputField" 
            value={form.widget_container_class} 
            onChange={e => handleChange('widget_container_class', e.target.value)} 
            placeholder="Optional custom container class" 
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, borderRadius: 10, border: '1px solid #e5e7eb' }}
          />
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Optional: CSS class for widget container</div>
        </div>
      </div>
    </div>
  ), [form.display_mode, form.display_position, form.article_class, form.widget_container_class, form.highlight_color_1, form.highlight_color_2, handleChange]);

  // Component for Prompts
  const PromptsSection = React.useMemo(() => {
    const handleDragStart = (e: React.DragEvent, idx: number) => {
      setDraggedIndex(idx);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIdx) {
        setDraggedIndex(null);
        return;
      }

      const newArray = [...form.input_text_placeholders];
      const [draggedItem] = newArray.splice(draggedIndex, 1);
      newArray.splice(dropIdx, 0, draggedItem);
      
      handleChange('input_text_placeholders', newArray);
      setDraggedIndex(null);
    };

    const handleDragEnd = () => {
      setDraggedIndex(null);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <label className="inputLabel" style={{ marginBottom: 8, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Conversation Starters</label>
        
        {/* Active Prompts List */}
        <div style={{ flex: 1, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {form.input_text_placeholders.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>No starters added.</div>
          ) : (
            form.input_text_placeholders.map((ph, idx) => (
              <div 
                key={idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                style={{ 
                  background: draggedIndex === idx ? '#f3f4f6' : '#fff', 
                  borderRadius: 20, 
                  padding: '6px 12px', 
                  fontSize: 13, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  color: '#374151', 
                  border: draggedIndex === idx ? '1px dashed #9ca3af' : '1px solid #e5e7eb', 
                  boxShadow: draggedIndex === idx ? 'none' : '0 1px 2px rgba(0,0,0,0.02)',
                  cursor: 'grab',
                  opacity: draggedIndex === idx ? 0.5 : 1,
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, overflow: 'hidden' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ph}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleChange('input_text_placeholders', form.input_text_placeholders.filter((_, i) => i !== idx))}
                  title="Remove"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#9ca3af', marginLeft: 8, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))
          )}
        </div>

      {/* Add Input */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 4, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <input 
          value={tempPlaceholder} 
          onChange={e => setTempPlaceholder(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (!tempPlaceholder.trim()) return; handleChange('input_text_placeholders', [...form.input_text_placeholders, tempPlaceholder.trim()]); setTempPlaceholder(''); } }}
          placeholder="New starter..." 
          style={{ flex: 1, padding: '8px 12px', fontSize: 13, border: 'none', outline: 'none', background: 'transparent' }}
        />
        <button 
          type="button" 
          onClick={() => { if (!tempPlaceholder.trim()) return; handleChange('input_text_placeholders', [...form.input_text_placeholders, tempPlaceholder.trim()]); setTempPlaceholder(''); }}
          disabled={!tempPlaceholder.trim()}
          style={{ 
            whiteSpace: 'nowrap', borderRadius: 8, 
            background: tempPlaceholder.trim() ? '#111827' : '#f3f4f6', 
            color: tempPlaceholder.trim() ? '#fff' : '#d1d5db', 
            padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: tempPlaceholder.trim() ? 'pointer' : 'default', border: 'none',
            transition: 'all 0.2s'
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
  }, [form.input_text_placeholders, tempPlaceholder, draggedIndex, handleChange, setDraggedIndex]);

  return (
    <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(23, 23, 28, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: 24, 
        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)', 
        minWidth: 400, 
        maxWidth: '95vw', 
        width: isEditMode ? 860 : 600, 
        maxHeight: '92vh',
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        
        {/* Header Section */}
        <div style={{ padding: '24px 32px', background: '#fff', borderBottom: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}>
               {isEditMode ? (
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
               ) : (
                 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
               )}
            </div>
            <div>
              <h2 className="sectionTitle" style={{ fontSize: 18, margin: '0 0 2px 0', color: '#111827' }}>
                {isEditMode ? 'Configuration' : 'Create Manual Widget'}
              </h2>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {isEditMode ? 'Manage widget settings & details' : (step === 1 ? 'Step 1: General Setup' : step === 2 ? 'Step 2: Security & Access' : 'Step 3: Customization')}
              </div>
            </div>
          </div>
          {isEditMode && (
             <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: isEditMode ? '24px 32px' : '32px 40px' }}>
            {isEditMode ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <EditSectionCard 
                    title="Identity" 
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                  >
                    {IdentitySection}
                  </EditSectionCard>
                  
                  <EditSectionCard 
                    title="Security"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>}
                  >
                    {SecuritySection}
                  </EditSectionCard>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <EditSectionCard 
                    title="Widget Display"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>}
                  >
                    {WidgetDisplaySection}
                  </EditSectionCard>
                   
                  <EditSectionCard 
                    title="Chat Interface"
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}
                  >
                    {PromptsSection}
                  </EditSectionCard>
                </div>
              </div>
            ) : (
              // Wizard Mode (Create)
              <div style={{ minHeight: 320 }}>
                {step === 1 && IdentitySection}
                {step === 2 && SecuritySection}
                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {StyleSection}
                    {PromptsSection}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            padding: '20px 32px', 
            background: '#fff', 
            borderTop: '1px solid #f3f4f6', 
            position: 'sticky', 
            bottom: 0,
            zIndex: 10
          }}>
            {!isEditMode && (
              <button 
                type="button" 
                className="btn" 
                onClick={onClose} 
                style={{ background: 'transparent', color: '#6b7280', border: 'none', padding: '0 16px', fontWeight: 500 }}
              >
                Cancel
              </button>
            )}
            
            {!isEditMode && step > 1 && (
              <button 
                type="button" 
                className="btn btnSecondary" 
                onClick={back}
                style={{ borderRadius: 12, marginRight: 'auto' }}
              >
                Back
              </button>
            )}

            {!isEditMode && step < 3 && (
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
            
            {(isEditMode || step === 3) && (
              <button 
                type="submit" 
                className="btn btnPrimary"
                style={{ 
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  minWidth: isEditMode ? 180 : 140
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

