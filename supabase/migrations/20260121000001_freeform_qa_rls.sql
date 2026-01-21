-- Enable RLS on freeform_qa table
ALTER TABLE freeform_qa ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view freeform Q&A from their own projects
CREATE POLICY "Users can view their own freeform Q&A"
ON freeform_qa
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
  )
);
