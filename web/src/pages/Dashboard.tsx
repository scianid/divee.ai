import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

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
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 13 },
                displayColors: false,
                callbacks: {
                    title: () => '',
                    label: (context: any) => `${context.parsed.y} impressions`
                }
            }
        },
        scales: {
            x: { display: false },
            y: { display: false, min: 0 }
        },
        elements: {
            line: { tension: 0.4 },
            point: {
                radius: 0,
                hoverRadius: 4,
                backgroundColor: '#fff',
                borderColor: '#2563eb',
                borderWidth: 2
             }
        },
        layout: {
            padding: 0
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
    }

    const data = {
        labels: chartData.map((_, i) => i.toString()),
        datasets: [
            {
                data: chartData,
                borderColor: '#2563eb',
                borderWidth: 2,
                backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) {
                        return null;
                    }
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
                    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
                    return gradient;
                },
                fill: true,
            }
        ]
    }

    return (
        <div style={{ position: 'relative', height: '96px', width: '100%', marginTop: 'auto' }}>
            {timelineData.length > 0 ? (
              <Line options={options} data={data} />
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
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 13 },
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `${context.parsed.y} interactions`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { font: { size: 11 }, color: '#94a3b8' },
                border: { display: false }
            },
            y: {
                display: false,
                min: chartData.length > 0 ? Math.max(0, Math.min(...chartData) - 20) : 0,
                max: chartData.length > 0 ? Math.max(...chartData) + 20 : 100,
            }
        },
        layout: {
            padding: { left: 10, right: 10, top: 10, bottom: 0 }
        },
        elements: {
            line: { tension: 0.4 },
            point: {
                radius: 4,
                hoverRadius: 6,
                backgroundColor: '#ffffff',
                borderColor: '#2563eb',
                borderWidth: 2
            }
        }
    }

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Interactions',
                data: chartData,
                borderColor: '#2563eb',
                backgroundColor: (context: any) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
                    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
                    return gradient;
                },
                fill: true,
                borderWidth: 3,
            },
        ],
    }

    return (
        <div style={{ height: '160px', width: '100%', marginTop: '16px' }}>
             {timelineData.length > 0 ? (
               <Line data={data} options={options} />
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
    
    // Capitalize first letter of platform
    const formatLabel = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    
    const finalData = other > 0 ? [...top, { platform: 'Other', count: other }] : top;
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#64748b'];

    const chartData = {
        labels: finalData.map(d => formatLabel(d.platform)),
        datasets: [{
            data: finalData.map(d => d.count),
            backgroundColor: colors,
            borderWidth: 0,
        }]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } }
            }
        },
        cutout: '70%',
        maintainAspectRatio: false,
    };

    return (
        <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {data.length > 0 ? <Doughnut data={chartData} options={options} /> : <div style={{color: '#94a3b8', fontSize: '14px'}}>No data</div>}
        </div>
    );
}

function FunnelView({ impressions, suggestions, questions }: { impressions: number, suggestions: number, questions: number }) {
    const max = Math.max(impressions, 1);
    
    const steps = [
        { label: 'Impressions', value: impressions, color: '#3b82f6', width: 100 },
        { label: 'Suggestions', value: suggestions, color: '#8b5cf6', width: 75 },
        { label: 'Questions', value: questions, color: '#ec4899', width: 50 }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '20px' }}>
            {steps.map((step, idx) => {
                const percent = max > 0 ? Math.round((step.value / max) * 100) : 0;
                const prevValue = idx > 0 ? steps[idx - 1].value : step.value;
                const conversionRate = prevValue > 0 ? Math.round((step.value / prevValue) * 100) : 0;

                return (
                    <div key={idx} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Funnel Step */}
                        <div 
                            style={{ 
                                width: `${step.width}%`,
                                background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`,
                                borderRadius: '8px',
                                padding: '6px 15px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                position: 'relative',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ padding: '3px 0 0 0', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {step.label}
                                    </div>
                                    <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                                        {step.value.toLocaleString()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                                        {percent}%
                                    </div>
                                    {idx > 0 && (
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>
                                            {conversionRate}% conv.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Connector Arrow */}
                        {idx < steps.length - 1 && (
                            <div style={{ 
                                width: '2px', 
                                height: '8px', 
                                background: 'linear-gradient(180deg, #cbd5e1, transparent)',
                                margin: '2px 0'
                            }} />
                        )}
                    </div>
                );
            })}
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
    impressionsByPlatform: null
  });
  const [articlesCount, setArticlesCount] = useState<number>(0);

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
        fetchEndpoint('impressions-by-platform', 'impressionsByPlatform')
      ]);
      
      // Fetch articles count
      const { count } = await supabase
        .from('article')
        .select('*', { count: 'exact', head: true })
        .in('project_id', [
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
  
  // Fetch stats on mount
  useEffect(() => {
    if (user && hasAccounts) {
      fetchStats();
    }
  }, [hasAccounts])

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
    padding: '8px 16px',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap', flex: 1 }}>
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
                </>
                )}
            </Card>
        </div>

        <div style={{ gridColumn: window.innerWidth >= 900 ? 'span 2' : 'span 1', minWidth: 0 }}>
            <Card title="Total Interactions" style={{ height: '100%' }}>
                {(!stats.totalInteractions || !stats.interactionsOverTime) ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{stats.totalInteractions?.total ?? 0}</span>
                        <span style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Interactions</span>
                    </div>
                    <DailyInteractionsChart data={stats.interactionsOverTime?.timeline || []} />
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
                         <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>
                             {loading ? '...' : totalSuggestions}
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
                         <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>
                             {loading ? '...' : totalQuestions}
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
                         <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>
                             {loading ? '...' : articlesCount}
                         </div>
                     </div>
                 </div>
             </Card>
        </div>

        <div style={{ gridColumn: 'span 1', minWidth: 0 }}>
             <Card title="Conversion Funnel" style={{ height: '100%' }}>
                 {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid #f3f4f6', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    </div>
                 ) : (
                    <FunnelView 
                        impressions={totalImpressions}
                        suggestions={totalSuggestions}
                        questions={totalQuestions}
                    />
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
                  <PlatformsChart data={stats.impressionsByPlatform?.platforms || []} />
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
                  <ImpressionsMap locations={stats.impressionsByLocation?.locations || []} />
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
                  {(stats.impressionsByWidget?.widgets || []).slice(0, 3).map((item: any, idx: number) => {
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
        </Card>
        </div>

      </div>
    </div>
  )
}

