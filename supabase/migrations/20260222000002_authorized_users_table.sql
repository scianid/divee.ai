-- Remove from account (added in previous migration)
ALTER TABLE public.account DROP COLUMN IF EXISTS authorized;

-- New user-level authorization table (mirrors admin_users pattern)
CREATE TABLE IF NOT EXISTS public.authorized_users (
  user_id uuid NOT NULL,
  authorized_at timestamp with time zone DEFAULT now(),
  authorized_by uuid,
  CONSTRAINT authorized_users_pkey PRIMARY KEY (user_id),
  CONSTRAINT authorized_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT authorized_users_authorized_by_fkey FOREIGN KEY (authorized_by) REFERENCES auth.users(id)
);

-- RLS: users can check their own authorization status
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own authorization"
  ON public.authorized_users FOR SELECT
  USING (auth.uid() = user_id);
