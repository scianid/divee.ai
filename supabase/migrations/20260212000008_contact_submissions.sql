-- Create contact_submissions table
-- This table stores contact form submissions from the landing page
-- No RLS policies - only accessible via Edge Function with service role

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for efficient querying
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- Enable RLS but DO NOT add any policies
-- This ensures only service role (edge function) can access this table
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from landing page. No user access - service role only.';
COMMENT ON COLUMN contact_submissions.name IS 'Full name of the person submitting the form';
COMMENT ON COLUMN contact_submissions.email IS 'Email address';
COMMENT ON COLUMN contact_submissions.phone IS 'Phone number (optional)';
COMMENT ON COLUMN contact_submissions.company_name IS 'Company name (optional)';
COMMENT ON COLUMN contact_submissions.ip_address IS 'IP address of submission for spam prevention';
COMMENT ON COLUMN contact_submissions.user_agent IS 'Browser user agent for spam prevention';
