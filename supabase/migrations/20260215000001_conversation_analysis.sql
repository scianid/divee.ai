-- Add missing columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS url TEXT;

-- Create index for unanalyzed conversations queries
CREATE INDEX IF NOT EXISTS idx_conversations_analyzed_at 
ON conversations(project_id, analyzed_at) 
WHERE analyzed_at IS NULL;

-- Create conversation_analysis table
CREATE TABLE IF NOT EXISTS conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  
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
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analysis_version VARCHAR(50), -- Track AI model version
  
  -- Constraints
  CONSTRAINT conversation_analysis_conversation_id_unique UNIQUE(conversation_id)
);

-- Indexes for conversation_analysis
CREATE INDEX IF NOT EXISTS idx_conversation_analysis_project 
ON conversation_analysis(project_id);

CREATE INDEX IF NOT EXISTS idx_conversation_analysis_score 
ON conversation_analysis(interest_score DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_analysis_date 
ON conversation_analysis(analyzed_at DESC);

-- Create conversation_tags table
CREATE TABLE IF NOT EXISTS conversation_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  confidence DECIMAL(5,4), -- AI confidence in tag (0-1)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite unique constraint
  CONSTRAINT conversation_tags_unique UNIQUE(conversation_id, tag)
);

-- Indexes for conversation_tags
CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag 
ON conversation_tags(tag);

CREATE INDEX IF NOT EXISTS idx_conversation_tags_conversation 
ON conversation_tags(conversation_id);

-- Create dashboard_metrics table
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  metric_type VARCHAR(100) NOT NULL, -- 'conversation_count', 'duration_p50', etc.
  
  -- Metric values
  numeric_value DECIMAL(10,2),
  json_value JSONB, -- For complex metrics
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite unique constraint
  CONSTRAINT dashboard_metrics_unique UNIQUE(project_id, metric_date, metric_type)
);

-- Indexes for dashboard_metrics
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_date 
ON dashboard_metrics(metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_project_type 
ON dashboard_metrics(project_id, metric_type, metric_date DESC);

-- Create conversation_percentiles table
CREATE TABLE IF NOT EXISTS conversation_percentiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
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
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Composite unique constraint
  CONSTRAINT conversation_percentiles_unique UNIQUE(project_id, date)
);

-- Indexes for conversation_percentiles
CREATE INDEX IF NOT EXISTS idx_conversation_percentiles_project_date 
ON conversation_percentiles(project_id, date DESC);

-- Enable RLS on new tables
ALTER TABLE conversation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_percentiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view conversation analysis for projects they have access to
CREATE POLICY "Users can view conversation_analysis for their projects"
ON conversation_analysis
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
    
    UNION
    
    SELECT p.project_id 
    FROM project p
    INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
    WHERE ac.user_id = auth.uid()
  )
);

-- RLS Policy: Users can view conversation tags for projects they have access to
CREATE POLICY "Users can view conversation_tags for their projects"
ON conversation_tags
FOR SELECT
USING (
  conversation_id IN (
    SELECT c.id 
    FROM conversations c
    WHERE c.project_id IN (
      SELECT p.project_id 
      FROM project p
      INNER JOIN account a ON p.account_id = a.id
      WHERE a.user_id = auth.uid()
      
      UNION
      
      SELECT p.project_id 
      FROM project p
      INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
      WHERE ac.user_id = auth.uid()
    )
  )
);

-- RLS Policy: Users can view dashboard metrics for their projects
CREATE POLICY "Users can view dashboard_metrics for their projects"
ON dashboard_metrics
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
    
    UNION
    
    SELECT p.project_id 
    FROM project p
    INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
    WHERE ac.user_id = auth.uid()
  )
);

-- RLS Policy: Users can view conversation percentiles for their projects
CREATE POLICY "Users can view conversation_percentiles for their projects"
ON conversation_percentiles
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
    
    UNION
    
    SELECT p.project_id 
    FROM project p
    INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
    WHERE ac.user_id = auth.uid()
  )
);
