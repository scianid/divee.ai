# Insights

## Overview

The Insights page provides publishers with actionable insights from user conversations with the AI widget. A scheduled cron job analyzes unprocessed conversations, applies intelligent tagging, scores conversations by publisher interest, and surfaces key findings.

## Current Implementation Status

### ✅ Completed Features

**Backend Infrastructure:**
- Database schema deployed with 4 tables:
  - `conversation_analysis` - stores AI analysis results and scores
  - `conversation_tags` - stores applied tags with confidence scores
  - `dashboard_metrics` - for future time-series aggregations
  - `conversation_percentiles` - for future percentile tracking
- Edge function: `analyze-conversations`
  - GPT-4o-mini powered analysis
  - Batch processing (10 conversations per run)
  - Admin-only access via service role
  - Tag application from 30+ tag taxonomy
  - Interest score calculation (0-100)

**Frontend:**
- **Insights Page** (`/insights`) - Main dashboard
  - **Priority Alert Banner** - Shows critical conversations requiring immediate attention
  - **Actionable Opportunity Cards:**
    - Content Gaps - Questions articles don't answer
    - Sales Leads - Users showing purchase intent
    - Feature Requests - Requested functionality
    - User Feedback - Criticisms to address
  - Overview KPI cards (Total Analyzed, High Interest Count, Avg Score)
  - **Time-series charts:**
    - Conversations analyzed over time (last 30 days)
    - Average interest score trend
  - **Interactive conversation list with:**
    - Color-coded priority badges (Critical/High/Medium/Low/Minimal)
    - Expandable cards showing full details
    - AI-generated summaries and key insights
    - Clickable tags for instant filtering
    - Component score breakdown (engagement, business, content, sentiment)
    - Action buttons: "View Full Conversation"
  - **Interactive tag distribution:**
    - Click any tag to filter conversations
    - Visual bar charts showing tag frequency
  - Project/widget filtering
- **Manual Analysis Trigger** - Admin button in Conversations page
  - Select project and click "Analyze Conversations"
  - Processes up to 10 unanalyzed conversations
  - Shows real-time feedback

### 🚧 Planned Features

- Automated cron job for continuous analysis
- Advanced filtering and search
- Export and reporting tools

## How to Use (Current Implementation)

### For Admins:

1. **Analyze Conversations**
   - Navigate to the **Conversations** page
   - Select a specific project/widget from the dropdown
   - Click the **"Analyze Conversations"** button (top right)
   - Wait for analysis to complete (processes 10 conversations)
   - Results are stored and immediately visible

2. **View Insights**
   - Navigate to the **Insights** page from the sidebar
   - View overview metrics and high-interest conversations
   - Use the project filter to focus on specific widgets
   - Review AI summaries, tags, and component scores
   - Identify conversations that need attention (score ≥ 70)

### Score Interpretation:

- **90-100 (Critical)**: Immediate attention needed - typically high-value business opportunities or critical content issues
- **70-89 (High)**: Review within 24 hours - significant insights or concerns
- **50-69 (Medium)**: Review weekly - moderate interest or feedback
- **30-49 (Low)**: Aggregate insights only
- **0-29 (Minimal)**: No action needed

### Tag Categories:

Conversations are automatically tagged across 6 categories:
1. **Content Quality**: content_gap, factual_error, clarification_needed, deep_dive, related_topic
2. **User Intent**: sell_potential, research_mode, casual_browsing, expert_user, beginner_user
3. **Sentiment**: criticism, praise, frustrated, engaged, skeptical
4. **Technical**: low_confidence, high_confidence, fallback_used, streaming_error, rate_limited
5. **Behavioral**: quick_exit, deep_conversation, suggestion_clicked, ad_interaction, mobile_user, returning_visitor
6. **Business Intelligence**: competitor_mention, feature_request, pain_point, price_sensitivity, decision_making

## Architecture

