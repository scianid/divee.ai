import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface Conversation {
  id: string
  project_id: string
  article_title: string
  messages: Message[]
  started_at: string
  message_count: number
}

interface ConversationAnalysis {
  id: string
  conversation_id: string
  project_id: string
  interest_score: number
  engagement_score: number
  business_score: number
  content_score: number
  sentiment_score: number
  ai_summary: string
  key_insights: string[]
  analyzed_at: string
  conversation: {
    article_title: string
    started_at: string
    message_count: number
  }
  tags: Array<{
    tag: string
    confidence: number
  }>
}

interface Project {
  project_id: string
  client_name: string
}

interface TagCount {
  tag: string
  count: number
}

interface TimeSeriesData {
  date: string
  count: number
  avgScore: number
}

interface AICallsData {
  totalCalls: number
  timeSeries: Array<{
    date: string
    calls: number
  }>
}

interface EngagementData {
  totalEngagements: number
  timeSeries: Array<{
    date: string
    engagements: number
  }>
}

interface AvgMessagesData {
  overallAvg: number
  timeSeries: Array<{
    date: string
    avgMessages: number
  }>
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTagName = (tag: string) => {
  return tag
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getScoreBadgeStyle = (score: number) => {
  if (score >= 90) return { background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)' }
  if (score >= 70) return { background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.2)' }
  if (score >= 50) return { background: 'rgba(100, 116, 139, 0.1)', color: '#475569', border: '1px solid rgba(100, 116, 139, 0.2)' }
  return { background: 'rgba(148, 163, 184, 0.1)', color: '#64748b', border: '1px solid rgba(148, 163, 184, 0.2)' }
}

const ActionButton = ({ onClick, children, style = {} }: { onClick: () => void; children: React.ReactNode; style?: React.CSSProperties }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 14px',
      fontSize: '12px',
      fontWeight: 600,
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '8px',
      background: '#fff',
      color: '#475569',
      cursor: 'pointer',
      transition: 'all 0.2s',
      ...style
    }}
    onMouseEnter={(e) => {
      if (!style.background || style.background === '#fff') {
        e.currentTarget.style.background = '#f8fafc'
        e.currentTarget.style.borderColor = '#2563eb'
      }
    }}
    onMouseLeave={(e) => {
      if (!style.background || style.background === '#fff') {
        e.currentTarget.style.background = '#fff'
        e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
      }
    }}
  >
    {children}
  </button>
)

// Searchable Select Component
const SearchableSelect = ({ 
  value, 
  onChange, 
  options, 
  allLabel = 'All',
  fullWidth = true
}: { 
  value: string
  onChange: (value: string) => void
  options: Array<string | { value: string; label: string }>
  placeholder?: string
  allLabel?: string
  fullWidth?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Normalize options to { value, label } format
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const filteredOptions = normalizedOptions.filter(option => 
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedOption = normalizedOptions.find(opt => opt.value === value)
  const displayValue = value === 'all' ? allLabel : (selectedOption ? (selectedOption.label.length > 30 ? selectedOption.label.substring(0, 30) + '...' : selectedOption.label) : allLabel)

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: '200px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: '1px solid #e2e8f0',
          borderRadius: '999px',
          fontSize: '14px',
          fontWeight: 600,
          background: '#fff',
          cursor: 'pointer',
          color: '#334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left',
          transition: 'background 0.2s'
        }}
      >
        <span>{displayValue}</span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div style={{
          position: fullWidth ? 'fixed' : 'absolute',
          top: fullWidth ? (dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 4 : 0) : 'calc(100% + 4px)',
          left: fullWidth ? '40px' : 0,
          right: fullWidth ? '40px' : undefined,
          minWidth: fullWidth ? undefined : '240px',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '280px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
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
            />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
            <div
              onClick={() => {
                onChange('all')
                setIsOpen(false)
                setSearchQuery('')
              }}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                background: value === 'all' ? '#f0f9ff' : 'transparent',
                fontWeight: value === 'all' ? 600 : 400,
                color: value === 'all' ? '#2563eb' : '#334155'
              }}
              onMouseEnter={(e) => { if (value !== 'all') e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={(e) => { if (value !== 'all') e.currentTarget.style.background = 'transparent' }}
            >
              {allLabel}
            </div>
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                  setSearchQuery('')
                }}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  background: value === option.value ? '#f0f9ff' : 'transparent',
                  fontWeight: value === option.value ? 600 : 400,
                  color: value === option.value ? '#2563eb' : '#334155'
                }}
                onMouseEnter={(e) => { if (value !== option.value) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={(e) => { if (value !== option.value) e.currentTarget.style.background = 'transparent' }}
              >
                {option.label}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const Card = ({ children, title, style = {} }: { children: React.ReactNode; title?: string; style?: React.CSSProperties }) => (
  <div style={{
    background: '#fff',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.05)',
    ...style
  }}>
    {title && (
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '4px', marginTop: 0 }}>
        {title}
      </h3>
    )}
    {children}
  </div>
)

