# Analytics Impressions Aggregation Plan

## Overview
Create an hourly aggregation table for `analytics_impressions` to improve query performance and enable efficient dashboard visualization of page view metrics over time.

## Current State
- **Source Table**: `analytics_impressions`
  - Tracks widget impression events (page views where widget was loaded)
  - Contains: `id`, `project_id`, `visitor_id`, `session_id`, `url`, `referrer`, `user_agent`, `geo_country`, `geo_city`, `geo_lat`, `geo_lng`, `created_at`, `ip`, `platform`
  - Growing table with potentially millions of rows
  - Current UI queries scan entire table for time-range aggregations

## Goals
1. **Performance**: Reduce query time for dashboard impression analytics
2. **Scalability**: Support growing data volume without degrading UI performance
3. **Flexibility**: Enable hourly/daily aggregations with multiple dimension breakdowns
4. **Real-time**: Keep data fresh with hourly updates via cron job

---

## Aggregate Table Schema

### Table: `analytics_impressions_hourly_agg`

```sql
CREATE TABLE public.analytics_impressions_hourly_agg (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- Dimensions (grouping keys)
  project_id text NOT NULL,
  hour_bucket timestamp with time zone NOT NULL,
  platform text,  -- NULL for aggregation across all platforms
  geo_country text,  -- NULL for aggregation across all countries
  
  -- Metrics (aggregated values)
  impression_count bigint NOT NULL DEFAULT 0,
  unique_visitors bigint NOT NULL DEFAULT 0,
  unique_sessions bigint NOT NULL DEFAULT 0,
  unique_urls bigint NOT NULL DEFAULT 0,  -- Count of distinct URLs viewed
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT analytics_impressions_hourly_agg_unique 
    UNIQUE (project_id, hour_bucket, platform, geo_country)
);

-- Indexes for efficient querying
CREATE INDEX idx_impressions_hourly_project_hour 
  ON public.analytics_impressions_hourly_agg(project_id, hour_bucket DESC);

CREATE INDEX idx_impressions_hourly_platform 
  ON public.analytics_impressions_hourly_agg(project_id, platform, hour_bucket DESC)
  WHERE platform IS NOT NULL;

CREATE INDEX idx_impressions_hourly_country 
  ON public.analytics_impressions_hourly_agg(project_id, geo_country, hour_bucket DESC)
  WHERE geo_country IS NOT NULL;
```

### Why This Design?

1. **Hour Bucket**: Using `date_trunc('hour', created_at)` as the time dimension
   - Hourly granularity for detailed trends
   - Easy to roll up to daily/weekly/monthly in queries

2. **Multiple Aggregation Levels**:
   - **Total by hour**: `(project_id, hour_bucket, NULL, NULL)` - overall impressions
   - **By platform**: `(project_id, hour_bucket, platform, NULL)` - platform breakdown
   - **By country**: `(project_id, hour_bucket, NULL, geo_country)` - geographic breakdown
   - **By platform + country**: `(project_id, hour_bucket, platform, geo_country)` - detailed breakdown

3. **Pre-aggregated Metrics**:
   - `impression_count`: Total impressions in the hour
   - `unique_visitors`: COUNT(DISTINCT visitor_id)
   - `unique_sessions`: COUNT(DISTINCT session_id)
   - `unique_urls`: COUNT(DISTINCT url) - helps track content diversity

4. **Nullable dimensions**: NULL values represent "all" for that dimension, enabling efficient rollups

---

## Aggregation SQL

### Initial Backfill Query
```sql
-- Backfill historical data (run once)
-- Generate multiple aggregation levels

-- Level 1: Total by hour (no platform/country breakdown)
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id,
  hour_bucket,
  platform,
  geo_country,
  impression_count,
  unique_visitors,
  unique_sessions,
  unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  NULL as platform,
  NULL as geo_country,
  COUNT(*) as impression_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT url) as unique_urls
FROM public.analytics_impressions
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY 
  project_id,
  date_trunc('hour', created_at)
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();

-- Level 2: By platform
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id,
  hour_bucket,
  platform,
  geo_country,
  impression_count,
  unique_visitors,
  unique_sessions,
  unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  COALESCE(platform, 'Unknown') as platform,
  NULL as geo_country,
  COUNT(*) as impression_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT url) as unique_urls
FROM public.analytics_impressions
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY 
  project_id,
  date_trunc('hour', created_at),
  COALESCE(platform, 'Unknown')
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();

-- Level 3: By country
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id,
  hour_bucket,
  platform,
  geo_country,
  impression_count,
  unique_visitors,
  unique_sessions,
  unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  NULL as platform,
  geo_country,
  COUNT(*) as impression_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT url) as unique_urls
FROM public.analytics_impressions
WHERE created_at >= NOW() - INTERVAL '90 days'
  AND geo_country IS NOT NULL
GROUP BY 
  project_id,
  date_trunc('hour', created_at),
  geo_country
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();
```

