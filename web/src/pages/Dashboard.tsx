import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// --- Icons ---



const CalendarIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

// --- Helper Components ---

function Card({ children, style = {}, title, action, className = '' }: { children: React.ReactNode, style?: React.CSSProperties, title?: string, action?: React.ReactNode, className?: string }) {
  return (
    <div 
      className={className} 
      style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          {title && <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

function TrendChart({ data: timelineData }: { data: any[] }) {
    const chartData = timelineData.length > 0 ? timelineData.map((d: any) => d.count) : [0];
    const labels = timelineData.length > 0 ? timelineData.map((d: any) => {
        const date = new Date(d.date);
        return d.date && d.date.includes('T') && d.date.length > 10 
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) : [];
    
    const option = {
        grid: { left: 0, right: 0, top: 10, bottom: 20 },
        xAxis: { 
            type: 'category',
            data: labels,
            show: true,
            axisLabel: {
                show: true,
                color: '#94a3b8',
                fontSize: 10,
                interval: Math.max(0, Math.floor(labels.length / 4) - 1),
            },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        yAxis: { type: 'value', show: false },
        series: [{
            data: chartData,
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#2563eb', width: 2 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(37, 99, 235, 0.2)' },
                        { offset: 1, color: 'rgba(37, 99, 235, 0)' }
                    ]
                }
            }
        }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1e293b',
            borderWidth: 0,
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                const index = params[0].dataIndex;
                const label = labels[index] || '';
                return `${label}<br/>${params[0].value}`;
            }
        }
    };

    return (
        <div style={{ height: '96px', width: '100%', marginTop: 'auto' }}>
            {timelineData.length > 0 ? (
              <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '12px' }}>
                No data
              </div>
            )}
        </div>
    )
}

function ImpressionsMap({ locations }: { locations: any[] }) {
    if (locations.length === 0) {
        return (
            <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No location data available
            </div>
        );
    }
    
    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }}>
             <MapContainer 
                center={[20, 0]} 
                zoom={2} 
                style={{ height: '100%', width: '100%' }} 
                scrollWheelZoom={false}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                {locations.map((loc, i) => (
                    <CircleMarker 
                        key={i} 
                        center={[loc.latitude || 0, loc.longitude || 0]} 
                        pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.6, weight: 0 }}
                        radius={Math.max(4, Math.min(20, Math.sqrt(loc.count || 0) * 4))}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'var(--font-display)', color: '#1e293b' }}>
                                <strong>{loc.city || 'Unknown'}, {loc.country || ''}</strong><br/>
                                {loc.count} impressions
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    )
}


function DailyInteractionsChart({ data: timelineData }: { data: any[] }) {
    const chartData = timelineData.length > 0 ? timelineData.map((d: any) => d.count) : [0];
    const labels = timelineData.length > 0 ? timelineData.map((d: any) => {
        const date = new Date(d.date);
        return d.date && d.date.includes('T') && d.date.length > 10 
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }) : [''];
    
    const option = {
        grid: { left: 10, right: 10, top: 20, bottom: 30 },
        xAxis: {
            type: 'category',
            data: labels,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 11 }
        },
        yAxis: {
            type: 'value',
            show: false
        },
        series: [{
            data: chartData,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
                color: '#2563eb',
                borderColor: '#2563eb',
                borderWidth: 2
            },
            lineStyle: { color: '#2563eb', width: 3 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(37, 99, 235, 0.25)' },
                        { offset: 1, color: 'rgba(37, 99, 235, 0)' }
                    ]
                }
            }
        }],
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1e293b',
            borderWidth: 0,
            textStyle: { color: '#fff' },
            formatter: (params: any) => `${params[0].value} interactions`
        }
    };

    return (
        <div style={{ height: '160px', width: '100%', marginTop: '16px' }}>
             {timelineData.length > 0 ? (
               <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
             ) : (
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '14px' }}>
                 No data available
               </div>
             )}
        </div>
    )
}