const TrendChart = ({ data, dataKey, title, color = '#2563eb' }: { 
  data: TimeSeriesData[], 
  dataKey: 'count' | 'avgScore',
  title: string,
  color?: string 
}) => {
  const chartData = data.map(d => d[dataKey])
  const dates = data.map(d => {
    const date = new Date(d.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } }
    },
    series: [{
      data: chartData,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      itemStyle: { color: color },
      lineStyle: { color: color, width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: color + '20' },
            { offset: 1, color: color + '00' }
          ]
        }
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const value = params[0].value
        return `<div style="font-weight: 600">${params[0].name}</div>
                <div>${title}: <strong>${dataKey === 'avgScore' ? Math.round(value) : value}</strong></div>`
      }
    }
  }

  return <ReactECharts option={option} style={{ height: '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
}

const EngagementChart = ({ data, color = '#10b981' }: { 
  data: Array<{ date: string; engagements: number }>, 
  color?: string 
}) => {
  const chartData = data.map(d => d.engagements)
  const dates = data.map(d => {
    const date = new Date(d.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } }
    },
    series: [{
      data: chartData,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      itemStyle: { color: color },
      lineStyle: { color: color, width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: color + '20' },
            { offset: 1, color: color + '00' }
          ]
        }
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const value = params[0].value
        return `<div style="font-weight: 600">${params[0].name}</div>
                <div>Engagements: <strong>${value}</strong></div>`
      }
    }
  }

  return <ReactECharts option={option} style={{ height: '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
}

const AvgMessagesChart = ({ data, color = '#f59e0b' }: { 
  data: Array<{ date: string; avgMessages: number }>, 
  color?: string 
}) => {
  const chartData = data.map(d => d.avgMessages)
  const dates = data.map(d => {
    const date = new Date(d.date)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const option = {
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } }
    },
    series: [{
      data: chartData,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      itemStyle: { color: color },
      lineStyle: { color: color, width: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: color + '20' },
            { offset: 1, color: color + '00' }
          ]
        }
      }
    }],
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1e293b',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      formatter: (params: any) => {
        const value = params[0].value
        return `<div style="font-weight: 600">${params[0].name}</div>
                <div>Avg Messages: <strong>${Math.round(value * 10) / 10}</strong></div>`
      }
    }
  }

  return <ReactECharts option={option} style={{ height: '200px', width: '100%' }} opts={{ renderer: 'svg' }} />
}