### Incremental Update Query (for Cron)
```sql
-- Run hourly to aggregate the previous hour at all levels

-- Level 1: Total
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  NULL, NULL,
  COUNT(*), COUNT(DISTINCT visitor_id), COUNT(DISTINCT session_id), COUNT(DISTINCT url)
FROM public.analytics_impressions
WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
  AND created_at < date_trunc('hour', NOW())
GROUP BY project_id, date_trunc('hour', created_at)
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();

-- Level 2: By platform
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  COALESCE(platform, 'Unknown'), NULL,
  COUNT(*), COUNT(DISTINCT visitor_id), COUNT(DISTINCT session_id), COUNT(DISTINCT url)
FROM public.analytics_impressions
WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
  AND created_at < date_trunc('hour', NOW())
GROUP BY project_id, date_trunc('hour', created_at), COALESCE(platform, 'Unknown')
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();

-- Level 3: By country
INSERT INTO public.analytics_impressions_hourly_agg (
  project_id, hour_bucket, platform, geo_country,
  impression_count, unique_visitors, unique_sessions, unique_urls
)
SELECT 
  project_id,
  date_trunc('hour', created_at) as hour_bucket,
  NULL, geo_country,
  COUNT(*), COUNT(DISTINCT visitor_id), COUNT(DISTINCT session_id), COUNT(DISTINCT url)
FROM public.analytics_impressions
WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
  AND created_at < date_trunc('hour', NOW())
  AND geo_country IS NOT NULL
GROUP BY project_id, date_trunc('hour', created_at), geo_country
ON CONFLICT (project_id, hour_bucket, platform, geo_country)
DO UPDATE SET
  impression_count = EXCLUDED.impression_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  unique_urls = EXCLUDED.unique_urls,
  updated_at = NOW();
```

---

## Supabase Cron Job

```sql
-- Schedule hourly aggregation job for impressions
SELECT cron.schedule(
  'aggregate-analytics-impressions-hourly',
  '7 * * * *',  -- Run at 7 minutes past every hour (after events aggregation)
  $$
  -- Level 1: Total
  INSERT INTO public.analytics_impressions_hourly_agg (
    project_id, hour_bucket, platform, geo_country,
    impression_count, unique_visitors, unique_sessions, unique_urls
  )
  SELECT 
    project_id, date_trunc('hour', created_at), NULL, NULL,
    COUNT(*), COUNT(DISTINCT visitor_id), COUNT(DISTINCT session_id), COUNT(DISTINCT url)
  FROM public.analytics_impressions
  WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
    AND created_at < date_trunc('hour', NOW())
  GROUP BY project_id, date_trunc('hour', created_at)
  ON CONFLICT (project_id, hour_bucket, platform, geo_country)
  DO UPDATE SET
    impression_count = EXCLUDED.impression_count,
    unique_visitors = EXCLUDED.unique_visitors,
    unique_sessions = EXCLUDED.unique_sessions,
    unique_urls = EXCLUDED.unique_urls,
    updated_at = NOW();

  -- Level 2: By platform
  INSERT INTO public.analytics_impressions_hourly_agg (
    project_id, hour_bucket, platform, geo_country,
    impression_count, unique_visitors, unique_sessions, unique_urls
  )
  SELECT 
    project_id, date_trunc('hour', created_at), COALESCE(platform, 'Unknown'), NULL,
    COUNT(*), COUNT(DISTINCT visitor_id), COUNT(DISTINCT session_id), COUNT(DISTINCT url)
  FROM public.analytics_impressions
  WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
    AND created_at < date_trunc('hour', NOW())
  GROUP BY project_id, date_trunc('hour', created_at), COALESCE(platform, 'Unknown')
  ON CONFLICT (project_id, hour_bucket, platform, geo_country)
  DO UPDATE SET
    impression_count = EXCLUDED.impression_count,
    unique_visitors = EXCLUDED.unique_visitors,
    unique_sessions = EXCLUDED.unique_sessions,
    unique_urls = EXCLUDED.unique_urls,
    updated_at = NOW();

  -- Level 3: By country
  INSERT INTO public.analytics_impressions_hourly_agg (
    project_id, hour_bucket, platform, geo_country,
    impression_count, unique_visitors, unique_sessions, unique_urls
  )
  SELECT 
    project_id, date_trunc('hour', created_at), NULL, geo_country,
    COUNT(*), COUNT(DISTINCT visitor_id), COUNT(DISTINCT session_id), COUNT(DISTINCT url)
  FROM public.analytics_impressions
  WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
    AND created_at < date_trunc('hour', NOW())
    AND geo_country IS NOT NULL
  GROUP BY project_id, date_trunc('hour', created_at), geo_country
  ON CONFLICT (project_id, hour_bucket, platform, geo_country)
  DO UPDATE SET
    impression_count = EXCLUDED.impression_count,
    unique_visitors = EXCLUDED.unique_visitors,
    unique_sessions = EXCLUDED.unique_sessions,
    unique_urls = EXCLUDED.unique_urls,
    updated_at = NOW();
  $$
);
```

