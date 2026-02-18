# Article Tagging Engine — Product Description

## Overview

The Article Tagging Engine automatically assigns semantic tags to articles asynchronously using AI. Tags represent editorial categories, recognized people, and geographic/political entities. These tags power smarter article suggestion ranking — surfacing more relevant content to each user based on what they're reading and asking about.

---

## Tag Taxonomy

Tags are grouped into three types:

### 1. Category Tags
Broad editorial categories that classify the article's subject matter.

Examples:
- `Politics`, `Economy`, `Technology`, `AI`, `Health`, `Science`, `Sports`, `Entertainment`, `Automotive`, `Real Estate`, `Finance`, `Education`, `Environment`, `Military`, `Law`

### 2. Companies and People Tags
Named individuals mentioned prominently in the article.

Examples:
- `Donald Trump`, `Elon Musk`, `Benjamin Netanyahu`, `Joe Biden`, `Michael Jackson`, `Nike`, `Apple`

People tags are normalized to full canonical names (e.g., "Trump" → `Donald Trump`).

### 3. Place Tags
Countries, cities, regions, or geopolitical entities that the article is primarily about.

Examples:
- `United States`, `France`, `Lisbon`, `European Union`, `Middle East`

---

## Rules
- Up to **5 tags** per article (total across all types).
- Tags are generated once per article, at the time of tagging, and stored permanently.
- The AI model returns tags ranked by relevance; only the top 5 are kept.
- Tags are **not regenerated** unless explicitly requested (e.g., content significantly changed).
- Tags are normalized and title-cased for consistency.

---

## Categorization Engine

### Trigger
Tagging runs **asynchronously** — articles are tagged after they are first encountered (crawled or saved), not at request time. A background cron job processes untagged articles in batches.

An article is considered "untagged" when `tagged_at IS NULL` in the `article` table.

### AI Prompt Design

The AI is given the article's `title` and `content` (truncated to ~3000 tokens) and asked to return a JSON object:

```json
{
  "tags": [
    { "value": "Politics", "type": "category", "confidence": 0.97 },
    { "value": "Donald Trump", "type": "person", "confidence": 0.95 },
    { "value": "United States", "type": "place", "confidence": 0.91 },
    { "value": "Economy", "type": "category", "confidence": 0.80 },
    { "value": "NATO", "type": "place", "confidence": 0.72 }
  ]
}
```

**System prompt principles:**
- Prioritize tags that are *central* to the article, not just mentioned.
- Return at most 5 tags total — fewer is fine if the article is narrow.
- Normalize people names to full canonical form.
- Prefer specific tags over generic ones (e.g., `Artificial Intelligence` over `Technology` when the article is clearly about AI).
- If nothing fits confidently, return fewer tags rather than guessing.

**Model:** `gpt-4o-mini` (low cost, sufficient for classification tasks).

### Processing Flow

```
Article saved/crawled
        │
        ▼
article.tagged_at IS NULL?
        │ Yes
        ▼
[Cron: tag-articles]
        │
        ▼
Fetch untagged articles (batch of 20)
        │
        ▼
For each article:
  ├─ Truncate content to ~3000 tokens
  ├─ Call OpenAI with system prompt + article text
  ├─ Parse returned JSON
  ├─ Insert top 5 tags into article_tags table
  └─ Set article.tagged_at = NOW()
        │
        ▼
Next batch on next cron tick
```

### Error Handling
- If the AI call fails, the article is **not** marked as tagged — it will be retried on the next cron run.
- If the AI returns malformed JSON, the article is skipped and a log entry is written. After 3 failed attempts (tracked via `tag_attempts` column), the article is skipped permanently to avoid stuck retries.

---

## Database Schema

### Changes to `article` table

```sql
ALTER TABLE article
  ADD COLUMN tagged_at       TIMESTAMPTZ,
  ADD COLUMN tag_attempts    INTEGER NOT NULL DEFAULT 0;

-- Index to efficiently find untagged articles
CREATE INDEX idx_article_untagged
  ON article (project_id, tagged_at)
  WHERE tagged_at IS NULL AND tag_attempts < 3;
```

### New `article_tag` table

```sql
CREATE TABLE article_tag (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_url  TEXT        NOT NULL REFERENCES article(url) ON DELETE CASCADE,
  project_id   TEXT        NOT NULL,
  tag          TEXT        NOT NULL,
  tag_type     TEXT        NOT NULL CHECK (tag_type IN ('category', 'person', 'place')),
  confidence   DECIMAL(4,3),          -- AI confidence score 0.000–1.000
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT article_tag_unique UNIQUE (article_url, tag)
);

-- For filtering by tag within a project
CREATE INDEX idx_article_tag_project_tag
  ON article_tag (project_id, tag);

-- For looking up all tags of a given article
CREATE INDEX idx_article_tag_url
  ON article_tag (article_url);

-- For browsing all articles with a given tag type
CREATE INDEX idx_article_tag_type
  ON article_tag (project_id, tag_type, tag);
```

