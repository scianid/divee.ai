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

-- Add indexes for analytics_impressions to optimize top articles query
CREATE INDEX IF NOT EXISTS idx_analytics_impressions_project_created 
ON analytics_impressions (project_id, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_impressions_project_url_created 
ON analytics_impressions (project_id, url, created_at);

-- Add index for impressions by location aggregation
CREATE INDEX IF NOT EXISTS idx_analytics_impressions_project_geo 
ON analytics_impressions (project_id, created_at, geo_country, geo_city);

-- Add index on article.url for JOIN optimization
CREATE INDEX IF NOT EXISTS idx_article_url 
ON article (url);
