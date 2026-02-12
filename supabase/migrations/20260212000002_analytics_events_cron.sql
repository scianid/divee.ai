-- Analytics Events Hourly Aggregation Cron Job
-- This schedules an hourly job to aggregate new events

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions to postgres role for cron
-- (Supabase typically needs this for cron jobs)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule hourly aggregation job
-- Runs at 5 minutes past every hour to aggregate the previous hour
SELECT cron.schedule(
  'aggregate-analytics-events-hourly',  -- Job name
  '5 * * * *',  -- Cron expression: Run at 5 minutes past every hour
  $$
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
  WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
    AND created_at < date_trunc('hour', NOW())
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
  $$
);

-- Comment to describe the job
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL';

-- To verify the cron job was created, run:
-- SELECT * FROM cron.job WHERE jobname = 'aggregate-analytics-events-hourly';

-- To view job run history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'aggregate-analytics-events-hourly') ORDER BY start_time DESC LIMIT 10;