---

## UI Query Patterns

### 1. Impressions Over Time (Hourly/Daily)
```sql
-- Hourly
SELECT 
  hour_bucket as date,
  SUM(impression_count) as count
FROM analytics_impressions_hourly_agg
WHERE project_id = ANY($1)
  AND hour_bucket >= $2
  AND hour_bucket <= $3
  AND platform IS NULL
  AND geo_country IS NULL
GROUP BY hour_bucket
ORDER BY hour_bucket;

-- Daily rollup
SELECT 
  date_trunc('day', hour_bucket) as date,
  SUM(impression_count) as count
FROM analytics_impressions_hourly_agg
WHERE project_id = ANY($1)
  AND hour_bucket >= $2
  AND hour_bucket <= $3
  AND platform IS NULL
  AND geo_country IS NULL
GROUP BY date_trunc('day', hour_bucket)
ORDER BY date_trunc('day', hour_bucket);
```

### 2. Impressions by Widget (Project)
```sql
SELECT 
  project_id,
  SUM(impression_count) as count
FROM analytics_impressions_hourly_agg
WHERE project_id = ANY($1)
  AND hour_bucket >= $2
  AND hour_bucket <= $3
  AND platform IS NULL
  AND geo_country IS NULL
GROUP BY project_id
ORDER BY count DESC;
```

### 3. Impressions by Platform
```sql
SELECT 
  platform,
  SUM(impression_count) as count
FROM analytics_impressions_hourly_agg
WHERE project_id = ANY($1)
  AND hour_bucket >= $2
  AND hour_bucket <= $3
  AND platform IS NOT NULL
  AND geo_country IS NULL
GROUP BY platform
ORDER BY count DESC;
```

### 4. Impressions by Location
```sql
SELECT 
  geo_country,
  SUM(impression_count) as count
FROM analytics_impressions_hourly_agg
WHERE project_id = ANY($1)
  AND hour_bucket >= $2
  AND hour_bucket <= $3
  AND platform IS NULL
  AND geo_country IS NOT NULL
GROUP BY geo_country
ORDER BY count DESC;
```

**Note on Location Details**: For city-level data with coordinates, we'll still need to query the raw `analytics_impressions` table or create a separate aggregate. The hourly aggregate intentionally aggregates at country level only to keep table size manageable.

---

## RLS Policies

```sql
-- Enable RLS
ALTER TABLE analytics_impressions_hourly_agg ENABLE ROW LEVEL SECURITY;

-- Admin users can see all aggregated data
CREATE POLICY "Admin users can view all aggregated impressions"
  ON analytics_impressions_hourly_agg
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Users can see aggregated data for their projects
CREATE POLICY "Users can view their project aggregated impressions"
  ON analytics_impressions_hourly_agg
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM project p
      LEFT JOIN account a ON a.id = p.account_id
      LEFT JOIN account_collaborator ac ON ac.account_id = p.account_id
      WHERE p.project_id = analytics_impressions_hourly_agg.project_id
        AND (
          a.user_id = auth.uid()
          OR ac.user_id = auth.uid()
        )
    )
  );
```

