# Analytics Events Aggregation Plan

## Overview
Create an hourly aggregation table for `analytics_events` to improve query performance and enable efficient UI visualization of event metrics over time.

## Current State
- **Source Table**: `analytics_events`
  - Tracks all analytics events (impressions, interactions, widget_visible, etc.)
  - Contains: `id`, `project_id`, `visitor_id`, `session_id`, `event_type`, `event_label`, `event_data`, `created_at`
  - Growing table with potentially millions of rows
  - Current UI queries scan entire table for time-range aggregations

## Goals
1. **Performance**: Reduce query time for dashboard analytics
2. **Scalability**: Support growing data volume without degrading UI performance
3. **Flexibility**: Enable both hourly and daily aggregations from same table
4. **Real-time**: Keep data fresh with hourly updates via cron job

---

## Aggregate Table Schema

### Table: `analytics_events_hourly_agg`

```sql
CREATE TABLE public.analytics_events_hourly_agg (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- Dimensions (grouping keys)
  project_id text NOT NULL,
  event_type text NOT NULL,
  event_label text,  -- NULL for events without labels
  hour_bucket timestamp with time zone NOT NULL,  -- Truncated to hour
  
  -- Metrics (aggregated values)
  event_count bigint NOT NULL DEFAULT 0,
  unique_visitors bigint NOT NULL DEFAULT 0,
  unique_sessions bigint NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT analytics_events_hourly_agg_unique 
    UNIQUE (project_id, event_type, event_label, hour_bucket)
);

-- Indexes for efficient querying
CREATE INDEX idx_events_hourly_project_hour 
  ON analytics_events_hourly_agg(project_id, hour_bucket DESC);

CREATE INDEX idx_events_hourly_type_hour 
  ON analytics_events_hourly_agg(project_id, event_type, hour_bucket DESC);

CREATE INDEX idx_events_hourly_label_hour 
  ON analytics_events_hourly_agg(project_id, event_label, hour_bucket DESC) 
  WHERE event_label IS NOT NULL;
```

### Why This Design?

1. **Hour Bucket**: Using `date_trunc('hour', created_at)` as the time dimension
   - Hourly granularity for detailed trends
   - Easy to roll up to daily/weekly/monthly in queries
   - Balance between detail and table size

2. **Compound Key**: `(project_id, event_type, event_label, hour_bucket)`
   - Enables efficient filtering by project and time range
   - Supports event_type-specific queries (e.g., "only interactions")
   - event_label allows filtering by specific widgets or actions

3. **Pre-aggregated Metrics**:
   - `event_count`: Total events in the hour
   - `unique_visitors`: COUNT(DISTINCT visitor_id)
   - `unique_sessions`: COUNT(DISTINCT session_id)

4. **Nullable event_label**: Some events don't have labels, use NULL instead of empty string

---

## Aggregation SQL

### Initial Backfill Query
```sql
-- Backfill historical data (run once)
INSERT INTO analytics_events_hourly_agg (
  project_id,
  event_type,
  event_label,
  hour_bucket,
  event_count,
  unique_visitors,
  unique_sessions
)
SELECT 
  project_id,
  event_type,
  event_label,
  date_trunc('hour', created_at) as hour_bucket,
  COUNT(*) as event_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '90 days'  -- Adjust retention as needed
GROUP BY 
  project_id,
  event_type,
  event_label,
  date_trunc('hour', created_at)
ON CONFLICT (project_id, event_type, event_label, hour_bucket)
DO UPDATE SET
  event_count = EXCLUDED.event_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  updated_at = NOW();
```

### Incremental Update Query (for Cron)
```sql
-- Run hourly to aggregate the previous hour
INSERT INTO analytics_events_hourly_agg (
  project_id,
  event_type,
  event_label,
  hour_bucket,
  event_count,
  unique_visitors,
  unique_sessions
)
SELECT 
  project_id,
  event_type,
  event_label,
  date_trunc('hour', created_at) as hour_bucket,
  COUNT(*) as event_count,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
  AND created_at < date_trunc('hour', NOW())
GROUP BY 
  project_id,
  event_type,
  event_label,
  date_trunc('hour', created_at)
ON CONFLICT (project_id, event_type, event_label, hour_bucket)
DO UPDATE SET
  event_count = EXCLUDED.event_count,
  unique_visitors = EXCLUDED.unique_visitors,
  unique_sessions = EXCLUDED.unique_sessions,
  updated_at = NOW();
```

