-- Analytics Events Hourly Aggregation Table
-- This table stores pre-aggregated event counts by hour for improved query performance

-- Create the aggregate table
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
  ON public.analytics_events_hourly_agg(project_id, hour_bucket DESC);

CREATE INDEX idx_events_hourly_type_hour 
  ON public.analytics_events_hourly_agg(project_id, event_type, hour_bucket DESC);

CREATE INDEX idx_events_hourly_label_hour 
  ON public.analytics_events_hourly_agg(project_id, event_label, hour_bucket DESC) 
  WHERE event_label IS NOT NULL;

-- Enable RLS
ALTER TABLE public.analytics_events_hourly_agg ENABLE ROW LEVEL SECURITY;

-- Admin users can see all aggregated data
CREATE POLICY "Admin users can view all aggregated events"
  ON public.analytics_events_hourly_agg
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Users can see aggregated data for their projects
CREATE POLICY "Users can view their project aggregated events"
  ON public.analytics_events_hourly_agg
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.project p
      LEFT JOIN public.account a ON a.id = p.account_id
      LEFT JOIN public.account_collaborator ac ON ac.account_id = p.account_id
      WHERE p.project_id = analytics_events_hourly_agg.project_id
        AND (
          a.user_id = auth.uid()
          OR ac.user_id = auth.uid()
        )
    )
  );

-- Note: Initial backfill should be run separately to avoid timeout
-- See backfill script for instructions on populating historical data
