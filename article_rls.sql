-- Enable RLS on article table
ALTER TABLE article ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view articles from their own projects
CREATE POLICY "Users can view their own articles"
ON article
FOR SELECT
USING (
  project_id IN (
    SELECT p.project_id 
    FROM project p
    INNER JOIN account a ON p.account_id = a.id
    WHERE a.user_id = auth.uid()
  )
);
