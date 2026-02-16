-- Add override_mobile_container_selector column to project table
-- This allows users to specify a custom container selector for mobile devices

ALTER TABLE public.project 
ADD COLUMN IF NOT EXISTS override_mobile_container_selector text;

COMMENT ON COLUMN public.project.override_mobile_container_selector IS 'Optional CSS selector for mobile widget container. Empty by default.';
