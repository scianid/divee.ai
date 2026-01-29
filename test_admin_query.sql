-- Test admin_users query directly
-- Run this in Supabase SQL Editor to test

-- 1. Check if the table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
) as table_exists;

-- 2. Check RLS status
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'admin_users';

-- 3. List all policies
SELECT * FROM pg_policies WHERE tablename = 'admin_users';

-- 4. Try a simple select (this should work if policy is correct)
SET ROLE authenticated;
SELECT COUNT(*) FROM admin_users;

-- 5. Try to select specific user
SELECT * FROM admin_users WHERE user_id = 'ad2b537c-865c-40b1-8ba0-d289a2b6b45a';

-- 6. Reset role
RESET ROLE;
