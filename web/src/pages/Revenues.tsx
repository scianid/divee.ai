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

// --- Pricing Constants ---
const INPUT_TOKEN_COST = 1.10; // $1.10 per 1M input tokens
const OUTPUT_TOKEN_COST = 4.40; // $4.40 per 1M output tokens

// --- Interfaces ---

interface ProjectRevenue {
  project_id: string;
  project_name: string;
  ad_revenue: number;
  token_cost: number;
  net_revenue: number;
  revenue_share_percentage: number;
  impressions: number;
  total_tokens: number;
}

interface TimeSeriesData {
  date: string;
  ad_revenue: number;
  token_cost: number;
  net_revenue: number;
  impressions: number;
}

interface RevenueData {
  projectRevenues: ProjectRevenue[];
  totalRevenue: number;
  totalAdRevenue: number;
  totalTokenCost: number;
  totalImpressions: number;
  totalTokens: number;
  projectedMonthly: number;
  timeSeries: TimeSeriesData[];
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
  dataKey,
  label,
  color = '#3b82f6'
}: { 
  data: TimeSeriesData[]; 
  dataKey: 'ad_revenue' | 'net_revenue' | 'impressions';
  label: string;
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

  const isRevenue = dataKey === 'ad_revenue' || dataKey === 'net_revenue';

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
        const value = isRevenue 
          ? formatCurrency(point.value) 
          : formatNumber(point.value);
        return `${date}<br/><b>${value}</b>`;
      }
    },
    grid: { 
      top: 10, 
      right: 10, 
      bottom: 30, 
      left: 60 
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
        formatter: (value: number) => isRevenue 
          ? '$' + formatNumber(value) 
          : formatNumber(value)
      }
    },
    series: [{
      name: label,
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
      style={{ height: '220px', width: '100%' }} 
      opts={{ renderer: 'svg' }} 
    />
  );
}

// --- Main Component ---

