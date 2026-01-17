import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface ScanSiteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newProject: any) => void;
  accounts: { id: string; name: string }[];
  existingProjects?: { account_id: string; allowed_urls: string[] | null }[];
}

const normalizeUrl = (url: string) => {
  return url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '').toLowerCase();
};

export function ScanSiteModal({ open, onClose, onSuccess, accounts, existingProjects = [] }: ScanSiteModalProps) {
  const [rawInput, setRawInput] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{ success: number; failed: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const resetForm = () => {
      setRawInput('');
      setError(null);
      setResultSummary(null);
      setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const urls = text.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
        setRawInput(prev => {
           const existing = prev ? prev + '\n' : '';
           return existing + urls.join('\n');
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  async function processUrl(url: string) {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-site', {
        body: { url, accountId }
      });
      if (error) throw new Error(error.message);
      if (data && data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error(`Error scanning ${url}:`, err);
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = rawInput
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http') || u.startsWith('www')));

    const uniqueUrls = [...new Set(urls)];

    if (uniqueUrls.length === 0) {
      setError("Please enter at least one valid URL (starting with http:// or https://)");
      return;
    }

    if (!accountId) {
      setError("Please select a target account.");
      return;
    }

    // We process only unique URLs from the input to avoid redundant API calls in this batch,
    // but we intentionally DO NOT check against existing database projects (as per user request).
    // This allows re-runs or duplicate project creation if desired.
    const urlsToProcess = uniqueUrls;

    if (urlsToProcess.length > 50) {
      setError(`Limit exceeded: You provided ${urlsToProcess.length} unique URLs. Maximum allowed is 50.`);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: urlsToProcess.length });

    const CONCURRENCY = 5;
    let completed = 0;
    let successCount = 0;
    let failedCount = 0;
    
    // Process queue
    const queue = [...urlsToProcess];
    const workers = [];

    const worker = async () => {
        while (queue.length > 0) {
            const url = queue.shift();
            if (url) {
                const result = await processUrl(url);
                if (result) {
                    onSuccess(result);
                    successCount++;
                } else {
                    failedCount++;
                }
                
                completed++;
                setProgress(prev => ({ ...prev, current: completed }));
            }
        }
    };

    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    setLoading(false);
    setResultSummary({
        success: successCount,
        failed: failedCount,
        skipped: urls.length - urlsToProcess.length
    });
  }

  if (resultSummary) {
      return (
        <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(23, 23, 28, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)', minWidth: 400, padding: 40, textAlign: 'center' }}>
                 <div style={{ width: 64, height: 64, borderRadius: 20, background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>
                 <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Batch Complete</h2>
                 <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 32 }}>Your widgets have been generated.</p>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                    <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{resultSummary.success}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Added</div>
                    </div>
                    <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{resultSummary.skipped}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Skipped</div>
                    </div>
                    <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{resultSummary.failed}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Failed</div>
                    </div>
                 </div>

                 <button 
                  className="btn btnPrimary" 
                  onClick={handleClose}
                  style={{ width: '100%', justifyContent: 'center', borderRadius: 12, padding: '14px' }}
                 >
                    Done
                 </button>
            </div>
        </div>
      );
  }

  return (
    <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(23, 23, 28, 0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)', minWidth: 400, maxWidth: '95vw', width: 640, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Section */}
        <div style={{ padding: '32px 40px', background: 'linear-gradient(to bottom right, #f8faff, #ffffff)', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}>
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <div>
              <h2 className="sectionTitle" style={{ fontSize: 20, margin: '0 0 2px 0', color: '#111827' }}>AI Batch Widget Generator</h2>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>Create up to 50 widgets at once</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '32px 40px 40px 40px', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div>
            <label className="inputLabel" style={{ marginBottom: 8, display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Target Account</label>
            <div style={{ position: 'relative' }}>
              <select 
                className="inputField" 
                required 
                value={accountId} 
                onChange={e => setAccountId(e.target.value)} 
                disabled={loading}
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
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="inputLabel" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Website URLs</label>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        disabled={loading}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        Upload CSV
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>
            <textarea
              className="inputField"
              required
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder="Enter URLs one per line (e.g., https://example.com)..."
              disabled={loading}
              style={{ 
                  width: '100%', 
                  height: 160,
                  padding: '12px', 
                  fontSize: 14, 
                  fontFamily: 'monospace',
                  borderRadius: 10, 
                  border: '1px solid #e5e7eb',
                  resize: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
                <span>Supports CSV or separated list</span>
                <span>Max 50 URLs</span>
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 12px', background: '#fef2f2', borderRadius: 8, color: '#991b1b', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
               {error}
            </div>
          )}
          
          {loading && (
             <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#334155' }}>
                     <span>Processing...</span>
                     <span>{progress.current} / {progress.total}</span>
                 </div>
                 <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                     <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: '100%', background: '#2563eb', transition: 'width 0.3s' }} />
                 </div>
             </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', marginTop: 'auto' }}>
            <button 
              type="button" 
              className="btn" 
              onClick={handleClose} 
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
                padding: '10px 24px', 
                borderRadius: 10,
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                border: 'none',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.3)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : `Generate Widgets`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
