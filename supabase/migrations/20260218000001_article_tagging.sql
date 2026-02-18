-- Article Tagging Engine
-- Adds tagging support to the article table and creates the article_tag table.
-- Tags are generated async via AI (gpt-4o-mini) by the tag-articles edge function.

-- ─── 1. Extend article table ───────────────────────────────────────────────

ALTER TABLE article
  ADD COLUMN IF NOT EXISTS tagged_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tag_attempts INTEGER NOT NULL DEFAULT 0;

-- Partial index to efficiently find articles that still need tagging
CREATE INDEX IF NOT EXISTS idx_article_untagged
  ON article (project_id, tagged_at)
  WHERE tagged_at IS NULL AND tag_attempts < 3;

-- ─── 2. article_tag table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS article_tag (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_unique_id TEXT       NOT NULL REFERENCES article(unique_id) ON DELETE CASCADE,
  project_id       TEXT        NOT NULL,
  tag              TEXT        NOT NULL,
  tag_type         TEXT        NOT NULL CHECK (tag_type IN ('category', 'person', 'place')),
  confidence       DECIMAL(4,3),          -- AI confidence score 0.000–1.000
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT article_tag_unique UNIQUE (article_unique_id, tag)
);

-- Lookup by project + tag (used for related-article scoring and tag browsing)
CREATE INDEX IF NOT EXISTS idx_article_tag_project_tag
  ON article_tag (project_id, tag);

-- Lookup all tags for a given article
CREATE INDEX IF NOT EXISTS idx_article_tag_unique_id
  ON article_tag (article_unique_id);

-- Browse all articles with a given tag type within a project
CREATE INDEX IF NOT EXISTS idx_article_tag_type
  ON article_tag (project_id, tag_type, tag);

-- ─── 3. RLS ────────────────────────────────────────────────────────────────

ALTER TABLE article_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view article tags for their projects"
ON article_tag FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()

    UNION

    SELECT p.project_id FROM project p
    INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
    WHERE ac.user_id = auth.uid()
  )
);

-- ─── Useful queries ────────────────────────────────────────────────────────

-- Check cron job status:
-- SELECT * FROM cron.job WHERE jobname = 'tag-articles';

-- View recent runs:
-- SELECT runid, start_time, end_time, status, return_message
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'tag-articles')
-- ORDER BY start_time DESC LIMIT 10;

-- Count untagged articles per project:
-- SELECT project_id, COUNT(*) FROM article WHERE tagged_at IS NULL AND tag_attempts < 3 GROUP BY project_id;

-- Find articles related to a given unique_id (tag-overlap scoring):
-- SELECT a.unique_id, a.title,
--        COUNT(*)       AS shared_tag_count,
--        SUM(CASE at2.tag_type
--              WHEN 'person'   THEN at2.confidence * 2.0
--              WHEN 'place'    THEN at2.confidence * 1.5
--              WHEN 'category' THEN at2.confidence * 1.0
--            END)       AS tag_score
-- FROM article_tag at1
-- JOIN article_tag at2
--   ON at2.tag        = at1.tag
--  AND at2.project_id = at1.project_id
--  AND at2.article_unique_id <> at1.article_unique_id
-- JOIN article a ON a.unique_id = at2.article_unique_id
-- WHERE at1.article_unique_id = :current_article_unique_id
--   AND at1.project_id        = :project_id
-- GROUP BY a.unique_id, a.title
-- ORDER BY tag_score DESC, shared_tag_count DESC
-- LIMIT 10;

-- To unschedule:
-- SELECT cron.unschedule('tag-articles');
