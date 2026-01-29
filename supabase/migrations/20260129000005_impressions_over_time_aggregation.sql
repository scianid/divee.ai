-- Create function to aggregate impressions over time
-- This avoids hitting query limits by doing aggregation in the database

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
      date_trunc('hour', created_at) AS date,
      COUNT(*)::BIGINT AS count
    FROM analytics_impressions
    WHERE 
      project_id::text = ANY(p_project_ids)
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY date_trunc('hour', created_at)
    ORDER BY date ASC;
  ELSE
    RETURN QUERY
    SELECT 
      date_trunc('day', created_at) AS date,
      COUNT(*)::BIGINT AS count
    FROM analytics_impressions
    WHERE 
      project_id::text = ANY(p_project_ids)
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY date_trunc('day', created_at)
    ORDER BY date ASC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_impressions_over_time_aggregated TO authenticated;
