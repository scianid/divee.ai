import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ScanSiteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newProject: any) => void;
  accounts: { id: string; name: string }[];
}

export function ScanSiteModal({ open, onClose, onSuccess, accounts }: ScanSiteModalProps) {
  const [url, setUrl] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !accountId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-site', {
        body: { url, accountId }
      });

      if (error) {
          console.error("Supabase Function Error:", error);
          throw new Error('Function failed: ' + error.message);
      }
      
      // The function might return an error object in the body even if status is 200/400
      if (data && data.error) {
          throw new Error(data.error);
      }
      
      onSuccess(data);
      onClose();
    } catch (err: any) {
      console.error('Error scanning site:', err);
      setError(err.message || 'Failed to scan site');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(23, 23, 28, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)', minWidth: 400, maxWidth: '95vw', width: 600, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Section */}
        <div style={{ padding: '40px 40px 32px 40px', background: 'linear-gradient(to bottom right, #f8faff, #ffffff)', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <div>
              <h2 className="sectionTitle" style={{ fontSize: 22, margin: '0 0 4px 0', color: '#111827' }}>Widget Generator</h2>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Powered by AI</div>
            </div>
          </div>
          <p style={{ margin: '8px 0 0 0', lineHeight: 1.6, color: '#4b5563', fontSize: 15 }}>
             Enter any public website URL. Our AI will analyze the brand identity, extract assets, and configure a fully functional widget in seconds.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px 40px 40px 40px', flex: 1 }}>
          <div style={{ display: 'grid', gap: 24 }}>
            <div>
              <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Target Account</label>
              <div style={{ position: 'relative' }}>
                <select 
                  className="inputField" 
                  required 
                  value={accountId} 
                  onChange={e => setAccountId(e.target.value)} 
                  disabled={loading}
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
              <label className="inputLabel" style={{ marginBottom: 8, display: 'block' }}>Website URL</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </div>
                <input 
                  className="inputField" 
                  required 
                  type="url"
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                  placeholder="https://example.com" 
                  disabled={loading}
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
              onClick={onClose} 
              disabled={loading}
              style={{ background: 'transparent', color: '#6b7280', border: 'none', padding: '0 16px', fontWeight: 500 }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btnPrimary" 
              disabled={loading} 
              style={{ 
                minWidth: 160, 
                padding: '12px 24px', 
                borderRadius: 12,
                background: loading ? '#ccc' : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                border: 'none',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="spinner-small" /> Analyzing...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Generate Widget
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
              )}
            </button>
          </div>
        </form>
        <style>{`
          .spinner-small {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            display: inline-block;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
}
