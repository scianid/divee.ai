ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
