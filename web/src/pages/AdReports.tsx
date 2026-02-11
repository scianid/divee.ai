import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- Helper Functions ---

const formatNumber = (num: number | null | undefined): string => {
  if (num == null) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const formatCurrency = (num: number | null | undefined): string => {
  if (num == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatSmallCurrency = (num: number | null | undefined): string => {
  if (num == null) return '$0.00';
  // For very small values like eCPM, show more decimals
  if (num < 0.01 && num > 0) {
    return '$' + num.toFixed(4);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(num);
};

// --- Interfaces ---

interface GamReportData {
  totalImpressions: number;
  totalRevenue: number;
  userRevenue: number;
  revenueSharePercentage: number;
  timeline: { date: string; impressions: number; revenue: number }[];
  byAdUnit?: { adUnitName: string; impressions: number; revenue: number }[];
  bySite?: { siteName: string; impressions: number; revenue: number }[];
  rowCount?: number;
}

// --- Icons ---

const CalendarIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const DollarIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const TrophyIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
  </svg>
);

const TrendUpIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

// --- Helper Components ---

function Card({ 
  children, 
  style = {}, 
  title, 
  className = '' 
}: { 
  children: React.ReactNode; 
  style?: React.CSSProperties; 
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {title && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px' 
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#334155', margin: 0 }}>
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
}

function TrendChart({ 
  data, 
  dataKey = 'impressions',
  color = '#3b82f6'
}: { 
  data: { date: string; impressions: number; revenue: number }[]; 
  dataKey?: 'impressions' | 'revenue';
  color?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '200px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#94a3b8'
      }}>
        No data available
      </div>
    );
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const point = params[0];
        const date = new Date(point.axisValue).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        const value = dataKey === 'revenue' 
          ? formatCurrency(point.value) 
          : formatNumber(point.value);
        return `${date}<br/><b>${value}</b>`;
      }
    },
    grid: { 
      top: 10, 
      right: 10, 
      bottom: 30, 
      left: 50 
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { 
        color: '#94a3b8', 
        fontSize: 11,
        formatter: (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { 
        lineStyle: { 
          color: '#f1f5f9',
          type: 'dashed'
        } 
      },
      axisLabel: { 
        color: '#94a3b8', 
        fontSize: 11,
        formatter: (value: number) => dataKey === 'revenue' 
          ? '$' + formatNumber(value) 
          : formatNumber(value)
      }
    },
    series: [{
      type: 'line',
      data: data.map(d => d[dataKey]),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      lineStyle: { 
        color: color, 
        width: 3 
      },
      itemStyle: { color: color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + '40' },
            { offset: 1, color: color + '05' }
          ]
        }
      }
    }]
  };

  return (
    <ReactECharts 
      option={option} 
      style={{ height: '200px', width: '100%' }} 
      opts={{ renderer: 'svg' }} 
    />
  );
}

// --- Main Component ---

