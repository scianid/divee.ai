-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read conversations for projects they have access to
-- (either through owned accounts or as collaborators)
CREATE POLICY "Users can view conversations for their projects"
ON conversations
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
