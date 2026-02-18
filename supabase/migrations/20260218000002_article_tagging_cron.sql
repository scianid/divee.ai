-- Article Tagging Cron Job
-- Schedules the tag-articles edge function to run every 5 minutes.
-- Processes up to 20 untagged articles per tick across all projects.
-- Depends on: cron_config table (created in 20260217000001_analyze_conversations_cron.sql)

-- Unschedule first in case this migration is re-run
SELECT cron.unschedule('tag-articles') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'tag-articles');

SELECT cron.schedule(
  'tag-articles',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT value FROM cron_config WHERE key = 'supabase_url')
           || '/functions/v1/tag-articles?limit=20',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT value FROM cron_config WHERE key = 'service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Verify:
-- SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'tag-articles';
