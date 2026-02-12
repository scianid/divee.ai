-- Analytics Impressions Hourly Aggregation - Backfill Script
-- Run this AFTER the main table migration to populate historical data
-- Can be run in smaller batches to avoid timeouts

-- OPTION 1: Backfill last 30 days (faster, recommended for first run)
-- Run each level separately, then increase time range if needed

-- Level 1: Total by hour
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  NULL, NULL,
  COUNT(*), 
  COUNT(DISTINCT visitor_id), 
  COUNT(DISTINCT session_id), 
  COUNT(DISTINCT url)
FROM public.analytics_impressions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY project_id, date_trunc('hour', created_at)
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();

-- Level 2: By platform
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  COALESCE(platform, 'Unknown'), NULL,
  COUNT(*), 
  COUNT(DISTINCT visitor_id), 
  COUNT(DISTINCT session_id), 
  COUNT(DISTINCT url)
FROM public.analytics_impressions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY project_id, date_trunc('hour', created_at), COALESCE(platform, 'Unknown')
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();

-- Level 3: By country
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  NULL, geo_country,
  COUNT(*), 
  COUNT(DISTINCT visitor_id), 
  COUNT(DISTINCT session_id), 
  COUNT(DISTINCT url)
FROM public.analytics_impressions
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND geo_country IS NOT NULL
GROUP BY project_id, date_trunc('hour', created_at), geo_country
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();


-- OPTION 2: Backfill ALL history (slower, run after Option 1 succeeds)
-- Remove the WHERE date filter to process all data
-- Uncomment and run only after the 30-day backfill completes successfully

/*
-- Level 1: Total by hour (all history)
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  NULL, NULL,
  COUNT(*), 
  COUNT(DISTINCT visitor_id), 
  COUNT(DISTINCT session_id), 
  COUNT(DISTINCT url)
FROM public.analytics_impressions
GROUP BY project_id, date_trunc('hour', created_at)
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();

-- Level 2: By platform (all history)
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  COALESCE(platform, 'Unknown'), NULL,
  COUNT(*), 
  COUNT(DISTINCT visitor_id), 
  COUNT(DISTINCT session_id), 
  COUNT(DISTINCT url)
FROM public.analytics_impressions
GROUP BY project_id, date_trunc('hour', created_at), COALESCE(platform, 'Unknown')
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();

-- Level 3: By country (all history)
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  NULL, geo_country,
  COUNT(*), 
  COUNT(DISTINCT visitor_id), 
  COUNT(DISTINCT session_id), 
  COUNT(DISTINCT url)
FROM public.analytics_impressions
WHERE geo_country IS NOT NULL
GROUP BY project_id, date_trunc('hour', created_at), geo_country
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();
*/

-- Verify backfill results
SELECT 
  COUNT(*) as total_rows,
  MIN(hour_bucket) as earliest_hour,
  MAX(hour_bucket) as latest_hour,
  COUNT(DISTINCT project_id) as unique_projects,
  COUNT(*) FILTER (WHERE platform IS NULL AND geo_country IS NULL) as level1_rows,
  COUNT(*) FILTER (WHERE platform IS NOT NULL AND geo_country IS NULL) as level2_rows,
  COUNT(*) FILTER (WHERE platform IS NULL AND geo_country IS NOT NULL) as level3_rows
FROM analytics_impressions_hourly_agg;
