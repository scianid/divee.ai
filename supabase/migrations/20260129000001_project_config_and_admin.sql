-- Migration: Project Configuration for Admin Tag ID Management
-- Date: 2026-01-29
-- Purpose: Implement secure admin-only tag ID management system

-- =====================================================
-- 1. Create admin_users table
-- =====================================================
-- Stores system administrators who can manage tag IDs
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  notes text
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users table
CREATE POLICY "Only admins can view admin users"
ON public.admin_users
FOR SELECT
USING (
  user_id IN (SELECT user_id FROM public.admin_users)
);

-- =====================================================
-- 2. Create project_config table
-- =====================================================
-- Stores admin-only configuration for projects (primarily ad tag IDs)
CREATE TABLE IF NOT EXISTS public.project_config (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id text UNIQUE NOT NULL REFERENCES public.project(project_id) ON DELETE CASCADE,
  
  -- Ad Tag ID Management
  ad_tag_id text,
  ad_tag_id_locked boolean DEFAULT false,
  ad_tag_id_updated_at timestamp with time zone,
  ad_tag_id_updated_by uuid REFERENCES auth.users(id),
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Soft delete support
  deleted_at timestamp with time zone,
  deleted_by uuid REFERENCES auth.users(id),
  
  CONSTRAINT project_config_project_id_key UNIQUE (project_id)
);

-- Enable RLS on project_config
ALTER TABLE public.project_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view project config
CREATE POLICY "Only admins can view project config"
ON public.project_config
FOR SELECT
USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- Policy: Only admins can insert project config
CREATE POLICY "Only admins can create project config"
ON public.project_config
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- Policy: Only admins can update project config
CREATE POLICY "Only admins can update project config"
ON public.project_config
FOR UPDATE
USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- Policy: Only admins can delete project config (soft delete recommended)
CREATE POLICY "Only admins can delete project config"
ON public.project_config
FOR DELETE
USING (
  auth.uid() IN (SELECT user_id FROM public.admin_users)
);

-- =====================================================
-- 4. Helper Functions
-- =====================================================


-- =====================================================
-- 5. Comments for documentation
-- =====================================================

COMMENT ON TABLE public.admin_users IS 'System administrators with access to manage tag IDs and configuration';
COMMENT ON TABLE public.project_config IS 'Admin-only configuration for projects, including ad tag IDs that control revenue flow';

COMMENT ON COLUMN public.project_config.ad_tag_id IS 'Ad network tag ID - controls revenue flow. Changes are logged and require admin access.';
COMMENT ON COLUMN public.project_config.ad_tag_id_locked IS 'When true, tag ID cannot be changed without special approval. Used for critical revenue-generating widgets.';
COMMENT ON COLUMN public.project_config.ad_tag_id_updated_at IS 'Timestamp of last tag ID change';
COMMENT ON COLUMN public.project_config.ad_tag_id_updated_by IS 'Admin user who last updated the tag ID';

-- =====================================================
-- 6. Grant necessary permissions
-- =====================================================

-- Grant table permissions (RLS will restrict actual access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_config TO authenticated;
