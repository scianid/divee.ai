import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAdmin } from '../hooks/useAdmin'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'

interface DailyStats {
  date: string
  count: number
}

interface AnalysisStats {
  totalAnalyzedLastWeek: number
  totalUnanalyzedAllTime: number
  dailyAnalyzed: DailyStats[]
}

function Card({ children, style = {}, title }: { children: React.ReactNode, style?: React.CSSProperties, title?: string }) {
  return (
    <div 
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
      {title && (
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#1e293b' }}>{title}</h3>
      )}
      {children}
    </div>
  )
}

export default function ConversationAnalysis() {
  const [stats, setStats] = useState<AnalysisStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = useAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard')
      return
    }
    fetchAnalysisStats()
  }, [isAdmin, navigate])

  async function fetchAnalysisStats() {
    try {
      setLoading(true)
      setError(null)

      // First, check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Not authenticated')
      }

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      oneWeekAgo.setHours(0, 0, 0, 0) // Start of day
      const oneWeekAgoStr = oneWeekAgo.toISOString().split('.')[0] + 'Z' // Remove milliseconds

      // Get total analyzed in last week
      const { count: analyzedLastWeek, error: weekError } = await supabase
        .from('conversation_analysis')
        .select('*', { count: 'exact', head: true })
        .gte('analyzed_at', oneWeekAgoStr)

      if (weekError) {
        console.error('Week query error:', weekError)
        throw new Error(`Failed to fetch analyzed count: ${weekError.message}`)
      }

      // Get total unanalyzed all time
      const { count: unanalyzedTotal, error: unanalyzedError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .is('analyzed_at', null)

      if (unanalyzedError) {
        console.error('Unanalyzed query error:', unanalyzedError)
        throw new Error(`Failed to fetch unanalyzed count: ${unanalyzedError.message}`)
      }

      // Get daily analyzed for last 7 days
      const { data: dailyData, error: dailyError } = await supabase
        .from('conversation_analysis')
        .select('analyzed_at')
        .gte('analyzed_at', oneWeekAgoStr)
        .order('analyzed_at', { ascending: true })

      if (dailyError) {
        console.error('Daily query error:', dailyError)
        throw new Error(`Failed to fetch daily data: ${dailyError.message}`)
      }

      // Group by date
      const dailyMap = new Map<string, number>()
      
      // Initialize all 7 days with 0
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dateStr = date.toISOString().split('T')[0]
        dailyMap.set(dateStr, 0)
      }

      // Fill in actual counts
      dailyData?.forEach((row: any) => {
        const dateStr = new Date(row.analyzed_at).toISOString().split('T')[0]
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1)
      })

      const dailyAnalyzed: DailyStats[] = Array.from(dailyMap.entries()).map(([date, count]) => ({
        date,
        count
      }))

      setStats({
        totalAnalyzedLastWeek: analyzedLastWeek || 0,
        totalUnanalyzedAllTime: unanalyzedTotal || 0,
        dailyAnalyzed
      })
    } catch (err) {
      console.error('Error fetching analysis stats:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  const chartOption = stats ? {
    grid: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'category',
      data: stats.dailyAnalyzed.map(d => {
        const date = new Date(d.date)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { 
        color: '#64748b',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { 
        color: '#64748b',
        fontSize: 12
      }
    },
    series: [{
      data: stats.dailyAnalyzed.map(d => d.count),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: '#3b82f6',
        borderWidth: 2,
        borderColor: '#fff'
      },
      lineStyle: {
        color: '#3b82f6',
        width: 3
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0)' }
          ]
        }
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderColor: '#1e293b',
      textStyle: { color: '#fff' }
    }
  } : {}

  if (!isAdmin) {
    return null
  }

  return (
    <div style={{ fontFamily: 'var(--font-display)', color: '#334155' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Conversation Analysis
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
          Track conversation analysis progress and stats
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f4f6', 
            borderTop: '4px solid #2563eb', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
        </div>
      ) : error ? (
        <Card>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '40px',
            color: '#dc2626',
            gap: '12px'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span style={{ fontSize: '14px', textAlign: 'center' }}>
              Error loading stats: {error}
            </span>
          </div>
        </Card>
      ) : stats ? (
        <>
          {/* Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Total Analyzed Last Week */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
                    Analyzed (Last 7 Days)
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>
                    {formatNumber(stats.totalAnalyzedLastWeek)}
                  </div>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Total Unanalyzed */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
                    Unanalyzed (All Time)
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>
                    {formatNumber(stats.totalUnanalyzedAllTime)}
                  </div>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Average Per Day */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
                    Avg Per Day (Last 7 Days)
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b' }}>
                    {formatNumber(Math.round(stats.totalAnalyzedLastWeek / 7))}
                  </div>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Daily Chart */}
          <Card title="Analyzed Conversations - Last 7 Days">
            <div style={{ height: '300px' }}>
              <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
            </div>
          </Card>
        </>
      ) : null}

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