function PlatformsChart({ data }: { data: any[] }) {
    const sorted = [...data].sort((a, b) => b.count - a.count);
    const top = sorted.slice(0, 4);
    const other = sorted.slice(4).reduce((sum, item) => sum + item.count, 0);
    
    const formatLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const finalData = other > 0 ? [...top, { platform: 'Other', count: other }] : top;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#64748b'];

    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1e293b',
            borderWidth: 0,
            textStyle: { color: '#fff' },
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            bottom: 10,
            left: 'center',
            itemWidth: 8,
            itemHeight: 8,
            icon: 'circle',
            textStyle: { fontSize: 11 }
        },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            center: ['50%', '45%'],
            data: finalData.map((d, i) => ({
                value: d.count,
                name: formatLabel(d.platform),
                itemStyle: { color: colors[i] }
            })),
            label: { show: false },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.2)'
                }
            }
        }]
    };

    return (
        <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {data.length > 0 ? (
                <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
            ) : (
                <div style={{color: '#94a3b8', fontSize: '14px'}}>No data</div>
            )}
        </div>
    );
}

function FunnelView({ impressions, suggestions, questions }: { impressions: number, suggestions: number, questions: number }) {
    const total = impressions || 1;
    
    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: '#1e293b',
            borderWidth: 0,
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                const prevValue = params.dataIndex === 1 ? impressions : params.dataIndex === 2 ? suggestions : null;
                const conversionRate = prevValue 
                    ? `<br/>Conversion: ${Math.round(params.value / prevValue * 100)}%`
                    : '';
                return `${params.name}<br/>Count: ${params.value.toLocaleString()}${conversionRate}`;
            }
        },
        series: [{
            type: 'funnel',
            left: '5%',
            right: '5%',
            top: 30,
            bottom: 30,
            minSize: '30%',
            maxSize: '100%',
            sort: 'descending',
            gap: 10,
            label: {
                show: true,
                position: 'inside',
                formatter: (params: any) => {
                    const percent = Math.round((params.value / total) * 100);
                    return `{name|${params.name}}\n{value|${params.value.toLocaleString()}} {percent|(${percent}%)}`;
                },
                rich: {
                    name: {
                        fontSize: 13,
                        fontWeight: 'normal',
                        color: '#fff',
                        lineHeight: 20
                    },
                    value: {
                        fontSize: 24,
                        fontWeight: 'normal',
                        color: '#fff',
                        lineHeight: 32
                    },
                    percent: {
                        fontSize: 12,
                        fontWeight: 'normal',
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: 32
                    }
                }
            },
            labelLine: { show: false },
            itemStyle: {
                borderWidth: 0
            },
            emphasis: {
                label: {
                    fontSize: 14
                }
            },
            data: [
                { value: impressions, name: 'Impressions', itemStyle: { color: '#3b82f6' } },
                { value: suggestions, name: 'Suggestions', itemStyle: { color: '#8b5cf6' } },
                { value: questions, name: 'Questions', itemStyle: { color: '#ec4899' } }
            ]
        }]
    };

    return (
        <div style={{ height: '300px', width: '100%', padding: '10px 0' }}>
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'svg' }} />
        </div>
    );
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const navigate = useNavigate()
  
  // Calculate default date range (last 7 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [isLast24Hours, setIsLast24Hours] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({
    totalInteractions: null,
    impressionsByWidget: null,
    impressionsByLocation: null,
    interactionsOverTime: null,
    impressionsOverTime: null,
    impressionsByPlatform: null,
    adImpressions: null
  });
  const [articlesCount, setArticlesCount] = useState<number>(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Fetch stats from edge function
  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        return;
      }

      const baseUrl = 'https://srv.divee.ai/functions/v1/stats';
      
      let startDate, endDate;
      
      if (isLast24Hours) {
         const end = new Date();
         const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
         startDate = start.toISOString();
         endDate = end.toISOString();
      } else {
         // Format dates with time component for proper filtering
         startDate = `${dateRange.start}T00:00:00`;
         endDate = `${dateRange.end}T23:59:59`;
      }
      
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });
      
      // Add project_id if a project is selected
      if (selectedProject) {
        params.append('project_id', selectedProject);
      }
      
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      };

      // Fetch all endpoints independently
      const fetchEndpoint = async (endpoint: string, key: string) => {
        try {
          const res = await fetch(`${baseUrl}/${endpoint}?${params}`, { 
            method: 'GET',
            headers 
          });
          const data = await res.json();
          setStats((prev: any) => ({ ...prev, [key]: data }));
        } catch (error) {
          console.error(`Failed to fetch ${key}:`, error);
        }
      };

      await Promise.all([
        fetchEndpoint('total-interactions', 'totalInteractions'),
        fetchEndpoint('impressions-by-widget', 'impressionsByWidget'),
        fetchEndpoint('impressions-by-location', 'impressionsByLocation'),
        fetchEndpoint('interactions-over-time', 'interactionsOverTime'),
        fetchEndpoint('impressions-over-time', 'impressionsOverTime'),
        fetchEndpoint('impressions-by-platform', 'impressionsByPlatform'),
        fetchEndpoint('ad-impressions', 'adImpressions')
      ]);
      
      // Fetch articles count
      let articlesQuery = supabase
        .from('article')
        .select('*', { count: 'exact', head: true });
      
      if (selectedProject) {
        // Filter by selected project
        articlesQuery = articlesQuery.eq('project_id', selectedProject);
      } else {
        // Filter by all user's projects
        articlesQuery = articlesQuery.in('project_id', [
          ...(await supabase
            .from('project')
            .select('project_id')
            .in('account_id', [
              ...(await supabase
                .from('account')
                .select('id')
                .eq('user_id', session.user.id)
              ).data?.map(a => a.id) || []
            ])
          ).data?.map(p => p.project_id) || []
        ]);
      }
      
      const { count } = await articlesQuery;
      setArticlesCount(count || 0);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login')
      } else {
        setUser(session.user)
        // Check if user has accounts
        checkAccounts(session.user.id)
      }
    })
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          navigate('/login')
        } else {
          setUser(session?.user ?? null)
          if (session?.user) {
            checkAccounts(session.user.id)
          }
          fetchStats()
        }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  // Check if user has accounts
  const checkAccounts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
      
      if (error) {
        console.error('Error checking accounts:', error)
        return
      }
      
      if (!data || data.length === 0) {
        // No accounts, show welcome modal
        setHasAccounts(false)
        setShowWelcomeModal(true)
      } else {
        setHasAccounts(true)
      }
    } catch (error) {
      console.error('Failed to check accounts:', error)
    }
  }
  
  // Fetch projects for filter
  const fetchProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: accounts } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', session.user.id);
      
      if (!accounts || accounts.length === 0) return;
      
      const { data: projectData } = await supabase
        .from('project')
        .select('project_id, client_name, icon_url')
        .in('account_id', accounts.map(a => a.id))
        .order('client_name');
      
      setProjects(projectData || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };
  
  // Fetch stats on mount
  useEffect(() => {
    if (user && hasAccounts) {
      fetchProjects();
      fetchStats();
    }
  }, [hasAccounts])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showProjectDropdown) {
        setShowProjectDropdown(false);
        setProjectSearch('');
      }
    };
    
    if (showProjectDropdown) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProjectDropdown]);

  // Auto-fetch when filters change
  useEffect(() => {
    if (user && hasAccounts) {
      fetchStats();
    }
  }, [selectedProject, dateRange, isLast24Hours]);

  if (!user || hasAccounts === null) return null

  // Used for greeting
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  
  // Handle date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLast24Hours(false);
    setDateRange(prev => ({ ...prev, start: e.target.value }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLast24Hours(false);
    setDateRange(prev => ({ ...prev, end: e.target.value }));
  };

  // Quick date range presets
  const setPreset = (days: number) => {
    setIsLast24Hours(false);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };
  
  const setLast24Hours = () => {
    setIsLast24Hours(true);
    // UI hack: set range to [Yesterday, Today] so inputs imply recent
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 1);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };
  
  // Check if a preset is active
  const isPresetActive = (days: number) => {
    if (isLast24Hours) return false;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return dateRange.start === start.toISOString().split('T')[0] && 
           dateRange.end === end.toISOString().split('T')[0];
  };

  const btnStyle = {
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
  }
  
  // Derived stats
  const totalSuggestions = stats.totalInteractions?.breakdown?.find((b: any) => b.type === 'get_suggestions')?.count || 0;
  const totalQuestions = stats.totalInteractions?.breakdown?.find((b: any) => b.type === 'ask_question')?.count || 0;
  const totalImpressions = stats.impressionsByWidget?.widgets?.reduce((sum: number, w: any) => sum + w.impressions, 0) ?? 0;

  return (
    <div style={{ 
      fontFamily: 'var(--font-display)', 
      padding: '0 clamp(16px, 4vw, 24px) 48px', 
      color: '#334155' 
    }}>
      
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(79, 70, 229))',
              borderRadius: 24,
              boxShadow: '0 40px 90px rgba(79, 70, 229, 0.4)',
              maxWidth: '500px',
              width: '100%',
              padding: '48px 40px',
              textAlign: 'center',
              color: '#ffffff'
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 16px 0', color: '#ffffff' }}>
              Welcome to Divee.AI!
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 32px 0', color: 'rgba(255, 255, 255, 0.9)' }}>
              To get started, you'll need to create an account to organize your widgets. 
              This helps you manage multiple projects and track analytics separately.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/accounts', { state: { openCreateForm: true } })}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  background: '#ffffff',
                  color: 'rgb(79, 70, 229)',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
              >
                Create Your First Account
              </button>
              <button
                onClick={() => setShowWelcomeModal(false)}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
              >
                I'll do it later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Hello, {displayName}!
        </h1>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap', flex: 1, overflow: 'visible' }}>
           {/* Date Range Picker */}
           <div style={{ 
             display: 'flex', 
             gap: '8px', 
             alignItems: 'center', 
             background: '#fff', 
             padding: '8px 12px', 
             borderRadius: '999px', 
             border: '1px solid #e2e8f0',
             flexShrink: 0
           }}>
             <CalendarIcon />
             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}>
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
                   width: 'clamp(90px, 20vw, 110px)',
                   minWidth: 0,
                   cursor: 'pointer'
                 }}
               />
             </label>
             <span style={{ color: '#94a3b8', flexShrink: 0 }}>→</span>
             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}>
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
                   width: 'clamp(90px, 20vw, 110px)',
                   minWidth: 0,
                   cursor: 'pointer'
                 }}
               />
             </label>
           </div>
           
           {/* Project Filter */}
           <div style={{ position: 'relative' }}>
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setShowProjectDropdown(!showProjectDropdown);
               }}
               style={{
                 ...btnStyle,
                 minWidth: '120px',
                 justifyContent: 'space-between'
               }}
             >
               <span style={{ flex: 1, textAlign: 'left' }}>
                 {selectedProject ? projects.find(p => p.project_id === selectedProject)?.client_name || 'All Widgets' : 'All Widgets'}
               </span>
               <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0 }}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
               </svg>
             </button>
             {showProjectDropdown && (
               <div 
                 onMouseDown={(e) => e.preventDefault()}
                 style={{
                   position: 'absolute',
                   top: '100%',
                   left: 0,
                   minWidth: '240px',
                   marginTop: '4px',
                   background: '#fff',
                   border: '1px solid #e2e8f0',
                   borderRadius: '12px',
                   boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                   maxHeight: '280px',
                   overflowY: 'auto',
                   zIndex: 9999
                 }}>
                 {/* Search Input */}
                 <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
                   <input
                     type="text"
                     placeholder="Search widgets..."
                     value={projectSearch}
                     onChange={(e) => setProjectSearch(e.target.value)}
                     autoFocus
                     style={{
                       width: '100%',
                       padding: '8px 12px',
                       border: '1px solid #e2e8f0',
                       borderRadius: '8px',
                       fontSize: '14px',
                       outline: 'none',
                       background: '#f8fafc'
                     }}
                     onFocus={(e) => e.stopPropagation()}
                     onMouseDown={(e) => e.stopPropagation()}
                   />
                 </div>
                 
                 {/* Options */}
                 <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                   <div 
                     onMouseDown={(e) => {
                       e.preventDefault();
                       setSelectedProject('');
                       setProjectSearch('');
                       setShowProjectDropdown(false);
                     }}
                     style={{
                       padding: '10px 12px',
                       cursor: 'pointer',
                       fontSize: '14px',
                       color: selectedProject === '' ? '#2563eb' : '#334155',
                       fontWeight: selectedProject === '' ? 600 : 400,
                       background: selectedProject === '' ? '#f0f9ff' : 'transparent'
                     }}
                     onMouseEnter={(e) => { if (selectedProject !== '') e.currentTarget.style.background = '#f8fafc'; }}
                     onMouseLeave={(e) => { if (selectedProject !== '') e.currentTarget.style.background = 'transparent'; }}
                   >
                     All Widgets
                   </div>
                   {projects
                     .filter(p => p.client_name.toLowerCase().includes(projectSearch.toLowerCase()))
                     .map(project => (
                       <div
                         key={project.project_id}
                         onMouseDown={(e) => {
                           e.preventDefault();
                           setSelectedProject(project.project_id);
                           setProjectSearch('');
                           setShowProjectDropdown(false);
                         }}
                         style={{
                           padding: '10px 12px',
                           cursor: 'pointer',
                           fontSize: '14px',
                           color: selectedProject === project.project_id ? '#2563eb' : '#334155',
                           fontWeight: selectedProject === project.project_id ? 600 : 400,
                           background: selectedProject === project.project_id ? '#f0f9ff' : 'transparent',
                           display: 'flex',
                           alignItems: 'center',
                           gap: '8px'
                         }}
                       onMouseEnter={(e) => { if (selectedProject !== project.project_id) e.currentTarget.style.background = '#f8fafc'; }}
                       onMouseLeave={(e) => { if (selectedProject !== project.project_id) e.currentTarget.style.background = 'transparent'; }}
                     >
                       {project.icon_url && (
                         <img src={project.icon_url} alt="" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                       )}
                       {project.client_name}
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </div>
           
           {/* Quick Presets */}
           <button onClick={() => setLast24Hours()} style={{ ...btnStyle, border: isLast24Hours ? '1px solid #2563eb' : '1px solid #e2e8f0', color: isLast24Hours ? '#2563eb' : '#334155' }}>
             24h
           </button>
           <button onClick={() => setPreset(7)} style={{ ...btnStyle, border: isPresetActive(7) ? '1px solid #2563eb' : '1px solid #e2e8f0', color: isPresetActive(7) ? '#2563eb' : '#334155' }}>
             7 days
           </button>
           <button onClick={() => setPreset(30)} style={{ ...btnStyle, border: isPresetActive(30) ? '1px solid #2563eb' : '1px solid #e2e8f0', color: isPresetActive(30) ? '#2563eb' : '#334155' }}>
             30 days
           </button>
           
           {/* Apply Button */}
           <button 
             onClick={fetchStats} 
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
      </div>

      {/* Grid Layout */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', 
        gap: 'clamp(16px, 3vw, 24px)'
      }}>
        
        {/* Row 1: Key Metrics */}
        <div style={{ gridColumn: window.innerWidth >= 900 ? 'span 2' : 'span 1', minWidth: 0 }}>
            <Card title="Total Impressions" style={{ height: '100%' }} action={<button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>−</button>}>
                {(!stats.impressionsByWidget || !stats.impressionsOverTime) ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
                ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                        {totalImpressions}
                        </span>
                    </div>
                    {/* Hide static labels, TrendChart handles axis now implicitly by shape, or we can improve it later */}
                    <TrendChart data={stats.impressionsOverTime?.timeline || []} />
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                        {/* Simple dynamic labels if data exists, otherwise placeholders or just hide */}
                        {stats.impressionsOverTime?.timeline?.length > 0 && stats.impressionsOverTime?.timeline[0].date.length > 10 ? (
                           <>
                             <span>{new Date(stats.impressionsOverTime.timeline[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             <span>{new Date(stats.impressionsOverTime.timeline[stats.impressionsOverTime.timeline.length - 1].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </>
                        ) : (
                          <>
                             <span>{stats.impressionsOverTime?.timeline?.[0] ? new Date(stats.impressionsOverTime.timeline[0].date).toLocaleDateString('en-US', { weekday: 'short' }) : ''}</span>
                             <span>{stats.impressionsOverTime?.timeline?.length > 1 ? new Date(stats.impressionsOverTime.timeline[stats.impressionsOverTime.timeline.length - 1].date).toLocaleDateString('en-US', { weekday: 'short' }) : ''}</span>
                          </>
                        )}
                     </div>
                     <p style={{ fontSize: '13px', color: '#64748b', marginTop: '16px', marginBottom: 0, lineHeight: '1.5' }}>
                        Number of times the widget was rendered on a page
                     </p>
                </>
                )}
            </Card>
        </div>

        <div style={{ gridColumn: window.innerWidth >= 900 ? 'span 2' : 'span 1', minWidth: 0 }}>
            <Card title="Total Interactions" style={{ height: '100%' }} action={<button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>−</button>}>
                {(!stats.totalInteractions || !stats.interactionsOverTime) ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                        {stats.totalInteractions?.total ?? 0}
                        </span>
                    </div>
                    <TrendChart data={stats.interactionsOverTime?.timeline || []} />
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                        {stats.interactionsOverTime?.timeline?.length > 0 && stats.interactionsOverTime?.timeline[0].date.length > 10 ? (
                           <>
                             <span>{new Date(stats.interactionsOverTime.timeline[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             <span>{new Date(stats.interactionsOverTime.timeline[stats.interactionsOverTime.timeline.length - 1].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </>
                        ) : (
                          <>
                             <span>{stats.interactionsOverTime?.timeline?.[0] ? new Date(stats.interactionsOverTime.timeline[0].date).toLocaleDateString('en-US', { weekday: 'short' }) : ''}</span>
                             <span>{stats.interactionsOverTime?.timeline?.length > 1 ? new Date(stats.interactionsOverTime.timeline[stats.interactionsOverTime.timeline.length - 1].date).toLocaleDateString('en-US', { weekday: 'short' }) : ''}</span>
                          </>
                        )}
                     </div>
                     <p style={{ fontSize: '13px', color: '#64748b', marginTop: '16px', marginBottom: 0, lineHeight: '1.5' }}>
                        User that actually requested suggestions from the widget.
                     </p>
                  </>
                )}
            </Card>
        </div>

        <div style={{ gridColumn: window.innerWidth >= 900 ? 'span 2' : 'span 1', minWidth: 0 }}>
            <Card title="Ad Impressions" style={{ height: '100%' }} action={<button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>−</button>}>
                {!stats.adImpressions ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                        {stats.adImpressions?.total ?? 0}
                        </span>
                    </div>
                    <TrendChart data={stats.adImpressions?.timeline || []} />
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                        {stats.adImpressions?.timeline?.length > 0 && stats.adImpressions?.timeline[0].date.length > 10 ? (
                           <>
                             <span>{new Date(stats.adImpressions.timeline[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             <span>{new Date(stats.adImpressions.timeline[stats.adImpressions.timeline.length - 1].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </>
                        ) : (
                          <>
                             <span>{stats.adImpressions?.timeline?.[0] ? new Date(stats.adImpressions.timeline[0].date).toLocaleDateString('en-US', { weekday: 'short' }) : ''}</span>
                             <span>{stats.adImpressions?.timeline?.length > 1 ? new Date(stats.adImpressions.timeline[stats.adImpressions.timeline.length - 1].date).toLocaleDateString('en-US', { weekday: 'short' }) : ''}</span>
                          </>
                        )}
                     </div>
                     <p style={{ fontSize: '13px', color: '#64748b', marginTop: '16px', marginBottom: 0, lineHeight: '1.5' }}>
                        Number of times ads were displayed within the widget interface
                     </p>
                  </>
                )}
            </Card>
        </div>

        {/* Row 2: Funnel & Breakdown */}
        <div style={{ gridColumn: window.innerWidth >= 900 ? 'span 2' : 'span 1', minWidth: 0 }}>
             <Card title="User Engagement" style={{ height: '100%' }}>
                 <div style={{ 
                     display: 'grid', 
                     gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                     gap: '16px', 
                     marginTop: '16px' 
                 }}>
                     {/* Suggestions */}
                     <div style={{ 
                         display: 'flex', 
                         flexDirection: 'column', 
                         padding: '20px', 
                         background: '#fff', 
                         borderRadius: '12px',
                         border: '1px solid #e2e8f0'
                     }}>
                         <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
                             Suggestions
                         </div>
                         <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                             {loading ? '...' : totalSuggestions}
                         </div>
                         <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                             Requested by users
                         </div>
                     </div>
                     
                     {/* Questions */}
                     <div style={{ 
                         display: 'flex', 
                         flexDirection: 'column', 
                         padding: '20px', 
                         background: '#fff', 
                         borderRadius: '12px',
                         border: '1px solid #e2e8f0'
                     }}>
                         <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
                             Questions
                         </div>
                         <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                             {loading ? '...' : totalQuestions}
                         </div>
                         <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                             Questions Asked
                         </div>
                     </div>
                     
                     {/* Articles */}
                     <div style={{ 
                         display: 'flex', 
                         flexDirection: 'column', 
                         padding: '20px', 
                         background: '#fff', 
                         borderRadius: '12px',
                         border: '1px solid #e2e8f0'
                     }}>
                         <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>
                             Articles
                         </div>
                         <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                             {loading ? '...' : articlesCount}
                         </div>
                         <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                             Embedded articles
                         </div>
                     </div>
                 </div>
                 <p style={{ fontSize: '13px', color: '#64748b', marginTop: '20px', marginBottom: 0, lineHeight: '1.5' }}>
                    Breakdown of user interactions: suggestions requested, questions asked, and number of articles with the widget successfully installed.
                 </p>
             </Card>
        </div>

        <div style={{ gridColumn: 'span 1', minWidth: 0 }}>
             <Card title="Conversion Funnel" style={{ height: '100%' }}>
                 {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #f3f4f6', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                 ) : (
                    <>
                      <FunnelView 
                          impressions={totalImpressions}
                          suggestions={totalSuggestions}
                          questions={totalQuestions}
                      />
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', marginBottom: 0, lineHeight: '1.5' }}>
                          User journey from initial widget view to deeper engagement with questions
                      </p>
                    </>
                 )}
             </Card>
        </div>

        <div style={{ gridColumn: 'span 1', minWidth: 0 }}>
             <Card title="Platforms" style={{ height: '100%' }}>
                {(!stats.impressionsByPlatform) ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #f3f4f6', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                ) : (
                  <>
                    <PlatformsChart data={stats.impressionsByPlatform?.platforms || []} />
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '12px', marginBottom: 0, lineHeight: '1.5' }}>
                        Distribution of widget impressions across different devices and platforms
                    </p>
                  </>
                )}
             </Card>
        </div>
        
        {/* Row 3: Map & Lists */}
        <div style={{ gridColumn: window.innerWidth >= 900 ? 'span 2' : 'span 1', minWidth: 0 }}>
            <Card title="Impressions by Location" style={{ height: '100%' }}>
                {!stats.impressionsByLocation ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                ) : (
                  <>
                    <ImpressionsMap locations={stats.impressionsByLocation?.locations || []} />
                    <p style={{ fontSize: '13px', color: '#64748b', marginTop: '16px', marginBottom: 0, lineHeight: '1.5' }}>
                        Geographic distribution of widget impressions based on user locations
                    </p>
                  </>
                )}
            </Card>
        </div>
        
        <div style={{ gridColumn: 'span 1', minWidth: 0 }}>
        <Card title="Top Widgets" action={<button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>−</button>} style={{ height: '100%' }}>
             {!stats.impressionsByWidget ? (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                 <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
               </div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
                  {(stats.impressionsByWidget?.widgets || []).sort((a: any, b: any) => b.impressions - a.impressions).slice(0, 3).map((item: any, idx: number) => {
                    const colors = ['#3b82f6', '#6366f1', '#ec4899'];
                    const maxImpressions = Math.max(...(stats.impressionsByWidget?.widgets || []).map((w: any) => w.impressions), 1);
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${colors[idx]}15`, color: colors[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontWeight: 700, fontSize: '16px' }}>#{idx + 1}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{item.name}</div>
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>{item.impressions}</div>
                              </div>
                              <div style={{ width: '100%', background: '#f1f5f9', height: '6px', borderRadius: '999px', overflow: 'hidden' }}>
                                   <div 
                                      style={{ height: '100%', background: colors[idx], borderRadius: '999px', width: `${(item.impressions / maxImpressions) * 100}%` }}
                                   ></div>
                              </div>
                          </div>
                      </div>
                    );
                  })}
               </div>
             )}
             {stats.impressionsByWidget && (
               <p style={{ fontSize: '13px', color: '#64748b', marginTop: '20px', marginBottom: 0, lineHeight: '1.5' }}>
                  Ranking of your widgets by total impressions during the selected period
               </p>
             )}
        </Card>
        </div>

      </div>
    </div>
  )
}

