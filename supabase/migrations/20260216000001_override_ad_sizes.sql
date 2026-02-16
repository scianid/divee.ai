-- Add override ad size columns to project_config
-- This allows admins to override ad sizes per project for mobile and desktop

ALTER TABLE public.project_config 
ADD COLUMN IF NOT EXISTS override_mobile_ad_size text,
ADD COLUMN IF NOT EXISTS override_desktop_ad_size text;

COMMENT ON COLUMN public.project_config.override_mobile_ad_size IS 'Admin-only field to override mobile ad size for this project. Empty by default.';
COMMENT ON COLUMN public.project_config.override_desktop_ad_size IS 'Admin-only field to override desktop ad size for this project. Empty by default.';