export default function AdReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GamReportData | null>(null);
  const [availableSites, setAvailableSites] = useState<Array<{ url: string; projectName: string }>>([]); 
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const navigate = useNavigate();

  // Calculate default date range (last 24 hours)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 1);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  
  // Get auth state from context
  const { user, isAdmin, isLoading } = useAuth();

  // Auth and admin check
  useEffect(() => {
    if (isLoading) return; // Wait for auth to load
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Don't render until admin check is complete
  if (isLoading || !user) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  // Fetch GAM report data
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      // Add site filter if a specific site is selected
      if (selectedSite !== 'all') {
        params.append('site_name', selectedSite);
      }

      const response = await fetch(
        `https://srv.divee.ai/functions/v1/gam?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch report');
      }

      const reportData: GamReportData = await response.json();
      setData(reportData);
    } catch (err) {
      console.error('Failed to fetch GAM report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user projects
  const fetchProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('project')
        .select('project_id, client_name, allowed_urls')
        .order('client_name');

      if (projectsError) throw projectsError;
      
      // Extract all unique allowed URLs from projects with their project names
      const siteMap = new Map<string, string>();
      projectsData?.forEach(project => {
        if (project.allowed_urls && Array.isArray(project.allowed_urls)) {
          project.allowed_urls.forEach(url => {
            if (!siteMap.has(url)) {
              siteMap.set(url, project.client_name);
            }
          });
        }
      });
      const sites = Array.from(siteMap.entries())
        .map(([url, projectName]) => ({ url, projectName }))
        .sort((a, b) => a.projectName.localeCompare(b.projectName));
      setAvailableSites(sites);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchReport();
    }
  }, [user]);
  
  // Refetch when site selection changes
  useEffect(() => {
    if (user && selectedSite !== 'all') {
      fetchReport();
    }
  }, [selectedSite]);

  // Handle date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, start: e.target.value }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, end: e.target.value }));
  };

  // Quick presets
  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  const isPresetActive = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return dateRange.start === start.toISOString().split('T')[0] &&
           dateRange.end === end.toISOString().split('T')[0];
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 16px',
    borderRadius: '999px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    transition: 'background 0.2s',
  };

  if (!user) return null;

  return (
    <div style={{ 
      fontFamily: 'var(--font-display)', 
      padding: '0 clamp(16px, 4vw, 24px) 48px', 
      color: '#334155' 
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Ad Reports
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px' }}>
          Google Ad Manager revenue and impression reports
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '32px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Site Filter */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSiteDropdown(!showSiteDropdown)}
            style={{
              ...btnStyle,
              minWidth: '180px',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedSite === 'all' 
                ? 'All Sites' 
                : availableSites.find(s => s.url === selectedSite)?.projectName || selectedSite}
            </span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSiteDropdown && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                onClick={() => setShowSiteDropdown(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '200px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 20
              }}>
                <div
                  onClick={() => {
                    setSelectedSite('all');
                    setShowSiteDropdown(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: selectedSite === 'all' ? '#2563eb' : '#334155',
                    fontWeight: selectedSite === 'all' ? 600 : 400,
                    background: selectedSite === 'all' ? '#f0f7ff' : 'transparent',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSite !== 'all') e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSite !== 'all') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  All Sites
                </div>
                {availableSites.map(site => (
                  <div
                    key={site.url}
                    onClick={() => {
                      setSelectedSite(site.url);
                      setShowSiteDropdown(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: selectedSite === site.url ? '#2563eb' : '#334155',
                      fontWeight: selectedSite === site.url ? 600 : 400,
                      background: selectedSite === site.url ? '#f0f7ff' : 'transparent',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSite !== site.url) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSite !== site.url) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{site.projectName}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {site.url}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Date Range Picker */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center', 
          background: '#fff', 
          padding: '8px 12px', 
          borderRadius: '999px', 
          border: '1px solid #e2e8f0',
        }}>
          <CalendarIcon />
          <input
            type="date"
            value={dateRange.start}
            onChange={handleStartDateChange}
            style={{ 
              border: 'none', 
              outline: 'none', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#334155', 
              fontFamily: 'inherit', 
              width: '110px',
              cursor: 'pointer'
            }}
          />
          <span style={{ color: '#94a3b8' }}>→</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={handleEndDateChange}
            style={{ 
              border: 'none', 
              outline: 'none', 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#334155', 
              fontFamily: 'inherit', 
              width: '110px',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Quick Presets */}
        <button 
          onClick={() => setPreset(1)} 
          style={{ 
            ...btnStyle, 
            border: isPresetActive(1) ? '1px solid #2563eb' : '1px solid #e2e8f0', 
            color: isPresetActive(1) ? '#2563eb' : '#334155' 
          }}
        >
          24h
        </button>
        <button 
          onClick={() => setPreset(7)} 
          style={{ 
            ...btnStyle, 
            border: isPresetActive(7) ? '1px solid #2563eb' : '1px solid #e2e8f0', 
            color: isPresetActive(7) ? '#2563eb' : '#334155' 
          }}
        >
          7 days
        </button>
        <button 
          onClick={() => setPreset(30)} 
          style={{ 
            ...btnStyle, 
            border: isPresetActive(30) ? '1px solid #2563eb' : '1px solid #e2e8f0', 
            color: isPresetActive(30) ? '#2563eb' : '#334155' 
          }}
        >
          30 days
        </button>
        <button 
          onClick={() => setPreset(90)} 
          style={{ 
            ...btnStyle, 
            border: isPresetActive(90) ? '1px solid #2563eb' : '1px solid #e2e8f0', 
            color: isPresetActive(90) ? '#2563eb' : '#334155' 
          }}
        >
          90 days
        </button>

        {/* Apply Button */}
        <button 
          onClick={fetchReport} 
          disabled={loading}
          style={{ 
            ...btnStyle, 
            background: '#2563eb', 
            color: '#fff', 
            border: '1px solid #2563eb',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Apply'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <Card style={{ marginBottom: '24px', background: '#fef2f2', borderColor: '#fecaca' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#dc2626' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && !data && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' 
        }}>
          <div style={{ 
            display: 'inline-block', 
            width: '48px', 
            height: '48px', 
            border: '4px solid #f3f4f6', 
            borderTop: '4px solid #2563eb', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
        </div>
      )}

      {/* Data Display */}
      {data && (
        <>
          {/* Hero Revenue Card */}
          <Card style={{ 
            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
            border: 'none',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px', fontWeight: 500 }}>
                  Your Revenue ({data.revenueSharePercentage.toFixed(0)}% share)
                </div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: '#fff', marginBottom: '8px', lineHeight: 1 }}>
                  {formatCurrency(data.userRevenue)}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  Total Revenue: {formatCurrency(data.totalRevenue)} • {formatNumber(data.totalImpressions)} impressions
                </div>
              </div>
              <div style={{ 
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px 16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
                  Daily Avg
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                  {formatCurrency(data.userRevenue / (data.timeline?.length || 1))}
                </div>
              </div>
            </div>
          </Card>

          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            <Card>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  Total Impressions
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>
                  {formatNumber(data.totalImpressions)}
                </div>
              </div>
            </Card>

            <Card>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  eCPM
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>
                  {data.totalImpressions > 0 
                    ? formatSmallCurrency((data.totalRevenue / data.totalImpressions) * 1000)
                    : '$0.00'
                  }
                </div>
              </div>
            </Card>

            <Card>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  Projected Monthly
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'rgb(59, 130, 246)' }}>
                  {formatCurrency((data.userRevenue / (data.timeline?.length || 1)) * 30)}
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', 
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Impressions Over Time */}
            <Card title="Impressions Over Time">
              <TrendChart data={data.timeline} dataKey="impressions" color="#3b82f6" />
            </Card>

            {/* Revenue Over Time */}
            <Card title="Revenue Over Time">
              <TrendChart data={data.timeline} dataKey="revenue" color="#3b82f6" />
            </Card>
          </div>

          {/* Performance Tables */}
          {data.bySite && data.bySite.length > 0 && (
            <Card title="Top Performing Sites" style={{ marginBottom: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Site</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Impressions</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Revenue</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>eCPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bySite.slice(0, 10).map((site, idx) => {
                      return (
                      <tr key={site.siteName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {idx < 3 && <span style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '50%', 
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: 'rgb(59, 130, 246)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>{idx + 1}</span>}
                            <span style={{ fontWeight: 500, color: '#1e293b' }}>{site.siteName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#475569', fontWeight: 500 }}>
                          {formatNumber(site.impressions)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                          {formatCurrency(site.revenue)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>
                          {site.impressions > 0 ? formatSmallCurrency((site.revenue / site.impressions) * 1000) : '$0.00'}
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {data.byAdUnit && data.byAdUnit.length > 0 && (
            <Card title="Ad Unit Performance" style={{ marginBottom: '24px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Ad Unit</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Impressions</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Revenue</th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>eCPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byAdUnit.map((unit) => (
                      <tr key={unit.adUnitName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#475569' }}>
                          {unit.adUnitName}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#475569', fontWeight: 500 }}>
                          {formatNumber(unit.impressions)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                          {formatCurrency(unit.revenue)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>
                          {unit.impressions > 0 ? formatSmallCurrency((unit.revenue / unit.impressions) * 1000) : '$0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Row count info */}
          {data.rowCount && (
            <div style={{ 
              textAlign: 'right', 
              color: '#94a3b8',
              fontSize: '0.875rem',
              marginBottom: '24px'
            }}>
              Data aggregated from {formatNumber(data.rowCount)} records
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && !data && (
        <Card>
          <div style={{ 
            padding: '48px', 
            textAlign: 'center', 
            color: '#64748b' 
          }}>
            <ChartIcon />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '16px 0 8px' }}>
              No Report Data
            </h3>
            <p style={{ margin: 0 }}>
              Select a date range and click Apply to generate a report
            </p>
          </div>
        </Card>
      )}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