### Cron Job Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  Cron Job (Runs every 15-30 minutes)                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Fetch Unanalyzed Conversations                          │
│     - Query conversations where analyzed_at IS NULL          │
│     - Filter by project_id                                   │
│     - Batch size: 50-100 conversations                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. AI Analysis & Tagging                                    │
│     - Send conversation context to LLM                       │
│     - Apply automated tags                                   │
│     - Calculate interest score                               │
│     - Extract key insights                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Store Results                                            │
│     - Update conversation_tags table                         │
│     - Update interest_score                                  │
│     - Update analyzed_at timestamp                           │
│     - Store AI-generated summary                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  4. Aggregate Metrics                                        │
│     - Update dashboard_metrics table                         │
│     - Calculate percentiles                                  │
│     - Update time-series data                                │
└─────────────────────────────────────────────────────────────┘
```

## Conversation Tagging System

### Tag Categories

#### 1. Content Quality Tags
- **`content_gap`** - User asks questions the article doesn't answer
- **`factual_error`** - User points out inaccuracies in the article
- **`clarification_needed`** - User confused by article content
- **`deep_dive`** - User wants more detailed information
- **`related_topic`** - User interested in adjacent topics

#### 2. User Intent Tags
- **`sell_potential`** - User shows commercial/purchase intent
- **`research_mode`** - User gathering information for a project
- **`casual_browsing`** - Light engagement, simple questions
- **`expert_user`** - Advanced questions, domain expertise evident
- **`beginner_user`** - Basic questions, learning mode

#### 3. Sentiment Tags
- **`criticism`** - Negative feedback about content/site
- **`praise`** - Positive feedback, satisfied user
- **`frustrated`** - User expressing frustration or difficulty
- **`engaged`** - High engagement, multiple questions
- **`skeptical`** - User questioning claims or information

#### 4. Technical Tags
- **`low_confidence`** - AI responses uncertain or hedged
- **`high_confidence`** - AI provided definitive answers
- **`fallback_used`** - AI couldn't answer from article content
- **`streaming_error`** - Technical issues during conversation
- **`rate_limited`** - User hit rate limits

#### 5. Behavioral Tags
- **`quick_exit`** - User left after 1-2 questions
- **`deep_conversation`** - 5+ exchanges
- **`suggestion_clicked`** - User engaged with suggested articles
- **`ad_interaction`** - User interacted with ads
- **`mobile_user`** - Conversation from mobile device
- **`returning_visitor`** - User has previous conversations

#### 6. Business Intelligence Tags
- **`competitor_mention`** - User mentions competing products/sites
- **`feature_request`** - User wants specific functionality
- **`pain_point`** - User describes a problem to solve
- **`price_sensitivity`** - User asks about costs/pricing
- **`decision_making`** - User comparing options

## Interest Score Algorithm

### Scoring Formula (0-100)

```javascript
interest_score = (
  engagement_weight * engagement_score +
  business_weight * business_score +
  content_weight * content_score +
  sentiment_weight * sentiment_score
) / (engagement_weight + business_weight + content_weight + sentiment_weight)
```

### Score Components

#### Engagement Score (40% weight)
- Conversation length (messages)
- Time spent in conversation
- Question complexity
- Suggestion clicks
- Return visits

#### Business Score (30% weight)
- Sell potential tag: +30
- Competitor mention: +20
- Feature request: +25
- Pain point expressed: +20
- Price discussion: +15

#### Content Score (20% weight)
- Content gap identified: +25
- Factual error: +30
- Deep dive request: +15
- Related topics: +10
- Clarification needed: +20

#### Sentiment Score (10% weight)
- Criticism: +30 (valuable feedback)
- Frustrated: +25
- Praise: +10
- Skeptical: +20
- Engaged: +15

### Interest Score Ranges

- **90-100**: Critical - Immediate attention needed
- **70-89**: High - Review within 24 hours
- **50-69**: Medium - Review weekly
- **30-49**: Low - Aggregate insights only
- **0-29**: Minimal - No action needed

## Dashboard Metrics

### Key Performance Indicators

#### Real-Time Metrics
- Active conversations (last 24h)
- Average conversation length
- AI response confidence rate
- Tag distribution
- Interest score distribution

#### Time-Series Metrics (Graphs)

**1. Conversations Over Time**
```
Daily/Weekly/Monthly views
- Total conversations
- Conversations by tag category
- High-interest conversations (score > 70)
- Conversations with content gaps
```

**2. Conversation Duration Percentiles**
```
Track over time (daily/weekly):
- P10: 10th percentile (quick conversations)
- P25: 25th percentile
- P50: Median duration
- P75: 75th percentile
- P90: 90th percentile (deep conversations)
- P99: 99th percentile (extreme engagement)