**Why 2-hour lookback?** 
- Accounts for late-arriving events
- Ensures we catch events written with slight clock skew
- Re-aggregates the previous completed hour

---

## Supabase Cron Job

### Setup via pg_cron Extension

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly aggregation job
SELECT cron.schedule(
  'aggregate-analytics-events-hourly',  -- Job name
  '5 * * * *',  -- Run at 5 minutes past every hour
  $$
  INSERT INTO analytics_events_hourly_agg (
    project_id,
    event_type,
    event_label,
    hour_bucket,
    event_count,
    unique_visitors,
    unique_sessions
  )
  SELECT 
    project_id,
    event_type,
    event_label,
    date_trunc('hour', created_at) as hour_bucket,
    COUNT(*) as event_count,
    COUNT(DISTINCT visitor_id) as unique_visitors,
    COUNT(DISTINCT session_id) as unique_sessions
  FROM analytics_events
  WHERE created_at >= date_trunc('hour', NOW() - INTERVAL '2 hours')
    AND created_at < date_trunc('hour', NOW())
  GROUP BY 
    project_id,
    event_type,
    event_label,
    date_trunc('hour', created_at)
  ON CONFLICT (project_id, event_type, event_label, hour_bucket)
  DO UPDATE SET
    event_count = EXCLUDED.event_count,
    unique_visitors = EXCLUDED.unique_visitors,
    unique_sessions = EXCLUDED.unique_sessions,
    updated_at = NOW();
  $$
);
```

### Verify Cron Job Status
```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

---

## UI Query Patterns

### 1. Hourly Event Count for Last 24 Hours
```sql
SELECT 
  hour_bucket,
  SUM(event_count) as total_events
FROM analytics_events_hourly_agg
WHERE project_id = $1
  AND hour_bucket >= NOW() - INTERVAL '24 hours'
GROUP BY hour_bucket
ORDER BY hour_bucket;
```

### 2. Daily Event Count by Type (Last 30 Days)
```sql
SELECT 
  date_trunc('day', hour_bucket) as day,
  event_type,
  SUM(event_count) as total_events,
  SUM(unique_visitors) as total_unique_visitors,
  SUM(unique_sessions) as total_unique_sessions
FROM analytics_events_hourly_agg
WHERE project_id = $1
  AND hour_bucket >= NOW() - INTERVAL '30 days'
GROUP BY date_trunc('day', hour_bucket), event_type
ORDER BY day, event_type;
```

### 3. Events by Label (Widget Performance)
```sql
SELECT 
  event_label,
  SUM(event_count) as total_events,
  SUM(unique_visitors) as total_unique_visitors
FROM analytics_events_hourly_agg
WHERE project_id = $1
  AND event_type = 'widget_visible'
  AND event_label IS NOT NULL
  AND hour_bucket >= $2  -- start_date
  AND hour_bucket < $3   -- end_date
GROUP BY event_label
ORDER BY total_events DESC;
```

### 4. Total Counters for KPIs
```sql
SELECT 
  SUM(event_count) as total_events,
  SUM(unique_visitors) as total_unique_visitors,
  SUM(unique_sessions) as total_unique_sessions
FROM analytics_events_hourly_agg
WHERE project_id = $1
  AND hour_bucket >= $2
  AND hour_bucket < $3;
```

---

## Migration Plan

### Step 1: Create Table and Indexes
- **File**: `supabase/migrations/YYYYMMDD_analytics_events_hourly_agg.sql`
- Create table schema with indexes
- Add RLS policies (inherit from analytics_events access patterns)

### Step 2: Backfill Historical Data
- Run initial backfill for last 90 days (or desired retention)
- Monitor performance and adjust batch size if needed
- Can run as one-time migration or via edge function

### Step 3: Setup Cron Job
- **File**: `supabase/migrations/YYYYMMDD_analytics_events_cron.sql`
- Schedule hourly aggregation job
- Verify job runs successfully

