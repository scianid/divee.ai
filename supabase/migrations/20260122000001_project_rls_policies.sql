-- Add missing RLS policies for project table

-- Policy: Users can insert projects for accounts they own or collaborate on
DROP POLICY IF EXISTS "Users can create projects for their accounts" ON public.project;
CREATE POLICY "Users can create projects for their accounts"
ON public.project
FOR INSERT
WITH CHECK (
  account_id IN (
    SELECT id FROM public.account WHERE user_id = auth.uid()
    UNION
    SELECT account_id FROM public.account_collaborator WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update projects for accounts they own or collaborate on
DROP POLICY IF EXISTS "Users can update their projects" ON public.project;
CREATE POLICY "Users can update their projects"
ON public.project
FOR UPDATE
USING (
  account_id IN (
    SELECT id FROM public.account WHERE user_id = auth.uid()
    UNION
    SELECT account_id FROM public.account_collaborator WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  account_id IN (
    SELECT id FROM public.account WHERE user_id = auth.uid()
    UNION
    SELECT account_id FROM public.account_collaborator WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete projects for accounts they own or collaborate on
DROP POLICY IF EXISTS "Users can delete their projects" ON public.project;
CREATE POLICY "Users can delete their projects"
ON public.project
FOR DELETE
USING (
  account_id IN (
    SELECT id FROM public.account WHERE user_id = auth.uid()
    UNION
    SELECT account_id FROM public.account_collaborator WHERE user_id = auth.uid()
  )
);

-- Similarly, add missing RLS policies for article table
DROP POLICY IF EXISTS "Users can create articles for their projects" ON public.article;
CREATE POLICY "Users can create articles for their projects"
ON public.article
FOR INSERT
WITH CHECK (
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

DROP POLICY IF EXISTS "Users can update their articles" ON public.article;
CREATE POLICY "Users can update their articles"
ON public.article
FOR UPDATE
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
)
WITH CHECK (
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

DROP POLICY IF EXISTS "Users can delete their articles" ON public.article;
CREATE POLICY "Users can delete their articles"
ON public.article
FOR DELETE
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

-- Add missing RLS policies for freeform_qa table
DROP POLICY IF EXISTS "Users can create freeform Q&A for their projects" ON public.freeform_qa;
CREATE POLICY "Users can create freeform Q&A for their projects"
ON public.freeform_qa
FOR INSERT
WITH CHECK (
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

DROP POLICY IF EXISTS "Users can update their freeform Q&A" ON public.freeform_qa;
CREATE POLICY "Users can update their freeform Q&A"
ON public.freeform_qa
FOR UPDATE
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
)
WITH CHECK (
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

DROP POLICY IF EXISTS "Users can delete their freeform Q&A" ON public.freeform_qa;
CREATE POLICY "Users can delete their freeform Q&A"
ON public.freeform_qa
FOR DELETE
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
