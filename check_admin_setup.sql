-- Step 1: Check if admin_users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
);

-- Step 2: If table exists, check if you're in it
-- First, get your user ID from auth
SELECT id, email FROM auth.users;

-- Step 3: Check admin_users table
SELECT * FROM public.admin_users;

-- Step 4: Add yourself as admin (replace YOUR_USER_ID with your actual ID from step 2)
-- Uncomment and run this line after getting your user ID:
-- INSERT INTO public.admin_users (user_id, notes)
-- VALUES ('YOUR_USER_ID_HERE', 'First admin user');