export default function Revenues() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RevenueData | null>(null);
  const [availableProjects, setAvailableProjects] = useState<Array<{ project_id: string; projectName: string; url: string }>>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const navigate = useNavigate();

  // Calculate default date range (this month)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  
  // Get auth state from context
  const { user, isLoading } = useAuth();

  // Auth check
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, isLoading, navigate]);

  // Don't render until auth check is complete
  if (isLoading || !user) {
    return (
      <div style={{ 
        padding: '48px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{
          `@keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }`
        }</style>
        <div style={{ color: '#64748b', fontSize: '14px' }}>Loading...</div>
      </div>
    );
  }

  // Fetch revenue data
  const fetchRevenues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Adjust end date to include full day
      const endDatePlusOne = new Date(dateRange.end);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      const endDateInclusive = endDatePlusOne.toISOString().split('T')[0];

      // Fetch projects and revenue share config
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      // Get user's owned accounts
      const { data: ownedAccounts } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', authUser.id);

      // Get accounts where user is a collaborator
      const { data: collaboratorAccounts } = await supabase
        .from('account_collaborator')
        .select('account_id')
        .eq('user_id', authUser.id);

      const accountIds = [
        ...(ownedAccounts || []).map(a => a.id),
        ...(collaboratorAccounts || []).map(c => c.account_id)
      ];

      if (accountIds.length === 0) {
        setData({
          projectRevenues: [],
          totalRevenue: 0,
          totalAdRevenue: 0,
          totalTokenCost: 0,
          totalImpressions: 0,
          totalTokens: 0,
          projectedMonthly: 0,
          timeSeries: []
        });
        setLoading(false);
        return;
      }

      // Get user's projects
      let projectsQuery = supabase
        .from('project')
        .select('project_id, client_name, allowed_urls')
        .in('account_id', accountIds);

      if (selectedProject !== 'all') {
        projectsQuery = projectsQuery.eq('project_id', selectedProject);
      }

      const { data: projects, error: projectsError } = await projectsQuery;
      if (projectsError) throw projectsError;

      if (!projects || projects.length === 0) {
        setData({
          projectRevenues: [],
          totalRevenue: 0,
          totalAdRevenue: 0,
          totalTokenCost: 0,
          totalImpressions: 0,
          totalTokens: 0,
          projectedMonthly: 0,
          timeSeries: []
        });
        setLoading(false);
        return;
      }

      const projectIds = projects.map(p => p.project_id);

      // Fetch revenue share config
      const { data: configData } = await supabase
        .from('project_config')
        .select('project_id, revenue_share_percentage')
        .in('project_id', projectIds);

      const revenueShareMap = new Map<string, number>();
      configData?.forEach(c => {
        revenueShareMap.set(c.project_id, c.revenue_share_percentage || 50);
      });

      // Fetch ad revenue from GAM
      const gamParams = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      const gamResponse = await fetch(
        `https://srv.divee.ai/functions/v1/gam?${gamParams}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      let gamData: any = null;
      if (gamResponse.ok) {
        gamData = await gamResponse.json();
      }

      // Map sites to projects
      const siteToProjectMap = new Map<string, string>();
      projects.forEach(p => {
        if (p.allowed_urls) {
          p.allowed_urls.forEach((url: string) => {
            siteToProjectMap.set(url, p.project_id);
          });
        }
      });

      // Fetch token usage
      const { data: tokenUsage } = await supabase
        .from('token_usage')
        .select('project_id, created_at, input_tokens, output_tokens')
        .in('project_id', projectIds)
        .gte('created_at', dateRange.start)
        .lt('created_at', endDateInclusive);

      // Build project revenues map
      const projectMap = new Map<string, ProjectRevenue>();
      projects.forEach(p => {
        projectMap.set(p.project_id, {
          project_id: p.project_id,
          project_name: p.client_name || 'Unnamed Widget',
          ad_revenue: 0,
          token_cost: 0,
          net_revenue: 0,
          revenue_share_percentage: revenueShareMap.get(p.project_id) || 50,
          impressions: 0,
          total_tokens: 0,
        });
      });

      // Aggregate ad revenue by project (map sites to projects)
      if (gamData && gamData.bySite) {
        gamData.bySite.forEach((site: any) => {
          const projectId = siteToProjectMap.get(site.siteName);
          if (projectId) {
            const project = projectMap.get(projectId);
            if (project) {
              project.ad_revenue += site.revenue || 0;
              project.impressions += site.impressions || 0;
            }
          }
        });
      }

      // Aggregate token costs
      tokenUsage?.forEach(row => {
        const project = projectMap.get(row.project_id);
        if (project) {
          const inputCost = (row.input_tokens / 1_000_000) * INPUT_TOKEN_COST;
          const outputCost = (row.output_tokens / 1_000_000) * OUTPUT_TOKEN_COST;
          project.token_cost += inputCost + outputCost;
          project.total_tokens += row.input_tokens + row.output_tokens;
        }
      });

      // Calculate net revenue
      projectMap.forEach(project => {
        const grossProfit = project.ad_revenue - project.token_cost;
        project.net_revenue = (grossProfit * project.revenue_share_percentage) / 100;
      });

      // Build time series
      const timeSeriesMap = new Map<string, TimeSeriesData>();
      
      // Ad revenue timeline
      if (gamData && gamData.timeline) {
        gamData.timeline.forEach((entry: any) => {
          if (!timeSeriesMap.has(entry.date)) {
            timeSeriesMap.set(entry.date, {
              date: entry.date,
              ad_revenue: 0,
              token_cost: 0,
              net_revenue: 0,
              impressions: 0,
            });
          }
          const tsEntry = timeSeriesMap.get(entry.date)!;
          tsEntry.ad_revenue += entry.revenue || 0;
          tsEntry.impressions += entry.impressions || 0;
        });
      }

      // Token cost timeline
      tokenUsage?.forEach(row => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        if (!timeSeriesMap.has(date)) {
          timeSeriesMap.set(date, {
            date,
            ad_revenue: 0,
            token_cost: 0,
            net_revenue: 0,
            impressions: 0,
          });
        }
        const tsEntry = timeSeriesMap.get(date)!;
        const inputCost = (row.input_tokens / 1_000_000) * INPUT_TOKEN_COST;
        const outputCost = (row.output_tokens / 1_000_000) * OUTPUT_TOKEN_COST;
        tsEntry.token_cost += inputCost + outputCost;
      });

      // Calculate weighted average revenue share for time series
      const totalAdRevenueForWeighting = Array.from(projectMap.values()).reduce((sum, p) => sum + p.ad_revenue, 0);
      let weightedRevenueShare = 50;
      if (totalAdRevenueForWeighting > 0) {
        let weightedSum = 0;
        projectMap.forEach(p => {
          weightedSum += (p.ad_revenue / totalAdRevenueForWeighting) * p.revenue_share_percentage;
        });
        weightedRevenueShare = weightedSum;
      }

      timeSeriesMap.forEach(entry => {
        const grossProfit = entry.ad_revenue - entry.token_cost;
        entry.net_revenue = (grossProfit * weightedRevenueShare) / 100;
      });

      // Convert to arrays
      const projectRevenues = Array.from(projectMap.values())
        .filter(p => p.ad_revenue > 0 || p.token_cost > 0)
        .sort((a, b) => b.net_revenue - a.net_revenue);

      const timeSeries = Array.from(timeSeriesMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate totals
      const totalsAdRevenue = projectRevenues.reduce((sum, p) => sum + p.ad_revenue, 0);
      const totalTokenCost = projectRevenues.reduce((sum, p) => sum + p.token_cost, 0);
      const totalNetRevenue = projectRevenues.reduce((sum, p) => sum + p.net_revenue, 0);
      const totalImpressions = projectRevenues.reduce((sum, p) => sum + p.impressions, 0);
      const totalTokens = projectRevenues.reduce((sum, p) => sum + p.total_tokens, 0);

      // Calculate projected monthly
      const startMs = new Date(dateRange.start).getTime();
      const endMs = new Date(dateRange.end).getTime();
      const daysInRange = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
      const projectedMonthly = daysInRange > 0 ? (totalNetRevenue / daysInRange) * 30 : 0;

      setData({
        projectRevenues,
        totalRevenue: totalNetRevenue,
        totalAdRevenue: totalsAdRevenue,
        totalTokenCost,
        totalImpressions,
        totalTokens,
        projectedMonthly,
        timeSeries,
      });
    } catch (err) {
      console.error('Failed to fetch revenues:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch revenues');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user projects
  const fetchProjects = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get user's owned accounts
      const { data: ownedAccounts } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', authUser.id);

      // Get accounts where user is a collaborator
      const { data: collaboratorAccounts } = await supabase
        .from('account_collaborator')
        .select('account_id')
        .eq('user_id', authUser.id);

      const accountIds = [
        ...(ownedAccounts || []).map(a => a.id),
        ...(collaboratorAccounts || []).map(c => c.account_id)
      ];
      
      if (accountIds.length === 0) return;

      const { data: projectsData, error: projectsError } = await supabase
        .from('project')
        .select('project_id, client_name, allowed_urls')
        .in('account_id', accountIds)
        .order('client_name');

      if (projectsError) throw projectsError;
      
      // Extract all projects with their URLs
      const projects: Array<{ project_id: string; projectName: string; url: string }> = [];
      projectsData?.forEach(project => {
        if (project.allowed_urls && Array.isArray(project.allowed_urls) && project.allowed_urls.length > 0) {
          // Use first URL as representative
          projects.push({
            project_id: project.project_id,
            projectName: project.client_name || 'Unnamed Project',
            url: project.allowed_urls[0]
          });
        }
      });
      
      setAvailableProjects(projects.sort((a, b) => a.projectName.localeCompare(b.projectName)));
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchRevenues();
    }
  }, [user]);

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

  const setThisMonth = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
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

  const isThisMonthActive = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
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
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 700, 
            color: 'var(--heading)', 
            margin: 0 
          }}>
            Revenues
          </h1>
        </div>
        <p style={{ 
          fontSize: '15px', 
          color: 'var(--text-secondary)', 
          margin: 0 
        }}>
          Your net income after deducting AI costs and applying revenue share
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
        {/* Project Filter */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            style={{
              ...btnStyle,
              minWidth: '180px',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedProject === 'all' 
                ? 'All Widgets' 
                : availableProjects.find(p => p.project_id === selectedProject)?.projectName || selectedProject}
            </span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProjectDropdown && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                onClick={() => setShowProjectDropdown(false)}
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
                    setSelectedProject('all');
                    setShowProjectDropdown(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: selectedProject === 'all' ? '#2563eb' : '#334155',
                    fontWeight: selectedProject === 'all' ? 600 : 400,
                    background: selectedProject === 'all' ? '#f0f7ff' : 'transparent',
                    borderBottom: '1px solid #f1f5f9'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProject !== 'all') e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProject !== 'all') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  All Widgets
                </div>
                {availableProjects.map(project => (
                  <div
                    key={project.project_id}
                    onClick={() => {
                      setSelectedProject(project.project_id);
                      setShowProjectDropdown(false);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: selectedProject === project.project_id ? '#2563eb' : '#334155',
                      fontWeight: selectedProject === project.project_id ? 600 : 400,
                      background: selectedProject === project.project_id ? '#f0f7ff' : 'transparent',
                      borderBottom: '1px solid #f1f5f9'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedProject !== project.project_id) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedProject !== project.project_id) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{project.projectName}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {project.url}
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
          onClick={setThisMonth} 
          style={{ 
            ...btnStyle, 
            border: isThisMonthActive() ? '1px solid #2563eb' : '1px solid #e2e8f0', 
            color: isThisMonthActive() ? '#2563eb' : '#334155' 
          }}
        >
          This Month
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
          onClick={fetchRevenues} 
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

      {/* Loading & Error States */}
      {loading && (
        <Card>
          <div style={{ 
            textAlign: 'center', 
            padding: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{
              `@keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }`
            }</style>
            <div style={{ color: '#64748b', fontSize: '14px' }}>Loading revenue data...</div>
          </div>
        </Card>
      )}

      {error && (
        <Card>
          <div style={{ 
            padding: '16px', 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            fontSize: '14px'
          }}>
            Error: {error}
          </div>
        </Card>
      )}

      {/* Data Display */}
      {!loading && !error && data && (
        <>
          {/* Hero Net Revenue Card */}
          <Card style={{ 
            position: 'relative',
            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
            border: 'none',
            marginBottom: '24px',
            overflow: 'hidden'
          }}>
            {/* Circular Pattern Background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none'
            }}>
              <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                {/* Asymmetric scattered circles with varying opacity and sizes */}
                <circle cx="5%" cy="15%" r="60" fill="rgba(255,255,255,0.08)" />
                <circle cx="85%" cy="25%" r="80" fill="rgba(255,255,255,0.05)" />
                <circle cx="70%" cy="70%" r="100" fill="rgba(255,255,255,0.06)" />
                <circle cx="15%" cy="85%" r="70" fill="rgba(255,255,255,0.07)" />
                <circle cx="45%" cy="40%" r="50" fill="rgba(255,255,255,0.04)" />
                <circle cx="92%" cy="80%" r="55" fill="rgba(255,255,255,0.09)" />
                <circle cx="30%" cy="50%" r="45" fill="rgba(255,255,255,0.05)" />
                <circle cx="60%" cy="10%" r="65" fill="rgba(255,255,255,0.06)" />
                <circle cx="10%" cy="60%" r="40" fill="rgba(255,255,255,0.08)" />
                <circle cx="80%" cy="50%" r="75" fill="rgba(255,255,255,0.04)" />
                <circle cx="50%" cy="90%" r="85" fill="rgba(255,255,255,0.05)" />
                <circle cx="25%" cy="20%" r="35" fill="rgba(255,255,255,0.07)" />
              </svg>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.95)', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  NET REVENUE
                </div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: '#fff', marginBottom: '8px', lineHeight: 1 }}>
                  {formatCurrency(data.totalRevenue)}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  Your earnings for the above period 
                  </div>
              </div>
              {/* Projected Monthly - Hidden for now (partial data)
              <div style={{ 
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px 16px',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
                  Projected Monthly
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                  {formatCurrency(data.projectedMonthly)}
                </div>
              </div>
              */}
            </div>
          </Card>

          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginBottom: '24px'
          }}>
            <Card>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
                Total Impressions
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                {formatNumber(data.totalImpressions)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Ad views across all widgets
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
                Total Token Usage
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                {formatNumber(data.totalTokens)}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                AI tokens consumed
              </div>
            </Card>
          </div>

          {/* Chart */}
          <div style={{ marginBottom: '24px' }}>
            <Card title="Impressions Over Time">
              <TrendChart 
                data={data.timeSeries} 
                dataKey="impressions" 
                label="Impressions"
                color="#2563eb" 
              />
            </Card>
          </div>

          {/* Projects Table */}
          {data.projectRevenues.length > 1 && (
            <Card title="Revenue by Widget">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ 
                        textAlign: 'left', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Widget
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Impressions
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Tokens
                      </th>
                      <th style={{ 
                        textAlign: 'right', 
                        padding: '12px 8px', 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: '#64748b' 
                      }}>
                        Net Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projectRevenues.map((project, idx) => (
                      <tr 
                        key={project.project_id}
                        style={{ 
                          borderBottom: idx < data.projectRevenues.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}
                      >
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '14px', 
                          color: '#334155',
                          fontWeight: 500 
                        }}>
                          {project.project_name}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '14px', 
                          color: '#64748b',
                          textAlign: 'right' 
                        }}>
                          {formatNumber(project.impressions)}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '14px', 
                          color: '#2563eb',
                          textAlign: 'right' 
                        }}>
                          {formatNumber(project.total_tokens)}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          fontSize: '14px', 
                          color: '#10b981',
                          textAlign: 'right',
                          fontWeight: 600 
                        }}>
                          {formatCurrency(project.net_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* No Data State */}
          {data.projectRevenues.length === 0 && (
            <Card>
              <div style={{ 
                textAlign: 'center', 
                padding: '48px 24px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                  💰
                </div>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#334155', 
                  marginBottom: '8px' 
                }}>
                  No Revenue Data
                </h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                  Revenue tracking begins once your widgets start generating ad impressions and AI interactions.
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
