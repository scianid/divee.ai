-- Additional indexes to optimize Top Articles query performance

-- 1. GIN index on analytics_events.event_data for JSONB queries
-- This helps when extracting article_url from event_data in question counts
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_data_gin 
ON analytics_events USING gin (event_data);

-- 2. Partial index on analytics_impressions for non-null URLs
-- This optimizes the WHERE url IS NOT NULL filter in impression counts
CREATE INDEX IF NOT EXISTS idx_analytics_impressions_url_not_null 
ON analytics_impressions (project_id, created_at, url) 
WHERE url IS NOT NULL;

-- Note: These indexes specifically improve the get_top_articles_aggregated function
-- which groups impressions by URL and extracts article URLs from event JSONB data
