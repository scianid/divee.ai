-- Enable RLS on token_usage table
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view token usage for their own projects (owned or collaborated)
CREATE POLICY "Users can view their project token usage"
  ON public.token_usage
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      -- Projects owned by user's accounts
      SELECT p.project_id
      FROM project p
      JOIN account a ON p.account_id = a.id
      WHERE a.user_id = auth.uid()
      
      UNION
      
      -- Projects user collaborates on
      SELECT p.project_id
      FROM project p
      JOIN account_collaborator ac ON p.account_id = ac.account_id
      WHERE ac.user_id = auth.uid()
    )
    OR
    -- Also allow admins to see all
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policy: Allow insert for service role (for edge functions)
CREATE POLICY "Service role can insert token usage"
  ON public.token_usage
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create index on project_id and created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_token_usage_project_created 
  ON public.token_usage(project_id, created_at DESC);

-- Create index on created_at for date range queries
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at 
  ON public.token_usage(created_at DESC);
