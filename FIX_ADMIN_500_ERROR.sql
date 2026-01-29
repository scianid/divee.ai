-- ================================================
-- FIX ADMIN RLS 500 ERROR - RUN THIS NOW
-- ================================================
-- Copy this entire file and paste into Supabase Dashboard → SQL Editor → Run
-- This fixes the infinite recursion causing 500 errors

-- Step 1: Drop the broken policies
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check their own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can create admin users" ON public.admin_users;

-- Step 2: Create new simple policies (no recursion)
CREATE POLICY "Anyone can check admin status"
ON public.admin_users
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Only admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- Step 3: Add yourself as admin
INSERT INTO public.admin_users (user_id, notes)
VALUES ('ad2b537c-865c-40b1-8ba0-d289a2b6b45a', 'First admin user')
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Verify it worked
SELECT * FROM public.admin_users;

-- You should see your user_id in the results!
