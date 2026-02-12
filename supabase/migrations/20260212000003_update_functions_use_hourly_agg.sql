-- Update stored functions to use analytics_events_hourly_agg table
-- This improves performance by querying pre-aggregated data instead of raw events

-- 1. Update get_interactions_over_time_aggregated to use hourly agg table
CREATE OR REPLACE FUNCTION get_interactions_over_time_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_by TEXT DEFAULT 'hour'
)
RETURNS TABLE (
  date TIMESTAMPTZ,
  count BIGINT
) AS $$
BEGIN
  IF p_group_by = 'hour' THEN
    RETURN QUERY
    SELECT 
      hour_bucket AS date,
      SUM(event_count)::BIGINT AS count
    FROM analytics_events_hourly_agg
    WHERE 
      project_id = ANY(p_project_ids)
      AND hour_bucket >= p_start_date
      AND hour_bucket <= p_end_date
    GROUP BY hour_bucket
    ORDER BY hour_bucket ASC;
  ELSE
    RETURN QUERY
    SELECT 
      date_trunc('day', hour_bucket) AS date,
      SUM(event_count)::BIGINT AS count
    FROM analytics_events_hourly_agg
    WHERE 
      project_id = ANY(p_project_ids)
      AND hour_bucket >= p_start_date
      AND hour_bucket <= p_end_date
    GROUP BY date_trunc('day', hour_bucket)
    ORDER BY date_trunc('day', hour_bucket) ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update get_widget_visible_over_time_aggregated to use hourly agg table
CREATE OR REPLACE FUNCTION get_widget_visible_over_time_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_by TEXT DEFAULT 'hour'
)
RETURNS TABLE (
  date TIMESTAMPTZ,
  count BIGINT
) AS $$
BEGIN
  IF p_group_by = 'hour' THEN
    RETURN QUERY
    SELECT 
      hour_bucket AS date,
      SUM(event_count)::BIGINT AS count
    FROM analytics_events_hourly_agg
    WHERE 
      project_id = ANY(p_project_ids)
      AND event_type = 'widget_visible'
      AND hour_bucket >= p_start_date
      AND hour_bucket <= p_end_date
    GROUP BY hour_bucket
    ORDER BY hour_bucket ASC;
  ELSE
    RETURN QUERY
    SELECT 
      date_trunc('day', hour_bucket) AS date,
      SUM(event_count)::BIGINT AS count
    FROM analytics_events_hourly_agg
    WHERE 
      project_id = ANY(p_project_ids)
      AND event_type = 'widget_visible'
      AND hour_bucket >= p_start_date
      AND hour_bucket <= p_end_date
    GROUP BY date_trunc('day', hour_bucket)
    ORDER BY date_trunc('day', hour_bucket) ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update get_total_interactions_aggregated to use hourly agg table
CREATE OR REPLACE FUNCTION get_total_interactions_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  event_type TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    agg.event_type,
    SUM(agg.event_count)::BIGINT AS count
  FROM analytics_events_hourly_agg agg
  WHERE 
    agg.project_id = ANY(p_project_ids)
    AND agg.hour_bucket >= p_start_date
    AND agg.hour_bucket <= p_end_date
  GROUP BY agg.event_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update get_ad_impressions_aggregated to use hourly agg table
CREATE OR REPLACE FUNCTION get_ad_impressions_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_by TEXT DEFAULT 'hour'
)
RETURNS TABLE (
  date TIMESTAMPTZ,
  count BIGINT
) AS $$
BEGIN
  IF p_group_by = 'hour' THEN
    RETURN QUERY
    SELECT 
      hour_bucket AS date,
      SUM(event_count)::BIGINT AS count
    FROM analytics_events_hourly_agg
    WHERE 
      project_id = ANY(p_project_ids)
      AND event_type = 'ad_impression'
      AND hour_bucket >= p_start_date
      AND hour_bucket <= p_end_date
    GROUP BY hour_bucket
    ORDER BY hour_bucket ASC;
  ELSE
    RETURN QUERY
    SELECT 
      date_trunc('day', hour_bucket) AS date,
      SUM(event_count)::BIGINT AS count
    FROM analytics_events_hourly_agg
    WHERE 
      project_id = ANY(p_project_ids)
      AND event_type = 'ad_impression'
      AND hour_bucket >= p_start_date
      AND hour_bucket <= p_end_date
    GROUP BY date_trunc('day', hour_bucket)
    ORDER BY date_trunc('day', hour_bucket) ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions remain the same (already granted in previous migrations)
