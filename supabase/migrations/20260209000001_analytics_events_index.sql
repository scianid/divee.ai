-- Add composite index for analytics_events to optimize time-based queries
-- This significantly improves performance for interactions over time aggregations

CREATE INDEX IF NOT EXISTS idx_analytics_events_project_created 
ON analytics_events (project_id, created_at);

-- Add index for created_at alone for date range scans
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
ON analytics_events (created_at);

-- Add composite index including event_type for total interactions aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_events_project_created_type 
ON analytics_events (project_id, created_at, event_type);
