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

// --- Mock Data ---

const MOCK_WIDGET_DATA = [
    { label: 'Chat Widget', value: 450, color: '#3b82f6' },
    { label: 'Booking Form', value: 320, color: '#6366f1' },
    { label: 'Contact Button', value: 210, color: '#ec4899' },
]

const MOCK_TREND_DATA = [
  15, 18, 16, 22, 18, 25, 23, 28, 26, 30, 28, 32
]

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MOCK_DAILY_INTERACTIONS = [142, 210, 185, 234, 289, 312, 345]

const CHART_DATA = WEEK_DAYS.map((day, i) => ({
  name: day,
  value: MOCK_DAILY_INTERACTIONS[i]
}))

const MOCK_BAR_DATA = [
  { label: 'Jan', value: 35, type: 'recovery' },
  { label: 'Feb', value: 75, type: 'process' },
  { label: 'Mar', value: 25, type: 'recovery' },
  { label: 'Apr', value: 0, type: 'empty' },
  { label: 'May', value: 50, type: 'process' },
  { label: 'Jun', value: 20, type: 'recovery' },
]

const MOCK_LOCATIONS = [
  { id: 1, name: "New York", lat: 40.7128, lng: -74.0060, value: 850 },
  { id: 2, name: "London", lat: 51.5074, lng: -0.1278, value: 650 },
  { id: 3, name: "Tokyo", lat: 35.6762, lng: 139.6503, value: 920 },
  { id: 4, name: "Sydney", lat: -33.8688, lng: 151.2093, value: 450 },
  { id: 5, name: "Paris", lat: 48.8566, lng: 2.3522, value: 700 },
  { id: 6, name: "Berlin", lat: 52.5200, lng: 13.4050, value: 550 },
  { id: 7, name: "Singapore", lat: 1.3521, lng: 103.8198, value: 780 },
  { id: 8, name: "San Francisco", lat: 37.7749, lng: -122.4194, value: 890 },
]

const CHECKUP_PROGRESS = [
  { id: 1, date: '22 Agustus, 2024', status: 'completed' },
  { id: 2, date: '16 Agustus, 2024', status: 'completed' },
  { id: 3, date: '12 Agustus, 2024', status: 'completed' },
]

const DOCTORS = [
  { id: 1, name: 'Dr. Leslie Alexander', hospital: 'Hasan Sadikin Hospital', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leslie' },
  { id: 2, name: 'Dr. Savannah Nguyen', hospital: 'Hasan Sadikin Hospital', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Savannah' },
  { id: 3, name: 'Dr. Darlene Robertson', hospital: 'Hasan Sadikin Hospital', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Darlene' },
]

// --- Icons ---



const FilterIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)



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

function TrendChart() {
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
        labels: MOCK_TREND_DATA.map((_, i) => i.toString()),
        datasets: [
            {
                data: MOCK_TREND_DATA,
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
            <Line options={options} data={data} />
        </div>
    )
}

function ImpressionsMap() {
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
                {MOCK_LOCATIONS.map(loc => (
                    <CircleMarker 
                        key={loc.id} 
                        center={[loc.lat, loc.lng]} 
                        pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.6, weight: 0 }}
                        radius={Math.sqrt(loc.value) * 0.4}
                    >
                        <Popup>
                            <div style={{ fontFamily: 'var(--font-display)', color: '#1e293b' }}>
                                <strong>{loc.name}</strong><br/>
                                {loc.value} impressions
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    )
}

function ImpressionsByWidgetChart() {
    const data = {
        labels: MOCK_WIDGET_DATA.map(d => d.label),
        datasets: [
            {
                data: MOCK_WIDGET_DATA.map(d => d.value),
                backgroundColor: MOCK_WIDGET_DATA.map(d => d.color),
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
            <Pie data={data} options={options} />
        </div>
    );
}

function DailyInteractionsChart() {
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
                min: Math.min(...MOCK_DAILY_INTERACTIONS) - 20,
                max: Math.max(...MOCK_DAILY_INTERACTIONS) + 20,
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
        labels: WEEK_DAYS,
        datasets: [
            {
                label: 'Interactions',
                data: MOCK_DAILY_INTERACTIONS,
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
             <Line data={data} options={options} />
        </div>
    )
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

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
        }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  if (!user) return null

  // Used for greeting
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

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
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
           <div style={btnStyle}>
             <FilterIcon />
             <span>Filter</span>
           </div>
           
           <div style={btnStyle}>
             <CalendarIcon />
             <span>Monthly</span>
           </div>
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
            <Card title="Total Interactions" action={<span style={{ fontSize: '12px', color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>Weekly</span>} style={{ height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{MOCK_DAILY_INTERACTIONS.reduce((a, b) => a + b, 0).toLocaleString()}</span>
                    <span style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Interactions</span>
                    <div style={{ fontSize: '12px', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '999px', marginLeft: 'auto', marginBottom: '4px', fontWeight: 600 }}>
                        +12% vs last week
                    </div>
                </div>
                <DailyInteractionsChart />
            </Card>
        </div>

        {/* Card 3 */}
         <Card title="Total Impressions" action={<button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>−</button>}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                 <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>85%</span>
                 <span style={{ fontSize: '12px', color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '999px', fontWeight: 700 }}>+6.75%</span>
            </div>
            <TrendChart />
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                 <span>Mon</span>
                 <span>Tue</span>
                 <span>Wed</span>
                 <span>Thu</span>
             </div>
        </Card>

        {/* Card 4 */}
        <Card title="Checkup progress" action={<button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>−</button>}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
                {CHECKUP_PROGRESS.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/><line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/><line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{item.date}</div>
                            <div style={{ width: '100%', background: '#f1f5f9', height: '6px', borderRadius: '999px', marginTop: '12px', overflow: 'hidden' }}>
                                 <div 
                                    style={{ height: '100%', background: '#2563eb', borderRadius: '999px', width: idx === 0 ? '70%' : '100%' }}
                                 ></div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
        </Card>

        {/* Row 2: Medical Info */}
        <Card title="Impressions by Widget" action={<button style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>See Details</button>}>
             <ImpressionsByWidgetChart />
        </Card>

        {/* Row 2: Patient health report (Span 2 charts) */}
        <div style={{ gridColumn: 'span 2' }}>
            <Card title="Impressions by Location" action={<button style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View Map</button>} style={{ height: '100%' }}>
                <ImpressionsMap />
            </Card>
        </div>

        {/* Row 2: Doctor */}
        <Card title="My Doctor" action={<button style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>See Details</button>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                {DOCTORS.map((doc) => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #f8fafc' }}>
                         <img src={doc.image} alt={doc.name} style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff' }} />
                         <div>
                             <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{doc.name}</div>
                             <div style={{ fontSize: '12px', color: '#64748b' }}>{doc.hospital}</div>
                         </div>
                    </div>
                ))}
            </div>
        </Card>

      </div>
    </div>
  )
}