Duration measured in:
- Number of messages
- Time spent (seconds)
- Questions asked
```

**3. Content Gap Trends**
```
Track recurring gaps by:
- Topic frequency
- Article correlation
- Question similarity clustering
```

**4. Business Opportunity Funnel**
```
sell_potential → price_discussion → competitor_mention → decision_making
Track conversion rates between stages
```

### Dashboard Views

#### 1. Overview Dashboard
- KPI cards (conversations, avg duration, top tags)
- Conversations over time (line chart)
- Tag distribution (pie chart)
- Interest score distribution (histogram)
- Duration percentiles (box plot over time)

#### 2. High-Interest Conversations
- List of scores > 70
- Sortable by score, date, tags
- Quick summary view
- Full conversation transcript
- Action buttons (mark reviewed, assign, flag)

#### 3. Content Intelligence
- Content gaps aggregated by article
- Recurring questions/themes
- Factual errors flagged
- Related topic suggestions
- User confusion patterns

#### 4. Business Intelligence
- Sell potential conversations
- Competitor intelligence
- Feature requests aggregated
- User pain points
- Price sensitivity insights

#### 5. Technical Health
- Low confidence rate over time
- Streaming errors
- Rate limit hits
- Response time percentiles
- AI model performance

## Database Schema

### New Tables

#### `conversation_analysis`
```sql
CREATE TABLE conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  
  -- Scoring
  interest_score INTEGER CHECK (interest_score BETWEEN 0 AND 100),
  engagement_score DECIMAL(5,2),
  business_score DECIMAL(5,2),
  content_score DECIMAL(5,2),
  sentiment_score DECIMAL(5,2),
  
  -- AI Analysis
  ai_summary TEXT,
  key_insights JSONB,
  
  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_version VARCHAR(50), -- Track AI model version
  
  -- Indexes
  CREATE INDEX idx_conversation_analysis_project ON conversation_analysis(project_id);
  CREATE INDEX idx_conversation_analysis_score ON conversation_analysis(interest_score);
  CREATE INDEX idx_conversation_analysis_date ON conversation_analysis(analyzed_at);
);
```

#### `conversation_tags`
```sql
CREATE TABLE conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  confidence DECIMAL(5,4), -- AI confidence in tag (0-1)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite index for fast lookups
  CREATE UNIQUE INDEX idx_conversation_tags_unique 
    ON conversation_tags(conversation_id, tag);
  CREATE INDEX idx_conversation_tags_tag ON conversation_tags(tag);
);
```

#### `dashboard_metrics`
```sql
CREATE TABLE dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  metric_date DATE NOT NULL,
  metric_type VARCHAR(100) NOT NULL, -- 'conversation_count', 'duration_p50', etc.
  
  -- Metric values
  numeric_value DECIMAL(10,2),
  json_value JSONB, -- For complex metrics
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite index
  CREATE UNIQUE INDEX idx_dashboard_metrics_unique 
    ON dashboard_metrics(project_id, metric_date, metric_type);
  CREATE INDEX idx_dashboard_metrics_date ON dashboard_metrics(metric_date);
);
```

#### `conversation_percentiles`
```sql
CREATE TABLE conversation_percentiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  date DATE NOT NULL,
  
  -- Message count percentiles
  messages_p10 INTEGER,
  messages_p25 INTEGER,
  messages_p50 INTEGER,
  messages_p75 INTEGER,
  messages_p90 INTEGER,
  messages_p99 INTEGER,
  
  -- Duration percentiles (seconds)
  duration_p10 INTEGER,
  duration_p25 INTEGER,
  duration_p50 INTEGER,
  duration_p75 INTEGER,
  duration_p90 INTEGER,
  duration_p99 INTEGER,
  
  -- Question count percentiles
  questions_p10 INTEGER,
  questions_p25 INTEGER,
  questions_p50 INTEGER,
  questions_p75 INTEGER,
  questions_p90 INTEGER,
  questions_p99 INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CREATE UNIQUE INDEX idx_conversation_percentiles_unique 
    ON conversation_percentiles(project_id, date);
);
```

## Cron Job Implementation

### Supabase Edge Function: `analyze-conversations`

```typescript
// supabase/functions/analyze-conversations/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 50
const ANALYSIS_MODEL = 'gpt-4o-mini' // Fast and cost-effective

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // 1. Fetch unanalyzed conversations
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        project_id,
        visitor_id,
        session_id,
        created_at,
        updated_at,
        messages,
        url,
        article_title
      `)
      .is('analyzed_at', null)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)
    
    if (error) throw error
    
    const results = []
    
    // 2. Analyze each conversation
    for (const conversation of conversations) {
      try {
        const analysis = await analyzeConversation(conversation)
        
        // Store analysis
        await storeAnalysis(supabase, conversation.id, analysis)
        
        results.push({
          conversation_id: conversation.id,
          status: 'success',
          interest_score: analysis.interest_score
        })
      } catch (err) {
        console.error(`Failed to analyze ${conversation.id}:`, err)
        results.push({
          conversation_id: conversation.id,
          status: 'error',
          error: err.message
        })
      }
    }
    
    // 3. Update aggregate metrics
    await updateDashboardMetrics(supabase)
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: conversations.length,
        results
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeConversation(conversation: any) {
  // Prepare conversation context for LLM
  const context = prepareConversationContext(conversation)
  
  // Call OpenAI/Anthropic for analysis
  const systemPrompt = `You are analyzing user conversations with an AI article assistant.
