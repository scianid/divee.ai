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
import { Line, Pie } from 'react-chartjs-2'
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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

function ImpressionsByWidgetChart({ data: widgets }: { data: any[] }) {
    const colors = ['#3b82f6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];
    const chartData = {
        labels: widgets.map(d => d.name),
        datasets: [
            {
                data: widgets.map(d => d.impressions),
                backgroundColor: colors,
                borderWidth: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12 }
                }
            }
        },
        cutout: '60%', // Makes it a donut chart
    };

    return (
        <div style={{ height: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {widgets.length > 0 ? (
              <Pie data={chartData} options={options} />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>No data available</div>
            )}
        </div>
    );
}

function DailyInteractionsChart({ data: timelineData }: { data: any[] }) {
    const chartData = timelineData.length > 0 ? timelineData.map((d: any) => d.count) : [0];
    const labels = timelineData.length > 0 ? timelineData.map((d: any) => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
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
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({
    totalInteractions: null,
    impressionsByWidget: null,
    impressionsByLocation: null,
    interactionsOverTime: null,
    impressionsOverTime: null
  });

  // Fetch stats from edge function
  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found');
        return;
      }

      const baseUrl = 'https://vdbmhqlogqrxozaibntq.supabase.co/functions/v1/stats';
      
      // Format dates with time component for proper filtering
      const startDate = `${dateRange.start}T00:00:00`;
      const endDate = `${dateRange.end}T23:59:59`;
      
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
        fetchEndpoint('impressions-over-time', 'impressionsOverTime')
      ]);
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
      }
    })
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          navigate('/login')
        } else {
          setUser(session?.user ?? null)
          fetchStats()
        }
    })
    return () => subscription.unsubscribe()
  }, [navigate])
  
  // Fetch stats on mount
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [])

  if (!user) return null

  // Used for greeting
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  
  // Handle date change
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, start: e.target.value }));
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, end: e.target.value }));
  };

  // Quick date range presets
  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };
  
  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    setDateRange({
      start: dateStr,
      end: dateStr
    });
  };
  
  // Check if a preset is active
  const isPresetActive = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return dateRange.start === start.toISOString().split('T')[0] && 
           dateRange.end === end.toISOString().split('T')[0];
  };
  
  const isYesterdayActive = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    return dateRange.start === dateStr && dateRange.end === dateStr;
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

  return (
    <div style={{ fontFamily: 'var(--font-display)', paddingBottom: '48px', color: '#334155' }}>
      
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
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '999px', border: '1px solid #e2e8f0' }}>
             <CalendarIcon />
             <input
               type="date"
               value={dateRange.start}
               onChange={handleStartDateChange}
               style={{ border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600, color: '#334155', fontFamily: 'inherit', width: '110px' }}
             />
             <span style={{ color: '#94a3b8' }}>→</span>
             <input
               type="date"
               value={dateRange.end}
               onChange={handleEndDateChange}
               style={{ border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600, color: '#334155', fontFamily: 'inherit', width: '110px' }}
             />
           </div>
           
           {/* Quick Presets */}
           <button onClick={() => setYesterday()} style={{ ...btnStyle, border: isYesterdayActive() ? '1px solid #2563eb' : '1px solid #e2e8f0', color: isYesterdayActive() ? '#2563eb' : '#334155' }}>
             Yesterday
           </button>
           <button onClick={() => setPreset(7)} style={{ ...btnStyle, border: isPresetActive(7) ? '1px solid #2563eb' : '1px solid #e2e8f0', color: isPresetActive(7) ? '#2563eb' : '#334155' }}>
             Last 7 days
           </button>
           <button onClick={() => setPreset(30)} style={{ ...btnStyle, border: isPresetActive(30) ? '1px solid #2563eb' : '1px solid #e2e8f0', color: isPresetActive(30) ? '#2563eb' : '#334155' }}>
             Last 30 days
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        
        {/* Card 1 */}
        <div style={{ gridColumn: 'span 2' }}>
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

        {/* Card 3 */}
         <Card title="Total Impressions" action={<button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>−</button>}>
            {(!stats.impressionsByWidget || !stats.impressionsOverTime) ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
                <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                     <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                       {stats.impressionsByWidget?.widgets?.reduce((sum: number, w: any) => sum + w.impressions, 0) ?? 0}
                     </span>
                </div>
                <TrendChart data={stats.impressionsOverTime?.timeline || []} />
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                     <span>Mon</span>
                     <span>Tue</span>
                     <span>Wed</span>
                     <span>Thu</span>
                 </div>
              </>
            )}
        </Card>

        {/* Card 4 */}
        <Card title="Top 3 Widgets" action={<button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>−</button>}>
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
                                  <div style={{ fontSize: '12px', color: '#64748b' }}>{item.impressions} impressions</div>
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

        {/* Row 2: Medical Info */}
        <Card title="Impressions by Widget">
             {!stats.impressionsByWidget ? (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
                 <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #f3f4f6', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
               </div>
             ) : (
               <ImpressionsByWidgetChart data={stats.impressionsByWidget?.widgets || []} />
             )}
        </Card>

        {/* Row 2: Patient health report (Span 2 charts) */}
        <div style={{ gridColumn: 'span 2' }}>
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

        {/* Row 2: Quick Start */}
        <Card title="Quick Start">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', height: '100%', justifyContent: 'center' }}>
                 <button style={{ 
                    background: '#eff6ff', 
                    color: '#2563eb', 
                    padding: '12px', 
                    borderRadius: '12px', 
                    border: '1px solid #bfdbfe', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Widget
                 </button>
                 
                 <button style={{ 
                    background: '#fff', 
                    color: '#334155', 
                    padding: '12px', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0', 
                    fontWeight: 600, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    New Account
                 </button>
            </div>
        </Card>

      </div>
    </div>
  )
}