---

## Functions to Update

### 1. get_impressions_over_time_aggregated
**Current**: Scans raw `analytics_impressions`  
**New**: Query aggregate table with `platform IS NULL AND geo_country IS NULL`

### 2. get_impressions_by_widget_aggregated
**Current**: Groups raw table by `project_id`  
**New**: SUM from aggregate table with `platform IS NULL AND geo_country IS NULL`

### 3. get_impressions_by_platform_aggregated
**Current**: Groups raw table by `platform`  
**New**: Query aggregate table with `platform IS NOT NULL AND geo_country IS NULL`

### 4. get_impressions_by_location_aggregated
**Current**: Groups by `geo_country` and `geo_city` with coordinates  
**New**: **Keep using raw table** for city-level detail and coordinates (low frequency query, detailed data needed)

### 5. get_top_articles_aggregated
**Current**: Groups raw table by `url`  
**New**: **Keep using raw table** for URL-level detail (high cardinality, infrequent query)

---

## Migration Plan

### Step 1: Create Table and Indexes
- **File**: `supabase/migrations/20260212000004_analytics_impressions_hourly_agg.sql`
- Create table schema with indexes
- Add RLS policies

### Step 2: Backfill Historical Data
- Run initial backfill for last 90 days at all 3 aggregation levels
- Can be included in migration or run separately

### Step 3: Setup Cron Job
- **File**: `supabase/migrations/20260212000005_analytics_impressions_cron.sql`
- Schedule hourly aggregation at 7 minutes past hour (after events cron)

### Step 4: Update Stored Functions
- **File**: `supabase/migrations/20260212000006_update_impression_functions.sql`
- Update 3 functions to use aggregate table
- Keep 2 functions using raw table (location details, top articles)

---

## Performance Considerations

### Table Size Estimation
- **Impressions**: Assume 1M impressions/day across all projects
- **Dimensions**:
  - Level 1 (total): 100 projects × 24 hours = 2,400 rows/day
  - Level 2 (platform): 100 projects × 24 hours × 5 platforms = 12,000 rows/day
  - Level 3 (country): 100 projects × 24 hours × 50 countries = 120,000 rows/day
- **Total**: ~135K rows/day ≈ 49M rows/year (very manageable)

### Query Performance
- Expected query time: <50ms for most dashboard queries
- Massive reduction from scanning millions of raw impressions
- Platform/country breakdowns pre-computed

---

## Trade-offs & Decisions

### Why Not Include URL Dimension?
- **Cardinality**: Each project could have thousands of unique URLs
- **Table size**: Would explode to hundreds of millions of rows
- **Usage**: URL-level queries (top articles) are infrequent
- **Decision**: Keep URL aggregation in raw table, optimize with targeted indexes

### Why Not Include City-Level Geo Data?
- **Cardinality**: Thousands of cities worldwide
- **Coordinates**: Each city needs lat/lng, can't aggregate
- **Usage**: City-level map queries are less frequent
- **Decision**: Keep city/coordinate queries on raw table, use country-level for trends

### Why Multiple Aggregation Levels?
- **Flexibility**: Different queries need different breakdowns
- **Performance**: Pre-computed rollups faster than dynamic GROUP BY
- **Storage**: Minimal cost compared to query speedup (3x rows vs 1000x faster)

---

## Rollout Checklist

- [ ] Create migration for aggregate table
- [ ] Create indexes
- [ ] Add RLS policies
- [ ] Run initial backfill (3 levels)
- [ ] Create cron job migration
- [ ] Verify cron job runs successfully
- [ ] Update 3 stored functions to use aggregate table
- [ ] Test all dashboard queries
- [ ] Monitor performance for 1 week
- [ ] Document aggregate table usage

---

## Future Enhancements

1. **URL-level Aggregation**: If top articles becomes a bottleneck, create separate daily aggregate by URL
2. **City-level Aggregate**: Add hourly aggregate for top 100 cities only
3. **Platform + Country Combo**: Add Level 4 aggregation if cross-dimension analysis needed
4. **Real-time Current Hour**: Query raw table for incomplete hour, blend with aggregate data
5. **Data Retention**: Archive data older than 1 year to cold storage