Your task is to:
1. Identify relevant tags from the predefined taxonomy
2. Calculate component scores for engagement, business value, content quality, and sentiment
3. Provide a brief summary and key insights

Tag taxonomy: content_gap, sell_potential, criticism, low_confidence, high_confidence, 
factual_error, clarification_needed, deep_dive, related_topic, research_mode, 
casual_browsing, expert_user, beginner_user, praise, frustrated, engaged, skeptical,
quick_exit, deep_conversation, suggestion_clicked, competitor_mention, feature_request,
pain_point, price_sensitivity, decision_making, mobile_user, returning_visitor

Return a JSON object with:
{
  "tags": [{"tag": "tag_name", "confidence": 0.95}],
  "engagement_score": 75,
  "business_score": 40,
  "content_score": 60,
  "sentiment_score": 50,
  "summary": "Brief summary",
  "key_insights": ["insight1", "insight2"]
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  })
  
  const result = await response.json()
  const analysis = JSON.parse(result.choices[0].message.content)
  
  // Calculate final interest score
  const interest_score = calculateInterestScore(
    analysis.engagement_score,
    analysis.business_score,
    analysis.content_score,
    analysis.sentiment_score
  )
  
  return { ...analysis, interest_score }
}

function calculateInterestScore(
  engagement: number,
  business: number,
  content: number,
  sentiment: number
): number {
  const weights = {
    engagement: 0.4,
    business: 0.3,
    content: 0.2,
    sentiment: 0.1
  }
  
  return Math.round(
    engagement * weights.engagement +
    business * weights.business +
    content * weights.content +
    sentiment * weights.sentiment
  )
}

