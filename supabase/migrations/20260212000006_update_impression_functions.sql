-- Update stored functions to use analytics_impressions_hourly_agg table
-- This improves performance by querying pre-aggregated data instead of raw impressions

-- 1. Update get_impressions_over_time_aggregated to use hourly agg table
CREATE OR REPLACE FUNCTION get_impressions_over_time_aggregated(
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
      SUM(impression_count)::BIGINT AS count
    FROM analytics_impressions_hourly_agg
    WHERE 
      project_id = ANY(p_project_ids)
      AND hour_bucket >= p_start_date
      AND hour_bucket <= p_end_date
      AND platform IS NULL
      AND geo_country IS NULL
    GROUP BY hour_bucket
    ORDER BY hour_bucket ASC;
  ELSE
    RETURN QUERY
    SELECT 
      date_trunc('day', hour_bucket) AS date,
      SUM(impression_count)::BIGINT AS count
    FROM analytics_impressions_hourly_agg
    WHERE 
      project_id = ANY(p_project_ids)
      AND hour_bucket >= p_start_date
      AND hour_bucket <= p_end_date
      AND platform IS NULL
      AND geo_country IS NULL
    GROUP BY date_trunc('day', hour_bucket)
    ORDER BY date_trunc('day', hour_bucket) ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update get_impressions_by_widget_aggregated to use hourly agg table
CREATE OR REPLACE FUNCTION get_impressions_by_widget_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  project_id TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    agg.project_id::TEXT AS project_id,
    SUM(agg.impression_count)::BIGINT AS count
  FROM analytics_impressions_hourly_agg agg
  WHERE 
    agg.project_id = ANY(p_project_ids)
    AND agg.hour_bucket >= p_start_date
    AND agg.hour_bucket <= p_end_date
    AND agg.platform IS NULL
    AND agg.geo_country IS NULL
  GROUP BY agg.project_id
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update get_impressions_by_platform_aggregated to use hourly agg table
CREATE OR REPLACE FUNCTION get_impressions_by_platform_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  platform TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    agg.platform,
    SUM(agg.impression_count)::BIGINT AS count
  FROM analytics_impressions_hourly_agg agg
  WHERE 
    agg.project_id = ANY(p_project_ids)
    AND agg.hour_bucket >= p_start_date
    AND agg.hour_bucket <= p_end_date
    AND agg.platform IS NOT NULL
    AND agg.geo_country IS NULL
  GROUP BY agg.platform
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: get_impressions_by_location_aggregated and get_top_articles_aggregated
-- continue to use the raw analytics_impressions table as they need detailed data
-- (city/coordinates and URL-level data respectively)

-- Grant execute permissions remain the same (already granted in previous migrations)
