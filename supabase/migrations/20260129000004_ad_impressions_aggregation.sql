DROP FUNCTION IF EXISTS get_ad_impressions_aggregated(TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, TEXT);

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
      date_trunc('hour', created_at) AS date,
      COUNT(*)::BIGINT AS count
    FROM analytics_events
    WHERE 
      project_id::text = ANY(p_project_ids)
      AND event_type = 'ad_impression'
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY date_trunc('hour', created_at)
    ORDER BY date ASC;
  ELSE
    RETURN QUERY
    SELECT 
      date_trunc('day', created_at) AS date,
      COUNT(*)::BIGINT AS count
    FROM analytics_events
    WHERE 
      project_id::text = ANY(p_project_ids)
      AND event_type = 'ad_impression'
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY date_trunc('day', created_at)
    ORDER BY date ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_ad_impressions_aggregated TO authenticated;