function prepareConversationContext(conversation: any): string {
  const messages = conversation.messages || []
  const messageCount = messages.length
  const duration = conversation.updated_at 
    ? new Date(conversation.updated_at).getTime() - new Date(conversation.created_at).getTime()
    : 0
  
  return `
Article: ${conversation.article_title}
URL: ${conversation.url}
Created: ${conversation.created_at}
Message Count: ${messageCount}
Duration: ${Math.round(duration / 1000)}s

Conversation:
${messages.map((m: any, i: number) => 
  `${i + 1}. ${m.role.toUpperCase()}: ${m.content}`
).join('\n')}
`
}

async function storeAnalysis(supabase: any, conversationId: string, analysis: any) {
  // Insert analysis record
  await supabase.from('conversation_analysis').insert({
    conversation_id: conversationId,
    interest_score: analysis.interest_score,
    engagement_score: analysis.engagement_score,
    business_score: analysis.business_score,
    content_score: analysis.content_score,
    sentiment_score: analysis.sentiment_score,
    ai_summary: analysis.summary,
    key_insights: analysis.key_insights,
    analysis_version: ANALYSIS_MODEL
  })
  
  // Insert tags
  if (analysis.tags && analysis.tags.length > 0) {
    await supabase.from('conversation_tags').insert(
      analysis.tags.map((t: any) => ({
        conversation_id: conversationId,
        tag: t.tag,
        confidence: t.confidence
      }))
    )
  }
  
  // Mark conversation as analyzed
  await supabase
    .from('conversations')
    .update({ analyzed_at: new Date().toISOString() })
    .eq('id', conversationId)
}

async function updateDashboardMetrics(supabase: any) {
  // Calculate daily aggregates
  const today = new Date().toISOString().split('T')[0]
  
  // This would include queries to calculate percentiles, counts, etc.
  // and store in dashboard_metrics and conversation_percentiles tables
}
```

### Cron Schedule

```bash
# Run every 15 minutes
*/15 * * * * curl -X POST https://[project].supabase.co/functions/v1/analyze-conversations \
  -H "Authorization: Bearer [anon-key]"
```

Or use Supabase's built-in cron:

```sql
-- In Supabase SQL Editor
SELECT cron.schedule(
  'analyze-conversations',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://[project].supabase.co/functions/v1/analyze-conversations',
    headers := '{"Authorization": "Bearer [service-role-key]"}'::jsonb
  ) AS request_id;
  $$
);
```

## Front-End Dashboard Components

### React Component Structure

```
/dashboard
  /components
    - OverviewMetrics.tsx
    - ConversationTimeSeries.tsx
    - DurationPercentilesChart.tsx
    - TagDistribution.tsx
    - InterestScoreHistogram.tsx
    - HighInterestList.tsx
    - ContentGapsTable.tsx
    - BusinessInsights.tsx
