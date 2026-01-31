DROP FUNCTION IF EXISTS get_top_articles_aggregated(TEXT[], TIMESTAMPTZ, TIMESTAMPTZ, INT, TEXT);

CREATE OR REPLACE FUNCTION get_top_articles_aggregated(
  p_project_ids TEXT[],
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_limit INT DEFAULT 3,
  p_sort_by TEXT DEFAULT 'impressions'
)
RETURNS TABLE (
  url TEXT,
  title TEXT,
  image_url TEXT,
  impressions BIGINT,
  custom_questions BIGINT,
  suggested_questions BIGINT,
  total_questions BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH impression_counts AS (
    -- Count impressions by URL
    SELECT 
      ai.url AS article_url,
      COUNT(*)::BIGINT AS imp_count
    FROM analytics_impressions ai
    WHERE 
      ai.project_id::text = ANY(p_project_ids)
      AND ai.created_at >= p_start_date
      AND ai.created_at <= p_end_date
      AND ai.url IS NOT NULL
    GROUP BY ai.url
  ),
  question_counts AS (
    -- Count questions by article URL from events
    SELECT 
      COALESCE(
        ae.event_data->>'article_url',
        ae.event_data->>'url'
      ) AS article_url,
      COUNT(*) FILTER (WHERE ae.event_type = 'custom_question_asked')::BIGINT AS custom_q,
      COUNT(*) FILTER (WHERE ae.event_type = 'suggestion_question_asked')::BIGINT AS suggested_q
    FROM analytics_events ae
    WHERE 
      ae.project_id::text = ANY(p_project_ids)
      AND ae.event_type IN ('custom_question_asked', 'suggestion_question_asked')
      AND ae.created_at >= p_start_date
      AND ae.created_at <= p_end_date
    GROUP BY COALESCE(ae.event_data->>'article_url', ae.event_data->>'url')
  )
  SELECT 
    ic.article_url AS url,
    a.title AS title,
    a.image_url AS image_url,
    ic.imp_count AS impressions,
    COALESCE(qc.custom_q, 0) AS custom_questions,
    COALESCE(qc.suggested_q, 0) AS suggested_questions,
    COALESCE(qc.custom_q, 0) + COALESCE(qc.suggested_q, 0) AS total_questions
  FROM impression_counts ic
  LEFT JOIN question_counts qc ON ic.article_url = qc.article_url
  INNER JOIN article a ON ic.article_url = a.url
  WHERE a.title IS NOT NULL AND a.title != ''
  ORDER BY 
    CASE 
      WHEN p_sort_by = 'engagement' THEN 
        (COALESCE(qc.custom_q, 0) + COALESCE(qc.suggested_q, 0))::FLOAT / NULLIF(ic.imp_count, 0)
      ELSE 
        ic.imp_count::FLOAT
    END DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_top_articles_aggregated TO authenticated;
