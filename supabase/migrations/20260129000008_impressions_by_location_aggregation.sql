-- Create function to aggregate impressions by location
-- This avoids hitting query limits by doing aggregation in the database

CREATE OR REPLACE FUNCTION get_impressions_by_location_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  geo_country TEXT,
  geo_city TEXT,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.geo_country,
    COALESCE(ai.geo_city, 'Unknown') AS geo_city,
    MIN(ai.geo_lat) AS geo_lat,
    MIN(ai.geo_lng) AS geo_lng,
    COUNT(*)::BIGINT AS count
  FROM analytics_impressions ai
  WHERE 
    ai.project_id::text = ANY(p_project_ids)
    AND ai.created_at >= p_start_date
    AND ai.created_at <= p_end_date
    AND ai.geo_country IS NOT NULL
  GROUP BY ai.geo_country, COALESCE(ai.geo_city, 'Unknown')
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_impressions_by_location_aggregated TO authenticated;