```

### Example: Duration Percentiles Chart

```typescript
// Using Recharts or similar
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export function DurationPercentilesChart({ data, metric = 'messages' }) {
  return (
    <LineChart width={800} height={400} data={data}>
      <XAxis dataKey="date" />
      <YAxis label={{ value: `${metric} count`, angle: -90 }} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey={`${metric}_p10`} stroke="#e5e7eb" name="P10" />
      <Line type="monotone" dataKey={`${metric}_p25`} stroke="#d1d5db" name="P25" />
      <Line type="monotone" dataKey={`${metric}_p50`} stroke="#3b82f6" name="Median" strokeWidth={2} />
      <Line type="monotone" dataKey={`${metric}_p75`} stroke="#d1d5db" name="P75" />
      <Line type="monotone" dataKey={`${metric}_p90`} stroke="#e5e7eb" name="P90" />
    </LineChart>
  )
}
```

## API Endpoints for Dashboard

### GET `/api/dashboard/overview`
Returns KPIs and summary metrics for a project.

### GET `/api/dashboard/conversations-over-time`
Query params: `projectId`, `startDate`, `endDate`, `granularity` (day/week/month)

### GET `/api/dashboard/percentiles`
Query params: `projectId`, `startDate`, `endDate`, `metric` (messages/duration/questions)

### GET `/api/dashboard/high-interest`
Query params: `projectId`, `minScore`, `limit`, `offset`

### GET `/api/dashboard/content-gaps`
Returns aggregated content gaps by article

### GET `/api/dashboard/tags`
Returns tag distribution and trends

## Implementation Phases

### Phase 1: Core Infrastructure ✅ COMPLETED
- [x] Create database tables (conversation_analysis, conversation_tags, dashboard_metrics, conversation_percentiles)
- [x] Implement analyze-conversations edge function
- [x] Set up AI analysis pipeline (GPT-4o-mini)
- [x] Basic tagging system (30+ tags across 6 categories)
- [x] Admin manual trigger button in Conversations page
- [x] Interest score algorithm (weighted: engagement 40%, business 30%, content 20%, sentiment 10%)

### Phase 2: Dashboard UI ✅ COMPLETED
- [x] Insights page with navigation
- [x] Overview KPI cards (total analyzed, high-interest count, avg score)
- [x] High-interest conversations list with scores, summaries, and tags
- [x] Top tags distribution visualization
- [x] Project filtering
- [x] Color-coded priority indicators
- [x] Empty states and loading indicators

### Phase 3: Advanced Features 🚧 IN PROGRESS
- [ ] Automated cron job (currently manual trigger only)
- [x] Conversations over time chart
- [x] Average interest score trend chart
- [ ] Duration percentiles tracking
- [ ] Content gap clustering by article
- [ ] Business intelligence aggregations

### Phase 4: Future Enhancements
- [ ] Email alerts for high-interest conversations
- [ ] Export and reporting tools
- [ ] Advanced filtering and search
- [ ] Performance optimization for large datasets
- [ ] Dashboard metrics caching

## Monitoring & Maintenance

### Cron Job Health Checks
- Track execution time
- Monitor batch processing failures
- Alert on repeated failures
- Track AI API costs

### Data Quality
- Validate interest scores distribution
- Check for tag anomalies
- Monitor conversation completeness
- Audit AI analysis quality

### Performance
- Index optimization for large datasets
- Archive old analyzed conversations
- Aggregate metrics caching
- Dashboard query optimization

## Privacy & Compliance

- Anonymize personal information in conversations
- Implement data retention policies
- Allow conversation deletion
- GDPR/CCPA compliance for analytics
- Publisher access controls by project

## Cost Considerations

### AI Analysis Costs
- ~$0.002 per conversation (GPT-4o-mini)
- 1000 conversations/day = $2/day = $60/month
- Budget monitoring and alerts

### Database Storage
- Estimate 5KB per analyzed conversation
- 100K conversations = ~500MB
- Percentile tables minimal overhead

### Optimization Strategies
- Batch processing to reduce API calls
- Cache common analysis patterns
- Use smaller models for simple conversations
- Implement analysis priority queue (high-traffic articles first)

---

## Next Steps

### Immediate (Phase 3)
1. ✅ ~~Validate tag taxonomy with real conversation samples~~ - Implemented with 30+ tags
2. ✅ ~~Prototype interest score on historical data~~ - Live with weighted algorithm
3. ✅ ~~Design dashboard mockups for user feedback~~ - Insights page deployed
4. ✅ ~~Add time-series visualizations~~ - Conversations over time and interest score trends deployed
5. **Set up automated cron job** for continuous analysis (currently manual only)

### Short-term
- Implement conversation detail modal/page with full transcript
- Add filtering by tags and score ranges
- Create content gap aggregation by article
- Build business intelligence reports

### Long-term
- Email notifications for critical conversations (score > 90)
- Advanced analytics and ML-based insights
- A/B testing for conversation quality improvements
- Integration with content management systems
