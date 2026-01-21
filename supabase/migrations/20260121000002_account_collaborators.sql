-- Create account_collaborator table
CREATE TABLE IF NOT EXISTS public.account_collaborator (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.account(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(account_id, user_id)
);

-- Helper function to check account ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_account_owner(account_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account 
    WHERE id = account_uuid 
    AND user_id = user_uuid
  );
$$;

-- Enable RLS on account_collaborator table
ALTER TABLE public.account_collaborator ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view collaborators for accounts they own or are collaborators on
-- To avoid infinite recursion, we don't use subqueries that trigger other RLS policies
DROP POLICY IF EXISTS "Users can view collaborators for their accounts" ON public.account_collaborator;
CREATE POLICY "Users can view collaborators for their accounts"
ON public.account_collaborator
FOR SELECT
USING (
  -- User is a collaborator on this account
  user_id = auth.uid()
  OR
  -- User owns the account (using security definer function to bypass RLS)
  public.is_account_owner(account_id, auth.uid())
);

-- Policy: Account owners can insert collaborators
DROP POLICY IF EXISTS "Account owners can add collaborators" ON public.account_collaborator;
CREATE POLICY "Account owners can add collaborators"
ON public.account_collaborator
FOR INSERT
WITH CHECK (
  public.is_account_owner(account_id, auth.uid())
);

-- Policy: Account owners and admins can delete collaborators
DROP POLICY IF EXISTS "Account owners can remove collaborators" ON public.account_collaborator;
CREATE POLICY "Account owners can remove collaborators"
ON public.account_collaborator
FOR DELETE
USING (
  public.is_account_owner(account_id, auth.uid())
);

-- Update account RLS to include collaborators
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.account;
DROP POLICY IF EXISTS "Users can view their own accounts and collaborator accounts" ON public.account;
CREATE POLICY "Users can view their own accounts and collaborator accounts"
ON public.account
FOR SELECT
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.account_collaborator 
    WHERE account_collaborator.account_id = account.id 
    AND account_collaborator.user_id = auth.uid()
  )
);

-- Update account insert policy (only owners)
DROP POLICY IF EXISTS "Users can create their own accounts" ON public.account;
CREATE POLICY "Users can create their own accounts"
ON public.account
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Update account update policy (owners only)
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.account;
CREATE POLICY "Users can update their own accounts"
ON public.account
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Update account delete policy (owners only)
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.account;
CREATE POLICY "Users can delete their own accounts"
ON public.account
FOR DELETE
USING (user_id = auth.uid());

-- Update project RLS to include collaborators
DROP POLICY IF EXISTS "Users can view their projects" ON public.project;
DROP POLICY IF EXISTS "Users can view their projects and collaborator projects" ON public.project;
CREATE POLICY "Users can view their projects and collaborator projects"
ON public.project
FOR SELECT
USING (
  account_id IN (
    SELECT id FROM public.account WHERE user_id = auth.uid()
    UNION
    SELECT account_id FROM public.account_collaborator WHERE user_id = auth.uid()
  )
);

-- Update article RLS to include collaborators
DROP POLICY IF EXISTS "Users can view their own articles" ON public.article;
DROP POLICY IF EXISTS "Users can view their own articles and collaborator articles" ON public.article;
CREATE POLICY "Users can view their own articles and collaborator articles"
ON public.article
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT p.project_id
    FROM project p
    INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
    WHERE ac.user_id = auth.uid()
  )
);

-- Update freeform_qa RLS to include collaborators
DROP POLICY IF EXISTS "Users can view their own freeform Q&A" ON public.freeform_qa;
DROP POLICY IF EXISTS "Users can view their own freeform Q&A and collaborator Q&A" ON public.freeform_qa;
CREATE POLICY "Users can view their own freeform Q&A and collaborator Q&A"
ON public.freeform_qa
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT p.project_id
    FROM project p
    INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
    WHERE ac.user_id = auth.uid()
  )
);

-- Update analytics_impressions RLS to include collaborators (if not already exists)
DO $$ BEGIN
  ALTER TABLE public.analytics_impressions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view their analytics impressions" ON public.analytics_impressions;
DROP POLICY IF EXISTS "Users can view their analytics impressions and collaborator impressions" ON public.analytics_impressions;
CREATE POLICY "Users can view their analytics impressions and collaborator impressions"
ON public.analytics_impressions
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT p.project_id
    FROM project p
    INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
    WHERE ac.user_id = auth.uid()
  )
);

-- Update analytics_events RLS to include collaborators (if not already exists)
DO $$ BEGIN
  ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view their analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view their analytics events and collaborator events" ON public.analytics_events;
CREATE POLICY "Users can view their analytics events and collaborator events"
ON public.analytics_events
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT p.project_id
    FROM project p
    INNER JOIN account_collaborator ac ON p.account_id = ac.account_id
    WHERE ac.user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_account_collaborator_user_id ON public.account_collaborator(user_id);
CREATE INDEX IF NOT EXISTS idx_account_collaborator_account_id ON public.account_collaborator(account_id);
