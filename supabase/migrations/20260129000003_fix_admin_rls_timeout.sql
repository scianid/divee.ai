-- Fix admin_users RLS to be secure
-- Only service role can access admin_users table
-- Users check their admin status via the /me edge function

-- Drop all existing policies on admin_users
DROP POLICY IF EXISTS "Anyone can check admin status" ON admin_users;
DROP POLICY IF EXISTS "Only admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can delete admin users" ON admin_users;
DROP POLICY IF EXISTS "Authenticated users can read admin list" ON admin_users;
DROP POLICY IF EXISTS "Service role can manage admins" ON admin_users;

-- Enable RLS (if not already enabled)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only service role can SELECT (no one else can see the admin list)
-- This prevents information disclosure
CREATE POLICY "Service role can read admins"
  ON admin_users
  FOR SELECT
  TO service_role
  USING (true);

-- Only service role can INSERT/UPDATE/DELETE
CREATE POLICY "Service role can manage admins"
  ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users must use the /me edge function to check their admin status
-- This provides secure, controlled access without exposing the full admin list
