-- Create function to aggregate total interactions by event type
-- This avoids hitting query limits by doing aggregation in the database

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
    ae.event_type,
    COUNT(*)::BIGINT AS count
  FROM analytics_events ae
  WHERE 
    ae.project_id::text = ANY(p_project_ids)
    AND ae.created_at >= p_start_date
    AND ae.created_at <= p_end_date
  GROUP BY ae.event_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_total_interactions_aggregated TO authenticated;
