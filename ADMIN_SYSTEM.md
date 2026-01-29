# Admin System Implementation

## Overview

The admin system provides secure, role-based access control for managing ad tag IDs and other sensitive project configuration. This implements the "Defense-in-Depth" security architecture from the brainstorming session.

## Architecture

### Database Layer
- **`admin_users`** - Stores system administrators
- **`project_config`** - Admin-only configuration (ad tag IDs)
- **`audit_log`** - Complete audit trail of all admin actions
- **RLS Policies** - Row-level security restricts all access to admins only

### Application Layer
- **AuthContext** - Manages user session and admin status
- **Admin Badge Components** - Visual indicators for admin users
- **Admin Hooks** - Easy admin status checking

## Security Features

✅ **Multi-Layer Protection**
- Database: RLS policies block non-admin queries
- API: JWT validation on every request (coming next)
- UI: Admin fields completely hidden from non-admins

✅ **Automatic Audit Logging**
- Every tag ID change is logged
- Tracks who, what, when for compliance
- Immutable audit trail

✅ **Session Management**
- Admin status checked on login
- Stored in session storage for performance
- Re-validated on auth state changes

---

## Adding Your First Admin User

### Step 1: Apply the Migration

```bash
# Navigate to your project
cd supabase

# Apply the migration (if not already done)
supabase db push
```

### Step 2: Insert Your Admin User

Go to your Supabase dashboard → SQL Editor and run:

```sql
-- Replace 'your-user-id' with your actual Supabase Auth user ID
-- You can find your user ID in: Authentication → Users → Copy UUID

INSERT INTO public.admin_users (user_id, notes)
VALUES (
  'your-user-id-here',
  'First admin user - owner'
);
```

**To find your user ID:**
1. Go to Supabase Dashboard
2. Navigate to Authentication → Users
3. Find your email and copy the UUID

### Step 3: Verify Admin Status

1. Sign out and sign back in to your app
2. You should see an "ADMIN" badge in the sidebar
3. The Dashboard should show "System Administrator" indicator

---

## Usage in Components

### Check if User is Admin

```tsx
import { useAdmin } from '../hooks/useAdmin'

function MyComponent() {
  const isAdmin = useAdmin()
  
  if (isAdmin) {
    return <AdminOnlyFeature />
  }
  
  return <RegularFeature />
}
```

### Show Admin Badge

```tsx
import { AdminBadge, AdminIndicator } from '../components/AdminBadge'

// Small badge (for nav/headers)
<AdminBadge />

// Full indicator with email
<AdminIndicator />
```

### Access Full Auth Context

```tsx
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, isAdmin, isLoading, refreshAdminStatus } = useAuth()
  
  // user: Current Supabase user object
  // isAdmin: Boolean admin status
  // isLoading: True during initial auth check
  // refreshAdminStatus: Function to re-check admin status
  
  return (...)
}
```

---

## Session Storage

Admin status is cached in `sessionStorage` for performance:

```typescript
// Automatically stored on login
sessionStorage.getItem('auth_session')
// Returns: { userId: '...', isAdmin: true, email: '...' }
```

This is:
- ✅ Cleared on logout
- ✅ Cleared when browser/tab closes
- ✅ Re-validated on auth state changes
- ✅ Never persisted to localStorage (security)

---

## Next Steps: Admin UI

Now that admin detection is working, you can build:

1. **Admin Tag Management Page** (`/admin/tags`)
   - List all projects with tag IDs
   - Inline editing of tag IDs
   - Lock/unlock functionality
   - Bulk operations

2. **Admin API Endpoints**
   - `GET /api/admin/projects` - All projects across accounts
   - `POST /api/admin/projects/:id/tag` - Update tag ID
   - `GET /api/admin/audit-logs` - View audit trail

3. **Admin-Only Routes**
   ```tsx
   {isAdmin && (
     <Route path="/admin/tags" element={<TagManagement />} />
   )}
   ```

---

## Security Checklist

Before deploying to production:

- [ ] Applied migration to create admin tables
- [ ] Added yourself as first admin user
- [ ] Tested admin badge appears when logged in
- [ ] Tested non-admin users don't see admin features
- [ ] Verified RLS policies block non-admin database access
- [ ] Implemented API endpoints with JWT validation
- [ ] Set up audit log monitoring
- [ ] Documented who has admin access

---

## Troubleshooting

### Admin badge not showing?

1. Check if your user ID is in `admin_users` table:
   ```sql
   SELECT * FROM public.admin_users WHERE user_id = 'your-user-id';
   ```

2. Sign out and sign back in to refresh session

3. Check browser console for errors

4. Verify RLS policies are enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'admin_users';
   ```

### Session storage not working?

1. Check browser's session storage in DevTools
2. Verify `AuthProvider` wraps your app in `main.tsx`
3. Check for console errors during login

---

## Reference

**Created Files:**
- `web/src/lib/auth.ts` - Auth utilities
- `web/src/contexts/AuthContext.tsx` - Auth context provider
- `web/src/components/AdminBadge.tsx` - Admin UI components
- `web/src/hooks/useAdmin.ts` - Admin status hook
- `supabase/migrations/20260129000001_project_config_and_admin.sql` - Database schema

**Modified Files:**
- `web/src/main.tsx` - Added AuthProvider
- `web/src/layouts/DashboardLayout.tsx` - Shows admin badge
- `web/src/pages/Dashboard.tsx` - Shows admin indicator

---

**Implementation Status:** ✅ Database schema created, ✅ Admin detection working, ✅ Session storage integrated, ⏳ Admin UI pending
