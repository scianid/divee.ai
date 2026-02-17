-- Conversation Analysis Hourly Cron Job
-- This schedules an hourly job to analyze unanalyzed conversations
-- 
-- SETUP REQUIRED:
-- After running this migration, update the cron_config table with your Supabase URL and service role key:
--   UPDATE cron_config 
--   SET value = 'https://your-project-ref.supabase.co' 
--   WHERE key = 'supabase_url';
--
--   UPDATE cron_config 
--   SET value = 'your-service-role-key' 
--   WHERE key = 'service_role_key';

-- Create config table for cron jobs
CREATE TABLE IF NOT EXISTS cron_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config values (you must update these after migration)
INSERT INTO cron_config (key, value, description) VALUES
  ('supabase_url', 'https://REPLACE_WITH_YOUR_PROJECT_REF.supabase.co', 'Base URL for Supabase API'),
  ('service_role_key', 'REPLACE_WITH_YOUR_SERVICE_ROLE_KEY', 'Service role key for authenticated requests')
ON CONFLICT (key) DO NOTHING;

-- Schedule conversation analysis job
-- Note: pg_cron and pg_net extensions are already enabled in Supabase
-- Runs every 5 minutes to analyze up to 10 unanalyzed conversations
SELECT cron.schedule(
  'analyze-conversations-hourly',
  '*/5 * * * *',  -- Run every 5 minutes
  $$
  SELECT net.http_post(
    url := (SELECT value FROM cron_config WHERE key = 'supabase_url') || '/functions/v1/analyze-conversations?limit=10',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM cron_config WHERE key = 'service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000  -- 60 second timeout
  );
  $$
);

-- To verify the cron job was created, run:
-- SELECT * FROM cron.job WHERE jobname = 'analyze-conversations-hourly';

-- To view job run history with status and errors:
-- SELECT 
--   jrd.runid,
--   jrd.start_time,
--   jrd.end_time,
--   jrd.status,
--   jrd.return_message,
--   CASE 
--     WHEN jrd.status = 'succeeded' THEN '✓ Success'
--     WHEN jrd.status = 'failed' THEN '✗ Failed'
--     ELSE jrd.status
--   END as result
-- FROM cron.job_run_details jrd
-- WHERE jrd.jobid = (SELECT jobid FROM cron.job WHERE jobname = 'analyze-conversations-hourly')
-- ORDER BY jrd.start_time DESC 
-- LIMIT 10;

-- To view all cron jobs with their last run status:
-- SELECT 
--   j.jobname,
--   j.schedule,
--   j.active,
--   (SELECT jrd.start_time 
--    FROM cron.job_run_details jrd 
--    WHERE jrd.jobid = j.jobid 
--    ORDER BY jrd.start_time DESC 
--    LIMIT 1) as last_run,
--   (SELECT jrd.status 
--    FROM cron.job_run_details jrd 
--    WHERE jrd.jobid = j.jobid 
--    ORDER BY jrd.start_time DESC 
--    LIMIT 1) as last_status,
--   (SELECT jrd.return_message 
--    FROM cron.job_run_details jrd 
--    WHERE jrd.jobid = j.jobid 
--    ORDER BY jrd.start_time DESC 
--    LIMIT 1) as last_message
-- FROM cron.job j
-- ORDER BY j.jobname;

-- To manually trigger (for testing):
-- SELECT net.http_post(
--   url := (SELECT value FROM cron_config WHERE key = 'supabase_url') || '/functions/v1/analyze-conversations?limit=10',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer ' || (SELECT value FROM cron_config WHERE key = 'service_role_key')
--   ),
--   body := '{}'::jsonb
-- );

-- To view current config:
-- SELECT * FROM cron_config;

-- To unschedule (if needed):
-- SELECT cron.unschedule('analyze-conversations-hourly');