export default function Insights() {
  const [analyses, setAnalyses] = useState<ConversationAnalysis[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedArticle, setSelectedArticle] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [tagCounts, setTagCounts] = useState<TagCount[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [expandedConv, setExpandedConv] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [aiCallsData, setAiCallsData] = useState<AICallsData>({ totalCalls: 0, timeSeries: [] })
  const [engagementData, setEngagementData] = useState<EngagementData>({ totalEngagements: 0, timeSeries: [] })
  const [avgMessagesData, setAvgMessagesData] = useState<AvgMessagesData>({ overallAvg: 0, timeSeries: [] })
  const [_stats, setStats] = useState({
    totalAnalyzed: 0,
    highInterestCount: 0,
    avgScore: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (projects.length > 0) {
      fetchAnalyses()
      fetchAICalls()
      fetchEngagementData()
      fetchAvgMessagesData()
    }
  }, [selectedProject, selectedArticle, projects])

  async function fetchProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: ownedAccounts } = await supabase
        .from('account')
        .select('id')
        .eq('user_id', user.id)

      const { data: collaboratedAccounts } = await supabase
        .from('account_collaborator')
        .select('account_id')
        .eq('user_id', user.id)

      const ownedIds = ownedAccounts?.map(a => a.id) || []
      const collaboratedIds = collaboratedAccounts?.map(a => a.account_id) || []
      const allAccountIds = [...new Set([...ownedIds, ...collaboratedIds])]

      if (allAccountIds.length === 0) {
        setLoading(false)
        return
      }

      const { data: projectsData } = await supabase
        .from('project')
        .select('project_id, client_name')
        .in('account_id', allAccountIds)

      if (projectsData) {
        setProjects(projectsData)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  async function fetchAnalyses() {
    try {
      setLoading(true)
      const projectIds = projects.map(p => p.project_id)

      // Build query
      let query = supabase
        .from('conversation_analysis')
        .select(`
          id,
          conversation_id,
          project_id,
          interest_score,
          engagement_score,
          business_score,
          content_score,
          sentiment_score,
          ai_summary,
          key_insights,
          analyzed_at
        `)
        .in('project_id', projectIds)
        .order('interest_score', { ascending: false })
        .order('analyzed_at', { ascending: false })

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      const { data: analysesData, error: analysesError } = await query

      if (analysesError) throw analysesError

      // Fetch conversation details and tags for each analysis
      const enrichedAnalyses = await Promise.all(
        (analysesData || []).map(async (analysis) => {
          // Get conversation details
          const { data: convData } = await supabase
            .from('conversations')
            .select('article_title, started_at, message_count')
            .eq('id', analysis.conversation_id)
            .single()

          // Get tags
          const { data: tagsData } = await supabase
            .from('conversation_tags')
            .select('tag, confidence')
            .eq('conversation_id', analysis.conversation_id)
            .order('confidence', { ascending: false })

          return {
            ...analysis,
            conversation: convData || { article_title: 'Unknown', started_at: '', message_count: 0 },
            tags: tagsData || []
          }
        })
      )

      setAnalyses(enrichedAnalyses)

      // Calculate stats (will be recalculated with filters in the component)
      const total = enrichedAnalyses.length
      const highInterest = enrichedAnalyses.filter(a => a.interest_score >= 70).length
      const avgScore = total > 0 
        ? enrichedAnalyses.reduce((sum, a) => sum + a.interest_score, 0) / total 
        : 0

      setStats({
        totalAnalyzed: total,
        highInterestCount: highInterest,
        avgScore: Math.round(avgScore)
      })

      // Calculate tag distribution
      const tagMap = new Map<string, number>()
      enrichedAnalyses.forEach(analysis => {
        analysis.tags.forEach(t => {
          tagMap.set(t.tag, (tagMap.get(t.tag) || 0) + 1)
        })
      })

      const tagCountsArray = Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10) // Top 10 tags

      setTagCounts(tagCountsArray)

      // Fetch time-series data
      await fetchTimeSeriesData()

    } catch (error) {
      console.error('Error fetching analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchTimeSeriesData() {
    try {
      const projectIds = projects.map(p => p.project_id)

      // Calculate date range - last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      // Build query for time-series data - join with conversations to get started_at and article_title
      let query = supabase
        .from('conversation_analysis')
        .select(`
          interest_score, 
          project_id,
          conversation_id,
          conversations!inner(started_at, article_title)
        `)
        .in('project_id', projectIds)
        .gte('conversations.started_at', startDate.toISOString())
        .lte('conversations.started_at', endDate.toISOString())

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter by article if selected
      let filteredData = data || []
      if (selectedArticle !== 'all') {
        filteredData = filteredData.filter((item: any) => item.conversations.article_title === selectedArticle)
      }

      // Group by date and calculate metrics
      const dateMap = new Map<string, { count: number; totalScore: number }>()
      
      filteredData.forEach((item: any) => {
        const date = new Date(item.conversations.started_at).toISOString().split('T')[0]
        const existing = dateMap.get(date) || { count: 0, totalScore: 0 }
        dateMap.set(date, {
          count: existing.count + 1,
          totalScore: existing.totalScore + item.interest_score
        })
      })

      // Convert to array and sort by date
      const timeSeriesArray: TimeSeriesData[] = Array.from(dateMap.entries())
        .map(([date, stats]) => ({
          date,
          count: stats.count,
          avgScore: stats.count > 0 ? stats.totalScore / stats.count : 0
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setTimeSeriesData(timeSeriesArray)

    } catch (error) {
      console.error('Error fetching time-series data:', error)
    }
  }

  async function fetchAICalls() {
    try {
      const projectIds = projects.map(p => p.project_id)
      
      // Calculate date range - last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      // Build query for conversations (AI calls)
      let query = supabase
        .from('conversations')
        .select('started_at, article_title')
        .in('project_id', projectIds)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      const { data, error } = await query

      if (error) throw error

      let filteredData = data || []

      // Apply article filter
      if (selectedArticle !== 'all') {
        filteredData = filteredData.filter(conv => conv.article_title === selectedArticle)
      }

      // Calculate total calls
      const totalCalls = filteredData.length

      // Group by date for time series
      const dateMap = new Map<string, number>()
      filteredData.forEach(conv => {
        if (conv.started_at) {
          const date = new Date(conv.started_at).toISOString().split('T')[0]
          dateMap.set(date, (dateMap.get(date) || 0) + 1)
        }
      })

      // Convert to array and sort - last 7 days only
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      const timeSeries = Array.from(dateMap.entries())
        .map(([date, calls]) => ({ date, calls }))
        .filter(item => item.date >= sevenDaysAgoStr)
        .sort((a, b) => a.date.localeCompare(b.date))

      setAiCallsData({ totalCalls, timeSeries })
    } catch (error) {
      console.error('Error fetching AI calls data:', error)
    }
  }

  async function fetchEngagementData() {
    try {
      const projectIds = projects.map(p => p.project_id)
      
      // Calculate date range - last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      // Build query for engagement events from aggregated table
      let query = supabase
        .from('analytics_events_hourly_agg')
        .select('hour_bucket, event_count, event_label')
        .eq('event_type', 'suggestion_question_asked')
        .in('project_id', projectIds)
        .gte('hour_bucket', startDate.toISOString())
        .lte('hour_bucket', endDate.toISOString())

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      const { data, error } = await query

      if (error) throw error

      let filteredData = data || []

      // Apply article filter using event_label (which contains article info)
      if (selectedArticle !== 'all') {
        filteredData = filteredData.filter((item: any) => 
          item.event_label && item.event_label.includes(selectedArticle)
        )
      }

      // Calculate total engagements
      const totalEngagements = filteredData.reduce((sum, item) => sum + (item.event_count || 0), 0)

      // Group by date for time series
      const dateMap = new Map<string, number>()
      filteredData.forEach((item: any) => {
        if (item.hour_bucket) {
          const date = new Date(item.hour_bucket).toISOString().split('T')[0]
          dateMap.set(date, (dateMap.get(date) || 0) + (item.event_count || 0))
        }
      })

      // Convert to array and sort
      const timeSeries = Array.from(dateMap.entries())
        .map(([date, engagements]) => ({ date, engagements }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setEngagementData({ totalEngagements, timeSeries })
    } catch (error) {
      console.error('Error fetching engagement data:', error)
    }
  }

  async function fetchAvgMessagesData() {
    try {
      const projectIds = projects.map(p => p.project_id)
      
      // Calculate date range - last 7 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)
      
      // Build query for conversations with message_count
      let query = supabase
        .from('conversations')
        .select('started_at, article_title, message_count')
        .in('project_id', projectIds)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject)
      }

      const { data, error } = await query

      if (error) throw error

      let filteredData = data || []

      // Apply article filter
      if (selectedArticle !== 'all') {
        filteredData = filteredData.filter(conv => conv.article_title === selectedArticle)
      }

      // Calculate overall average
      const overallAvg = filteredData.length > 0
        ? Math.round(filteredData.reduce((sum, conv) => sum + (conv.message_count || 0), 0) / filteredData.length)
        : 0

      // Group by date and calculate average messages per day
      const dateMap = new Map<string, { totalMessages: number; count: number }>()
      filteredData.forEach(conv => {
        if (conv.started_at) {
          const date = new Date(conv.started_at).toISOString().split('T')[0]
          const existing = dateMap.get(date) || { totalMessages: 0, count: 0 }
          dateMap.set(date, {
            totalMessages: existing.totalMessages + (conv.message_count || 0),
            count: existing.count + 1
          })
        }
      })

      // Convert to array and sort
      const timeSeries = Array.from(dateMap.entries())
        .map(([date, stats]) => ({
          date,
          avgMessages: stats.count > 0 ? stats.totalMessages / stats.count : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setAvgMessagesData({ overallAvg, timeSeries })
    } catch (error) {
      console.error('Error fetching avg messages data:', error)
    }
  }

  async function openConversation(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, project_id, article_title, messages, started_at, message_count')
        .eq('id', conversationId)
        .single()

      if (error) throw error
      if (data) {
        setSelectedConversation(data)
      }
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.project_id === projectId)
    return project?.client_name || 'Unknown Widget'
  }

  // Helper function to set tag filter
  const setTagFilter = (tag: string) => {
    setSelectedTag(tag)
  }

  // Filter to last 7 days first
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const last7DaysAnalyses = analyses.filter(a => {
    const convDate = new Date(a.conversation.started_at)
    return convDate >= sevenDaysAgo
  })

  // Extract unique articles and tags from last 7 days analyses
  const uniqueArticles = Array.from(new Set(last7DaysAnalyses.map(a => a.conversation.article_title))).sort()
  const uniqueTags = Array.from(new Set(last7DaysAnalyses.flatMap(a => a.tags.map(t => t.tag))))
    .filter(tag => tag !== 'mobile_user' && tag !== 'suggestion_click')
    .sort()

  // Apply article filter to last 7 days data
  let baseFilteredAnalyses = last7DaysAnalyses
  if (selectedArticle !== 'all') {
    baseFilteredAnalyses = baseFilteredAnalyses.filter(a => a.conversation.article_title === selectedArticle)
  }

  // Calculate actionable insights from article-filtered data
  const actionableInsights = {
    critical: baseFilteredAnalyses.filter(a => a.interest_score >= 90),
    contentGaps: baseFilteredAnalyses.filter(a => a.tags.some(t => t.tag === 'content_gap')),
    sellOpportunities: baseFilteredAnalyses.filter(a => a.tags.some(t => t.tag === 'sell_potential')),
    featureRequests: baseFilteredAnalyses.filter(a => a.tags.some(t => t.tag === 'feature_request')),
    criticisms: baseFilteredAnalyses.filter(a => a.tags.some(t => t.tag === 'criticism')),
  }

  // Calculate filtered stats
  const filteredStats = {
    totalAnalyzed: baseFilteredAnalyses.length,
    highInterestCount: baseFilteredAnalyses.filter(a => a.interest_score >= 70).length,
    avgScore: baseFilteredAnalyses.length > 0
      ? Math.round(baseFilteredAnalyses.reduce((sum, a) => sum + a.interest_score, 0) / baseFilteredAnalyses.length)
      : 0
  }

  // Apply additional tag filter for conversation list
  let filteredAnalyses = baseFilteredAnalyses
  if (selectedTag !== 'all') {
    filteredAnalyses = filteredAnalyses.filter(a => a.tags.some(t => t.tag === selectedTag))
  }

  return (
    <div style={{ fontFamily: 'var(--font-display)', color: '#334155' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Insights (7 Days)
          </h1>
        </div>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          AI-powered analysis of user conversations
        </p>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchableSelect
          value={selectedProject}
          onChange={setSelectedProject}
          options={projects.map(p => ({ value: p.project_id, label: p.client_name }))}
          placeholder="Select widget"
          allLabel="All Widgets"
        />

        <SearchableSelect
          value={selectedArticle}
          onChange={setSelectedArticle}
          options={uniqueArticles}
          placeholder="Select article"
          allLabel="All Articles"
        />

        <SearchableSelect
          value={selectedTag}
          onChange={setTagFilter}
          options={uniqueTags.map(formatTagName)}
          placeholder="Select tag"
          allLabel="All Tags"
          fullWidth={false}
        />
      </div>

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(0,0,0,0.05)',
              borderTop: '3px solid #2563eb',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{ color: '#64748b', fontSize: '13px' }}>Loading insights...</div>
          </div>
        </Card>
      ) : (
        <>
          {/* AI Performance Score - Hero Card */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
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

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.95)', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  AI PERFORMANCE SCORE (GEO OPTIMIZATION)
                </div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: '#fff', marginBottom: '8px', lineHeight: 1 }}>
                  {aiCallsData.totalCalls.toLocaleString()}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                  Total AI organic conversations about your articles & site (last 7 days)
                </div>
              </div>
              {aiCallsData.timeSeries.length > 0 && (
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <ReactECharts
                    option={{
                      grid: { top: 10, right: 10, bottom: 30, left: 40 },
                      xAxis: {
                        type: 'category',
                        data: aiCallsData.timeSeries.map(d => {
                          const date = new Date(d.date)
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }),
                        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.3)' } },
                        axisLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
                        axisTick: { show: false }
                      },
                      yAxis: {
                        type: 'value',
                        axisLine: { show: false },
                        axisLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
                        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
                      },
                      series: [{
                        data: aiCallsData.timeSeries.map(d => d.calls),
                        type: 'line',
                        smooth: true,
                        symbol: 'circle',
                        symbolSize: 6,
                        lineStyle: { color: '#ffffff', width: 3 },
                        itemStyle: { color: '#ffffff' },
                        areaStyle: {
                          color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                              { offset: 0, color: 'rgba(255,255,255,0.4)' },
                              { offset: 1, color: 'rgba(255,255,255,0.05)' }
                            ]
                          }
                        }
                      }],
                      tooltip: {
                        trigger: 'axis',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        borderColor: 'transparent',
                        textStyle: { color: '#fff' },
                        formatter: (params: any) => {
                          const param = params[0]
                          return `${param.name}<br/>${param.value} calls`
                        }
                      }
                    }}
                    style={{ height: '150px', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Items - Priority Section */}
          {actionableInsights.critical.length > 0 && (
            <div style={{ 
              background: '#fff',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: '20px',
              padding: '16px 20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)',
              borderLeft: '4px solid #dc2626'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                      {actionableInsights.critical.length} Critical Conversation{actionableInsights.critical.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '8px' }}>
                      Requires immediate attention
                    </span>
                  </div>
                </div>
                <ActionButton 
                  onClick={() => setTagFilter('all')} 
                  style={{ background: '#2563eb', color: '#fff', borderColor: '#2563eb', padding: '6px 14px' }}
                >
                  Review →
                </ActionButton>
              </div>
            </div>
          )}

          {/* Time-Series Charts */}
          {timeSeriesData.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <Card title="Conversations Over Time">
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', lineHeight: '1.4' }}>
                  Total analyzed conversations with AI-powered insights (last 7 days)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                    {filteredStats.totalAnalyzed}
                  </span>
                </div>
                <TrendChart 
                  data={timeSeriesData} 
                  dataKey="count" 
                  title="Conversations"
                  color="#2563eb"
                />
              </Card>
              
              <Card title="Avg Interest Score">
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', lineHeight: '1.4' }}>
                  Average engagement and value score across all conversations (last 7 days)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                    {filteredStats.avgScore}
                  </span>
                </div>
                <TrendChart 
                  data={timeSeriesData} 
                  dataKey="avgScore" 
                  title="Avg Score"
                  color="#2563eb"
                />
              </Card>

              <Card title="Engagement">
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', lineHeight: '1.4' }}>
                  Number of times users asked for suggestions (last 7 days)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                    {engagementData.totalEngagements}
                  </span>
                </div>
                {engagementData.timeSeries.length > 0 ? (
                  <EngagementChart 
                    data={engagementData.timeSeries} 
                    color="#10b981"
                  />
                ) : (
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No engagement data yet
                  </div>
                )}
              </Card>

              <Card title="Avg Messages per Conversation">
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', lineHeight: '1.4' }}>
                  Average number of messages exchanged per conversation (last 7 days)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                    {avgMessagesData.overallAvg}
                  </span>
                </div>
                {avgMessagesData.timeSeries.length > 0 ? (
                  <AvgMessagesChart 
                    data={avgMessagesData.timeSeries} 
                    color="#f59e0b"
                  />
                ) : (
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No conversation data yet
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Opportunity Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {/* Content Gaps */}
            {actionableInsights.contentGaps.length > 0 && (
              <div style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: '20px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              onClick={() => setTagFilter('content_gap')}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                  In-Depth Questions
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  {actionableInsights.contentGaps.length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                  Topics users asked about that weren't covered in your content
                </div>
              </div>
            )}

            {/* Criticisms */}
            {actionableInsights.criticisms.length > 0 && (
              <div style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: '20px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              onClick={() => setTagFilter('criticism')}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                  User Feedback
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  {actionableInsights.criticisms.length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                  Critical feedback and concerns shared by users
                </div>
              </div>
            )}

            

            {/* Sell Opportunities */}
            {actionableInsights.sellOpportunities.length > 0 && (
              <div style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: '20px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              onClick={() => setTagFilter('sell_potential')}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                  Purchase Attempts
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                  {actionableInsights.sellOpportunities.length}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                  Users showing purchase intent or commercial interest
                </div>
              </div>
            )}

          </div>

          /* Main Content Grid */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '20px' }}>
            {/* Tag Distribution */}
            <Card title="Top Tags - Click to Filter">
              {tagCounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div style={{ fontSize: '13px' }}>No tags yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tagCounts.map((tagCount, idx) => {
                    const maxCount = tagCounts[0].count
                    const percentage = (tagCount.count / maxCount) * 100
                    const isActive = selectedTag === tagCount.tag
                    
                    return (
                      <div 
                        key={idx}
                        onClick={() => setTagFilter(isActive ? 'all' : tagCount.tag)}
                        style={{ 
                          cursor: 'pointer',
                          padding: '10px',
                          borderRadius: '8px',
                          background: isActive ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                          border: isActive ? '1px solid rgba(37, 99, 235, 0.2)' : '1px solid transparent',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'rgba(0,0,0,0.02)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: isActive ? 700 : 600, 
                            color: isActive ? '#2563eb' : '#1e293b' 
                          }}>
                            {formatTagName(tagCount.tag)}
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            color: isActive ? '#2563eb' : '#64748b' 
                          }}>
                            {tagCount.count}
                          </span>
                        </div>
                        <div style={{ 
                          height: '4px', 
                          background: 'rgba(0,0,0,0.05)', 
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${percentage}%`, 
                            background: isActive ? '#2563eb' : '#94a3b8',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* High Interest Conversations */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                  Analyzed Conversations
                </h3>
                {selectedTag !== 'all' && (
                  <ActionButton onClick={() => setTagFilter('all')} style={{ fontSize: '12px', padding: '6px 12px' }}>
                    Clear Filter ✕
                  </ActionButton>
                )}
              </div>
              {filteredAnalyses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    {selectedTag === 'all' ? 'No Analyzed Conversations Yet' : 'No conversations with this tag'}
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    {selectedTag === 'all' 
                      ? 'Run the analysis from the Conversations page to see insights here'
                      : 'Try a different filter or view all conversations'
                    }
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '800px', overflowY: 'auto' }}>
                  {filteredAnalyses.slice(0, 10).map((analysis) => (
                    <div
                      key={analysis.id}
                      style={{
                        padding: '16px',
                        border: expandedConv === analysis.id ? '1px solid #2563eb' : '1px solid rgba(0,0,0,0.05)',
                        borderRadius: '12px',
                        background: '#fff',
                        transition: 'all 0.2s',
                        boxShadow: expandedConv === analysis.id ? '0 2px 8px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ 
                              fontSize: '15px', 
                              fontWeight: 700, 
                              color: '#1e293b',
                              flex: 1
                            }}>
                              {analysis.conversation.article_title}
                            </div>
                            <div style={{ 
                              ...getScoreBadgeStyle(analysis.interest_score),
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap'
                            }}>
                              {analysis.interest_score}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{getProjectName(analysis.project_id)}</span>
                            <span>•</span>
                            <span>{formatDate(analysis.conversation.started_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Summary */}
                      {analysis.ai_summary && (
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#475569', 
                          marginBottom: '10px',
                          lineHeight: '1.5'
                        }}>
                          {analysis.ai_summary}
                        </div>
                      )}

                      {/* Tags */}
                      {analysis.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                          {analysis.tags.slice(0, expandedConv === analysis.id ? 999 : 5).map((tag, idx) => (
                            <span
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setTagFilter(tag.tag); }}
                              style={{
                                fontSize: '10px',
                                padding: '3px 8px',
                                background: 'rgba(37, 99, 235, 0.08)',
                                color: '#2563eb',
                                borderRadius: '4px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#2563eb'
                                e.currentTarget.style.color = '#fff'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(37, 99, 235, 0.08)'
                                e.currentTarget.style.color = '#2563eb'
                              }}
                            >
                              {formatTagName(tag.tag)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Key Insights - Show when expanded */}
                      {expandedConv === analysis.id && analysis.key_insights && analysis.key_insights.length > 0 && (
                        <div style={{ 
                          marginBottom: '10px',
                          padding: '10px',
                          background: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                            Key Insights
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                            {analysis.key_insights.map((insight, idx) => (
                              <li key={idx}>{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Scores */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '8px',
                        marginBottom: '10px'
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px', fontWeight: 600 }}>Engagement</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{Math.round(analysis.engagement_score)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px', fontWeight: 600 }}>Business</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{Math.round(analysis.business_score)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px', fontWeight: 600 }}>Content</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{Math.round(analysis.content_score)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px', fontWeight: 600 }}>Sentiment</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>{Math.round(analysis.sentiment_score)}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <ActionButton 
                          onClick={() => setExpandedConv(expandedConv === analysis.id ? null : analysis.id)}
                          style={{ flex: 1, minWidth: '120px', fontSize: '12px', padding: '6px 12px' }}
                        >
                          {expandedConv === analysis.id ? 'Show Less ▲' : 'Show More ▼'}
                        </ActionButton>
                        <ActionButton 
                          onClick={() => openConversation(analysis.conversation_id)}
                          style={{ flex: 1, minWidth: '120px', background: '#2563eb', color: '#fff', borderColor: '#2563eb', fontSize: '12px', padding: '6px 12px' }}
                        >
                          View Conversation
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Conversation Modal */}
      {selectedConversation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedConversation(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#1e293b', 
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedConversation.article_title}
                </h3>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                  <span>{getProjectName(selectedConversation.project_id)}</span>
                  <span>•</span>
                  <span>{selectedConversation.message_count} messages</span>
                  <span>•</span>
                  <span>{formatDate(selectedConversation.started_at)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((message, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '80%',
                      padding: '12px 16px',
                      borderRadius: message.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: message.role === 'user' ? '#2563eb' : '#f1f5f9',
                      color: message.role === 'user' ? '#fff' : '#1e293b',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}>
                      {message.content}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      marginTop: '4px',
                      padding: '0 4px'
                    }}>
                      {message.role === 'user' ? 'User' : 'Assistant'}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                  No messages in this conversation
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