### Step 4: Update Edge Functions
- Modify existing analytics endpoints to query aggregate table
- Keep raw table for detailed drill-downs if needed
- Add date range parameters

### Step 5: Update Frontend
- Update queries to use aggregate table
- Adjust chart granularity based on date range:
  - Last 24h: hourly buckets
  - Last 7d: hourly or 4-hour buckets
  - Last 30d: daily buckets
  - Last 90d+: weekly buckets

---

## RLS Policies

```sql
-- Enable RLS
ALTER TABLE analytics_events_hourly_agg ENABLE ROW LEVEL SECURITY;

-- Admin users can see all aggregated data
CREATE POLICY "Admin users can view all aggregated events"
  ON analytics_events_hourly_agg
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Users can see aggregated data for their projects
CREATE POLICY "Users can view their project aggregated events"
  ON analytics_events_hourly_agg
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM project p
      LEFT JOIN account_collaborator ac ON ac.account_id = p.account_id
      WHERE p.project_id = analytics_events_hourly_agg.project_id
        AND (
          p.account_id IN (
            SELECT id FROM account WHERE user_id = auth.uid()
          )
          OR ac.user_id = auth.uid()
        )
    )
  );
```

---

## Performance Considerations

### Table Size Estimation
- **Events**: Assume 1M events/day across all projects
- **Unique combinations**: ~100 projects × 5 event_types × 20 event_labels = 10K combinations
- **Rows per day**: 10K combinations × 24 hours = 240K rows/day
- **Annual size**: 240K × 365 ≈ 87M rows (manageable with indexes)

### Storage Optimization
- Partition table by month if growth exceeds expectations
- Archive old data to cold storage after 1 year
- Consider dropping hourly granularity for data older than 90 days (aggregate to daily)

### Query Performance
- Indexes on (project_id, hour_bucket) ensure fast filtering
- Pre-aggregation eliminates need for COUNT DISTINCT on millions of rows
- Expected query time: <100ms for most dashboard queries

---

## Monitoring & Maintenance

### Health Checks
1. **Cron job success rate**: Monitor `cron.job_run_details` for failures
2. **Data freshness**: Latest `hour_bucket` should be within 2 hours of NOW()
3. **Row count growth**: Should grow linearly with event volume

### Alerts
- Cron job fails 3 times in a row
- No new data in last 3 hours
- Query performance degrades (>500ms for dashboard queries)

### Maintenance Tasks
- **Daily**: Verify cron job executed successfully
- **Weekly**: Check table size and index health
- **Monthly**: Review retention policy and archive old data
- **Quarterly**: Analyze query patterns and optimize indexes

---

## Rollout Checklist

- [ ] Create migration for aggregate table
- [ ] Create indexes
- [ ] Add RLS policies
- [ ] Run initial backfill
- [ ] Create cron job migration
- [ ] Verify cron job runs successfully
- [ ] Update edge function to query aggregate table
- [ ] Add fallback to raw table for real-time data (current hour)
- [ ] Test UI with new queries
- [ ] Monitor performance for 1 week
- [ ] Remove old inefficient queries
- [ ] Document aggregate table in schema docs

---

## Alternative Approaches Considered

### 1. Materialized View
- **Pros**: Automatic refresh, simpler to maintain
- **Cons**: Full rebuild on refresh (slow), no incremental updates in Postgres <14

### 2. Real-time Aggregation (No Pre-aggregation)
- **Pros**: Always accurate, no lag
- **Cons**: Slow queries on large tables, poor UI performance

### 3. Daily Aggregation Only
- **Pros**: Smaller table
- **Cons**: Loss of hourly granularity, less detailed charts

**Decision**: Hourly aggregation table with cron-based incremental updates offers best balance of performance, freshness, and flexibility.

---

## Future Enhancements

1. **Platform/Device Breakdowns**: Add `platform` dimension from analytics_impressions
2. **Geographic Aggregations**: Add `geo_country` dimension
3. **Engagement Metrics**: Calculate engagement rate (interactions / impressions)
4. **Real-time Current Hour**: Query raw table for current incomplete hour
5. **Data Retention**: Implement automatic archival of data older than 1 year
6. **Dashboard Caching**: Cache aggregate queries in Redis for 5 minutes
