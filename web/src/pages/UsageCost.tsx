import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- Pricing Constants ---
const INPUT_TOKEN_COST = 1.75 / 1_000_000;  // $1.75 per 1M tokens
const OUTPUT_TOKEN_COST = 14.0 / 1_000_000; // $14.00 per 1M tokens

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
    maximumFractionDigits: 4,
  }).format(num);
};

// --- Interfaces ---

interface DailyUsage {
  usage_date: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  request_count: number;
}

interface ProjectUsage {
  project_id: string;
  client_name?: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  request_count: number;
  cost: number;
}

interface UsageData {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  dailyData: DailyUsage[];
  projectData: ProjectUsage[];
  debugInfo?: string;
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

const CpuIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
    <rect x="9" y="9" width="6" height="6"></rect>
    <line x1="9" y1="1" x2="9" y2="4"></line>
    <line x1="15" y1="1" x2="15" y2="4"></line>
    <line x1="9" y1="20" x2="9" y2="23"></line>
    <line x1="15" y1="20" x2="15" y2="23"></line>
    <line x1="20" y1="9" x2="23" y2="9"></line>
    <line x1="20" y1="14" x2="23" y2="14"></line>
    <line x1="1" y1="9" x2="4" y2="9"></line>
    <line x1="1" y1="14" x2="4" y2="14"></line>
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
  dataKey = 'cost',
  color = '#3b82f6'
}: { 
  data: any[]; 
  dataKey?: 'cost' | 'tokens' | 'requests';
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

  const getValue = (item: any) => {
    switch (dataKey) {
      case 'cost':
        return (item.total_input_tokens * INPUT_TOKEN_COST) + (item.total_output_tokens * OUTPUT_TOKEN_COST);
      case 'tokens':
        return item.total_tokens;
      case 'requests':
        return item.request_count;
      default:
        return 0;
    }
  };

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
        let value = '';
        if (dataKey === 'cost') {
          value = formatCurrency(point.value);
        } else if (dataKey === 'tokens') {
          value = formatNumber(point.value) + ' tokens';
        } else {
          value = formatNumber(point.value) + ' requests';
        }
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
      data: data.map(d => d.usage_date),
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
        formatter: (value: number) => {
          if (dataKey === 'cost') return '$' + value.toFixed(2);
          return formatNumber(value);
        }
      }
    },
    series: [{
      type: 'line',
      data: data.map(getValue),
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

export default function UsageCost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UsageData | null>(null);
  const navigate = useNavigate();

  // Calculate default date range (month to date)
  const getDefaultDateRange = () => {
    const end = new Date();
    end.setHours(end.getHours() + 12); // Add 12 hours to ensure we capture current day's data
    const start = new Date(end.getFullYear(), end.getMonth(), 1); // First day of current month
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
    if (isLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
  }, [user, isAdmin, isLoading, navigate]);

  // Fetch usage data
  const fetchUsageData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching usage data from', dateRange.start, 'to', dateRange.end);
      
      // First, check if there's ANY data in the table (without date filter)
      const { count: totalCount, error: countError } = await supabase
        .from('token_usage')
        .select('*', { count: 'exact', head: true });
      
      console.log('Total records in token_usage table:', totalCount, 'Error:', countError);
      
      if (countError) {
        console.error('Error checking table:', countError);
        throw new Error(`Database error: ${countError.message}. This might be an RLS (Row Level Security) issue.`);
      }
      
      if (totalCount === null) {
        console.warn('Could not get table count - proceeding anyway');
      } else if (totalCount === 0) {
        console.log('Table is empty - no token usage has been recorded yet');
        setData({
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          totalCost: 0,
          totalRequests: 0,
          dailyData: [],
          projectData: [],
        });
        setLoading(false);
        return;
      }
      
      // Fetch daily aggregated data
      // Add 1 day to end date to include all records on the end date (since dates are compared at midnight)
      const endDatePlusOne = new Date(dateRange.end);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      const endDateInclusive = endDatePlusOne.toISOString().split('T')[0];
      
      const { data: dailyData, error: dailyError, count } = await supabase
        .from('token_usage')
        .select('created_at, input_tokens, output_tokens, total_tokens, project_id', { count: 'exact' })
        .gte('created_at', dateRange.start)
        .lt('created_at', endDateInclusive)
        .order('created_at', { ascending: true });

      console.log('Query result:', { count, dataLength: dailyData?.length, error: dailyError });

      if (dailyError) {
        console.error('Supabase error:', dailyError);
        throw dailyError;
      }

      if (!dailyData || dailyData.length === 0) {
        console.log('No token usage data found for date range');
        setData({
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          totalCost: 0,
          totalRequests: 0,
          dailyData: [],
          projectData: [],
        });
        setLoading(false);
        return;
      }

      // Aggregate by date
      const dailyMap = new Map<string, DailyUsage>();
      const projectMap = new Map<string, ProjectUsage>();

      dailyData?.forEach(row => {
        const date = new Date(row.created_at).toISOString().split('T')[0];
        
        // Daily aggregation
        const dayEntry = dailyMap.get(date) || {
          usage_date: date,
          total_input_tokens: 0,
          total_output_tokens: 0,
          total_tokens: 0,
          request_count: 0,
        };
        
        dayEntry.total_input_tokens += row.input_tokens || 0;
        dayEntry.total_output_tokens += row.output_tokens || 0;
        dayEntry.total_tokens += row.total_tokens || 0;
        dayEntry.request_count += 1;
        dailyMap.set(date, dayEntry);

        // Project aggregation
        const projectEntry = projectMap.get(row.project_id) || {
          project_id: row.project_id,
          total_input_tokens: 0,
          total_output_tokens: 0,
          total_tokens: 0,
          request_count: 0,
          cost: 0,
        };
        
        projectEntry.total_input_tokens += row.input_tokens || 0;
        projectEntry.total_output_tokens += row.output_tokens || 0;
        projectEntry.total_tokens += row.total_tokens || 0;
        projectEntry.request_count += 1;
        projectEntry.cost = (projectEntry.total_input_tokens * INPUT_TOKEN_COST) + 
                           (projectEntry.total_output_tokens * OUTPUT_TOKEN_COST);
        projectMap.set(row.project_id, projectEntry);
      });

      const dailyArray = Array.from(dailyMap.values()).sort((a, b) => 
        a.usage_date.localeCompare(b.usage_date)
      );

      const projectArray = Array.from(projectMap.values()).sort((a, b) => 
        b.cost - a.cost
      );

      // Calculate totals
      const totalInputTokens = dailyArray.reduce((sum, d) => sum + d.total_input_tokens, 0);
      const totalOutputTokens = dailyArray.reduce((sum, d) => sum + d.total_output_tokens, 0);
      const totalTokens = totalInputTokens + totalOutputTokens;
      const totalCost = (totalInputTokens * INPUT_TOKEN_COST) + (totalOutputTokens * OUTPUT_TOKEN_COST);
      const totalRequests = dailyArray.reduce((sum, d) => sum + d.request_count, 0);

      // Fetch project names
      if (projectArray.length > 0) {
        const projectIds = projectArray.map(p => p.project_id);
        const { data: projects } = await supabase
          .from('project')
          .select('project_id, client_name')
          .in('project_id', projectIds);

        projects?.forEach(project => {
          const entry = projectArray.find(p => p.project_id === project.project_id);
          if (entry) {
            entry.client_name = project.client_name;
          }
        });
      }

      setData({
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
        totalCost,
        totalRequests,
        dailyData: dailyArray,
        projectData: projectArray,
      });
    } catch (err) {
      console.error('Failed to fetch usage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when date range changes
  useEffect(() => {
    if (user && isAdmin) {
      fetchUsageData();
    }
  }, [user, isAdmin]);

  // Don't render until admin check is complete
  if (isLoading || !user) {
    return <div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  // Handle date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, start: e.target.value }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, end: e.target.value }));
  };

  // Quick presets
  const setMonthToDate = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  const isMonthToDateActive = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    return dateRange.start === start.toISOString().split('T')[0] &&
           dateRange.end === end.toISOString().split('T')[0];
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

  return (
    <div style={{ 
      fontFamily: 'var(--font-display)', 
      padding: '0 clamp(16px, 4vw, 24px) 48px', 
      color: '#334155' 
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Usage & Costs
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px' }}>
          AI API token usage and cost analysis (GPT-5.2 pricing)
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
          onClick={setMonthToDate} 
          style={{ 
            ...btnStyle, 
            border: isMonthToDateActive() ? '1px solid #2563eb' : '1px solid #e2e8f0', 
            color: isMonthToDateActive() ? '#2563eb' : '#334155' 
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
          onClick={fetchUsageData} 
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
          {/* Summary Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '24px',
            marginBottom: '32px'
          }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: '#f1f5f9', 
                  color: '#64748b',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <DollarIcon />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    Total Cost
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                    {formatCurrency(data.totalCost)}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: '#f1f5f9', 
                  color: '#64748b',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CpuIcon />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    Total Tokens
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                    {formatNumber(data.totalTokens)}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: '#f1f5f9', 
                  color: '#64748b',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <ChartIcon />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    API Requests
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                    {formatNumber(data.totalRequests)}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: '#f1f5f9', 
                  color: '#64748b',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <DollarIcon />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                    Avg Cost/Request
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
                    {formatCurrency(data.totalRequests > 0 ? data.totalCost / data.totalRequests : 0)}
                  </div>
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
            <Card title="Cost Over Time">
              <TrendChart data={data.dailyData} dataKey="cost" color="#2563eb" />
            </Card>

            <Card title="Token Usage Over Time">
              <TrendChart data={data.dailyData} dataKey="tokens" color="#2563eb" />
            </Card>
          </div>

          {/* Token Breakdown */}
          <Card title="Token Breakdown" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  Input Tokens
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  {formatNumber(data.totalInputTokens)}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {formatCurrency(data.totalInputTokens * INPUT_TOKEN_COST)} 
                  <span style={{ color: '#94a3b8' }}> @ ${INPUT_TOKEN_COST * 1_000_000}/1M</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                  Output Tokens
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                  {formatNumber(data.totalOutputTokens)}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {formatCurrency(data.totalOutputTokens * OUTPUT_TOKEN_COST)}
                  <span style={{ color: '#94a3b8' }}> @ ${OUTPUT_TOKEN_COST * 1_000_000}/1M</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Project Breakdown */}
          {data.projectData.length > 0 && (
            <Card title="Cost by Project">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                        Project
                      </th>
                      <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                        Requests
                      </th>
                      <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                        Tokens
                      </th>
                      <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projectData.map((project, idx) => (
                      <tr key={project.project_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>
                            {project.client_name || project.project_id}
                          </div>
                          {project.client_name && (
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                              {project.project_id}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                          {formatNumber(project.request_count)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                          {formatNumber(project.total_tokens)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                          {formatCurrency(project.cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && data && data.totalRequests === 0 && (
        <Card>
          <div style={{ 
            padding: '48px', 
            textAlign: 'center', 
            color: '#64748b' 
          }}>
            <CpuIcon />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '16px 0 8px' }}>
              No Token Usage Data
            </h3>
            <p style={{ margin: 0 }}>
              No API calls have been made in the selected date range ({dateRange.start} to {dateRange.end}).
            </p>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '12px' }}>
              Token usage is tracked automatically when visitors use the chat or suggestions features.
            </p>
          </div>
        </Card>
      )}

      {/* Empty State - Never fetched */}
      {!loading && !error && !data && (
        <Card>
          <div style={{ 
            padding: '48px', 
            textAlign: 'center', 
            color: '#64748b' 
          }}>
            <CpuIcon />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#334155', margin: '16px 0 8px' }}>
              No Usage Data
            </h3>
            <p style={{ margin: 0 }}>
              Select a date range and click Apply to view usage data
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
