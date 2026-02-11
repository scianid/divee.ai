-- Add revenue share percentage to project_config
-- Default is 50 (50% revenue share for the user)
ALTER TABLE public.project_config 
ADD COLUMN revenue_share_percentage integer NOT NULL DEFAULT 50;

-- Add constraint to ensure percentage is between 0 and 100
ALTER TABLE public.project_config
ADD CONSTRAINT revenue_share_percentage_check 
CHECK (revenue_share_percentage >= 0 AND revenue_share_percentage <= 100);

COMMENT ON COLUMN public.project_config.revenue_share_percentage IS 'User revenue share percentage (0-100). Default is 50% split.';
