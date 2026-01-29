-- Create function to aggregate impressions by widget (project)
-- This avoids hitting query limits by doing aggregation in the database

CREATE OR REPLACE FUNCTION get_impressions_by_widget_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  project_id UUID,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.project_id,
    COUNT(*)::BIGINT AS count
  FROM analytics_impressions ai
  WHERE 
    ai.project_id::text = ANY(p_project_ids)
    AND ai.created_at >= p_start_date
    AND ai.created_at <= p_end_date
  GROUP BY ai.project_id
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_impressions_by_widget_aggregated TO authenticated;