### RLS Policy

```sql
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
```

---

## Cron Job: `tag-articles`

### Schedule
Every **5 minutes**, processing up to **20 articles** per run. This keeps latency low (most articles are tagged within minutes) while staying within OpenAI rate limits and Supabase edge function timeouts.

### Migration

```sql
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
```

### Edge Function: `tag-articles`

- Accepts optional `?projectId=` query param to tag articles for a specific project only (useful for manual backfill runs).
- Accepts `?limit=` (default 20, max 50).
- Called by the cron with a **service role JWT** — no user auth required.
- Increments `tag_attempts` on failure so repeatedly-failing articles don't block the queue.

---

## Searching Articles by Tag

### Goal
Given a user reading an article (or finishing a conversation), surface the most relevant other articles from the same project by matching shared tags.

### Strategy: Tag Overlap Scoring

To find related articles, we score all other project articles by how many tags they share with the current article, weighted by tag type and confidence.

#### SQL Query

```sql
-- Find articles related to a given article_url, within a project
SELECT
  a.url,
  a.title,
  COUNT(*)                          AS shared_tag_count,
  SUM(at2.confidence)               AS tag_score
FROM article_tag at1
JOIN article_tag at2
  ON at2.tag        = at1.tag
 AND at2.project_id = at1.project_id
 AND at2.article_url <> at1.article_url
JOIN article a
  ON a.url = at2.article_url
WHERE at1.article_url = :current_article_url
  AND at1.project_id  = :project_id
GROUP BY a.url, a.title
ORDER BY tag_score DESC, shared_tag_count DESC
LIMIT 10;
```

This query is fast because:
- `idx_article_tag_project_tag` makes the self-join on `(project_id, tag)` an index scan.
- The result set is bounded by the number of articles in the project.

#### Tag Type Weighting (optional enhancement)

People and place tags are more specific than category tags, so matching on `Donald Trump` is a stronger signal than matching on `Politics`. Apply weights in SQL using a `CASE` expression:

```sql
SUM(
  CASE at2.tag_type
    WHEN 'person'   THEN at2.confidence * 2.0
    WHEN 'place'    THEN at2.confidence * 1.5
    WHEN 'category' THEN at2.confidence * 1.0
  END
) AS tag_score
```

### Integration with Article Suggestions

The existing article suggestion logic (widget recommendations) should be updated to use tag overlap as an **additional ranking signal**:

```
final_score = engagement_score * 0.4
            + recency_score    * 0.2
            + tag_score        * 0.4   -- new
```

Tag score is normalized to 0–1 by dividing by the maximum possible tag score (5 tags × max confidence × max weight).

### Search by Tag (Admin / Dashboard)

To browse all articles with a given tag:

```sql
SELECT a.url, a.title, a.created_at, at.confidence
FROM article_tag at
JOIN article a ON a.url = at.article_url
WHERE at.project_id = :project_id
  AND at.tag        = :tag           -- e.g. 'Donald Trump'
ORDER BY at.confidence DESC, a.created_at DESC
LIMIT 50;
```

This uses `idx_article_tag_project_tag` directly — single index scan, no joins that touch the full article table until the final lookup.

### Filtering Conversations by Article Tag

Because conversations reference `article_url`, we can also filter conversations by tag:

```sql
SELECT c.*
FROM conversations c
WHERE c.project_id = :project_id
  AND c.url IN (
    SELECT article_url FROM article_tag
    WHERE project_id = :project_id
      AND tag = :tag
  );
```

---

## Future Enhancements

| Feature | Description |
|---|---|
| **Tag cloud in dashboard** | Show top tags per project with article count, clickable to filter the article list |
| **User-level tag affinity** | Track which tags a visitor's conversation articles belong to, and weight suggestions toward those tags |
| **Tag normalization dictionary** | Maintain a project-level alias map (`"AI" → "Artificial Intelligence"`) to deduplicate tags across editors |
| **Manual tag override** | Allow editors to add/remove tags on specific articles from the dashboard |
| **Backfill trigger** | One-click button in the dashboard to schedule a full backfill for all existing articles in a project |
| **Multi-language tagging** | Return tags in the project's configured language, or always in English and translate for display |
