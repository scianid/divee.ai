-- Analytics Impressions Hourly Aggregation Cron Job
-- This schedules an hourly job to aggregate new impressions at all 3 levels

-- Schedule hourly aggregation job
-- Runs at 7 minutes past every hour (after events aggregation)
SELECT cron.schedule(
  'aggregate-analytics-impressions-hourly',
  '7 * * * *',  -- Run at 7 minutes past every hour
  $$
  -- Level 1: Total by hour
  INSERT INTO public.analytics_impressions_hourly_agg (
    project_id, hour_bucket, platform, geo_country,
    impression_count, unique_visitors, unique_sessions, unique_urls
  )
  SELECT 
    project_id, 
    date_trunc('hour', created_at) as hour_bucket, 
    NULL as platform, 
    NULL as geo_country,
    COUNT(*) as impression_count,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT url) as unique_urls
  FROM public.analytics_impressions
  WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
    AND created_at < date_trunc('hour', NOW())
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
    COALESCE(platform, 'Unknown') as platform, 
    NULL as geo_country,
    COUNT(*) as impression_count,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT url) as unique_urls
  FROM public.analytics_impressions
  WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
    AND created_at < date_trunc('hour', NOW())
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
    NULL as platform, 
    geo_country,
    COUNT(*) as impression_count,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT url) as unique_urls
  FROM public.analytics_impressions
  WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
    AND created_at < date_trunc('hour', NOW())
    AND geo_country IS NOT NULL
  GROUP BY project_id, date_trunc('hour', created_at), geo_country
  ON CONFLICT (project_id, hour_bucket, platform, geo_country)
  DO UPDATE SET
    impression_count = EXCLUDED.impression_count,
    unique_visitors = EXCLUDED.unique_visitors,
    unique_sessions = EXCLUDED.unique_sessions,
    unique_urls = EXCLUDED.unique_urls,
    updated_at = NOW();
  $$
);

-- To verify the cron job was created, run:
-- SELECT * FROM cron.job WHERE jobname = 'aggregate-analytics-impressions-hourly';

-- To view job run history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'aggregate-analytics-impressions-hourly') ORDER BY start_time DESC LIMIT 10;
