-- Analytics Events Hourly Aggregation - Backfill Script
-- Run this AFTER the main table migration to populate historical data
-- Can be run in smaller batches to avoid timeouts

-- OPTION 1: Backfill last 30 days (faster, recommended for first run)

INSERT INTO public.analytics_events_hourly_agg (
  project_id,
  event_type,
  event_label,
  hour_bucket,
  event_count,
  unique_visitors,
  unique_sessions
)
SELECT 
  project_id,
  event_type,
  event_label,
  date_trunc('hour', created_at) as hour_bucket,
  COUNT(*) as event_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 
  project_id,
  event_type,
  event_label,
  date_trunc('hour', created_at)
ON CONFLICT (project_id, event_type, event_label, hour_bucket)
DO UPDATE SET
  event_count = EXCLUDED.event_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  updated_at = NOW();


-- OPTION 2: Backfill ALL history (slower, run after Option 1 succeeds)
-- Remove the WHERE date filter to process all data
-- Uncomment and run only after the 30-day backfill completes successfully

/*
INSERT INTO public.analytics_events_hourly_agg (
  project_id,
  event_type,
  event_label,
  hour_bucket,
  event_count,
  unique_visitors,
  unique_sessions
)
SELECT 
  project_id,
  event_type,
  event_label,
  date_trunc('hour', created_at) as hour_bucket,
  COUNT(*) as event_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.analytics_events
GROUP BY 
  project_id,
  event_type,
  event_label,
  date_trunc('hour', created_at)
ON CONFLICT (project_id, event_type, event_label, hour_bucket)
DO UPDATE SET
  event_count = EXCLUDED.event_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  updated_at = NOW();
*/


-- Verify backfill results
SELECT 
  COUNT(*) as total_rows,
  MIN(hour_bucket) as earliest_hour,
  MAX(hour_bucket) as latest_hour,
  COUNT(DISTINCT project_id) as unique_projects,
  COUNT(DISTINCT event_type) as unique_event_types,
  SUM(event_count) as total_events
FROM analytics_events_hourly_agg;
