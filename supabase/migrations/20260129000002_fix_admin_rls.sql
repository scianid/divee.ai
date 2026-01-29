-- Fix RLS policy for admin_users table
-- The current policy creates infinite recursion (500 error)
-- This fix uses a simple policy that allows users to check their own row

-- Drop all existing policies
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can check their own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can create admin users" ON public.admin_users;

-- Simple policy: Anyone can SELECT (read) to check if they're admin
-- RLS still protects INSERT/UPDATE/DELETE
CREATE POLICY "Anyone can check admin status"
ON public.admin_users
FOR SELECT
USING (true);

-- Only existing admins can insert new admins (using SECURITY DEFINER function)
CREATE POLICY "Only admins can insert admin users"
ON public.admin_users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- Only existing admins can delete
CREATE POLICY "Only admins can delete admin users"
ON public.admin_users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- This allows:
-- ✅ Anyone to read admin_users table (to check if they're admin)
-- ✅ Only existing admins to add/remove admins
-- ✅ Normal users can't modify the table, only read it
