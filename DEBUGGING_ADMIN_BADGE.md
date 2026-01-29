# Admin Badge Not Showing - Debugging Checklist

## ✅ Step 1: Apply the Migration

Open your Supabase Dashboard → SQL Editor and run:

```bash
# Or if using Supabase CLI:
cd supabase
supabase db push
```

Verify table exists:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users';
```

---

## ✅ Step 2: Find Your User ID

In Supabase Dashboard SQL Editor:

```sql
-- Get your user ID
SELECT id, email FROM auth.users;
```

Copy your user ID (UUID format like: `a1b2c3d4-...`)

---

## ✅ Step 3: Add Yourself as Admin

```sql
-- Replace YOUR_EMAIL with your actual email
INSERT INTO public.admin_users (user_id, notes)
SELECT id, 'First admin user'
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com';
```

Or if you have your user ID:

```sql
INSERT INTO public.admin_users (user_id, notes)
VALUES ('paste-your-user-id-here', 'First admin user');
```

Verify it worked:
```sql
SELECT * FROM public.admin_users;
```

---

## ✅ Step 4: Sign Out and Back In

1. In your app, click "Sign out"
2. Sign back in with your credentials
3. The admin badge should now appear

---

## ✅ Step 5: Check Browser Console

Open DevTools (F12) and check:

1. **Console tab** - Look for any errors
2. **Application tab** → Session Storage → Check for `auth_session`
   - Should show: `{ userId: "...", isAdmin: true, email: "..." }`

If `isAdmin` is `false`, the user isn't in admin_users table.

---

## ✅ Step 6: Manual Check in Console

In your browser console, run:

```javascript
// Check session storage
JSON.parse(sessionStorage.getItem('auth_session'))

// Check if admin_users query works
const { data, error } = await window.supabase
  .from('admin_users')
  .select('*')
  
console.log('Admin users:', data, 'Error:', error)
```

Note: This might fail due to RLS if you're not admin yet.

---

## Common Issues

### Issue: "admin_users table doesn't exist"
**Solution:** Run the migration first (Step 1)

### Issue: "Permission denied for table admin_users"
**Solution:** This is expected if you're not in the admin_users table yet. Use the SQL Editor in Supabase Dashboard (which bypasses RLS) to insert yourself.

### Issue: Badge shows briefly then disappears
**Solution:** 
1. Check browser console for errors
2. Verify your user ID is exactly correct in admin_users table
3. Try hard refresh (Ctrl+Shift+R)

### Issue: TypeScript errors in IDE
**Solution:** TypeScript errors have been fixed. Restart your dev server.

---

## Quick Test SQL (Run in Supabase Dashboard)

```sql
-- All-in-one check
DO $$ 
DECLARE
  v_user_id uuid;
BEGIN
  -- Get your user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';
  
  -- Check if you're admin
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = v_user_id) THEN
    RAISE NOTICE 'You are already an admin!';
  ELSE
    -- Add you as admin
    INSERT INTO admin_users (user_id, notes) VALUES (v_user_id, 'First admin');
    RAISE NOTICE 'Added you as admin!';
  END IF;
END $$;
```

---

## Still Not Working?

Share the output of these checks:

1. Browser console output
2. Session storage content
3. Result of: `SELECT * FROM admin_users;` (from SQL Editor)
4. Any error messages from the app
