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
    <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', padding: 36, minWidth: 400, maxWidth: '90vw', width: 450 }}>
        <form onSubmit={handleSubmit}>
          <h2 className="sectionTitle" style={{ fontSize: 22, marginBottom: 18 }}>New Widget</h2>
          <p style={{ marginBottom: 24, padding: 0, color: 'var(--text)', opacity: 0.8 }}>
             Enter a website URL. Our AI will analyze it to automatically configure your new project.
          </p>
          
          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label className="inputLabel">Account *</label>
              <select className="inputField" required value={accountId} onChange={e => setAccountId(e.target.value)}>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="inputLabel">Website URL *</label>
              <input 
                className="inputField" 
                required 
                type="url"
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="https://example.com" 
              />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 18, color: '#ef4444', fontSize: 14 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btnSecondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary" disabled={loading} style={{ minWidth: 140 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner-small" /> Scanning...
                </span>
              ) : 'Generate Widget'}
            </button>
          </div>
        </form>
        <style>{`
          .spinner-small {
            width: 14px;
            height: 14px;
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
