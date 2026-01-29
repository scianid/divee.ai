---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - 'C:\Users\moshe\Documents\Development\divee.ai\_bmad-output\planning-artifacts\prd.md'
  - 'C:\Users\moshe\Documents\Development\divee.ai\_bmad-output\planning-artifacts\admin-tag-id-brainstorming-2026-01-28.md'
workflowType: 'architecture'
project_name: 'divee.ai'
user_name: 'Moshe'
date: '2026-01-28'
lastStep: 8
status: 'complete'
completedAt: '2026-01-29'
---

# Architecture Decision Document - divee.ai Admin Tag Management

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- **Admin Tag ID Management:** Enable ops staff (admin users) to view and edit ad tag IDs across all customer projects
- **Search & Discovery:** Real-time search filtering across thousands of projects by customer/account name
- **Inline Editing Interface:** Modal-based settings UI for per-project tag ID updates
- **Cross-Account Access:** System admin "god mode" to view and manage projects across all customer accounts
- **Audit Trail:** Complete logging of all tag ID changes (who, what, when, old value, new value)
- **Field Invisibility:** Tag ID fields completely absent from DOM for non-admin users (customers)

**Non-Functional Requirements:**
- **Security (Critical):** Three-layer defense architecture (UI + API + Database)
  - Tag IDs control revenue distribution in zero-friction business model
  - Unauthorized access = business model collapse
  - JWT-based authentication with role validation on every request
  - API field stripping removes tag_id from responses for non-admins
  
- **Performance:**
  - API response time <200ms for single tag ID operations
  - Search performance <500ms across thousands of projects
  - Support 100+ concurrent admin operations
  
- **Scalability:**
  - Manage thousands of projects across hundreds of customer accounts
  - Pagination required (100 projects per page recommended)
  - Indexed search on customer/project names
  
- **Compliance:**
  - Tamper-proof audit logs with retention policy
  - Row-level data isolation (multi-tenant architecture)
  - Backwards compatibility (no breaking changes to existing system)

**Scale & Complexity:**
- **Primary domain:** Web Application (React + TypeScript frontend, Supabase PostgreSQL backend)
- **Complexity level:** Medium-High
- **Project context:** Brownfield (extending existing production system)
- **Estimated architectural components:** 
  - Frontend: Admin UI components, role-based rendering logic, search/filter interface
  - Backend: API Gateway with JWT middleware, field stripping logic, audit logging system
  - Database: Schema extension (ad_tag_id column, audit_logs table), RLS policy updates

### Technical Constraints & Dependencies

**Existing Stack (Must Work Within):**
- **Frontend:** React + TypeScript with existing component library
- **Backend:** Supabase (PostgreSQL database + Auth + API)
- **Authentication:** Supabase Auth with JWT tokens
- **Deployment:** Existing hosting infrastructure (no architectural changes)

**Critical Constraints:**
- Must extend existing `projects` table (cannot rebuild schema)
- Must preserve existing user authentication flows
- Must not break existing non-admin user experience
- API must remain backwards compatible (tag_id stripped for regular users)

**Dependencies:**
- Supabase Auth for role management (admin vs regular user)
- Supabase RLS policies (need admin bypass capability)
- Existing React routing and state management patterns

### Cross-Cutting Concerns Identified

**1. Authentication & Authorization**
- JWT-based role validation spans all layers
- Role claim (`admin` vs `user`) drives UI rendering and API responses
- Admin role bypass for RLS policies (see all projects across accounts)

**2. Audit Logging**
- Every tag ID mutation must be logged
- Logs must capture: actor, action, timestamp, old value, new value
- First-class architectural concern (not afterthought)

**3. API Field Stripping**
- Centralized security enforcement at API Gateway
- Remove `ad_tag_id` from responses for non-admin requests
- Cannot trust frontend for security decisions

**4. Multi-Tenant Data Isolation**
- Row-level isolation via foreign keys (user_id, account_id)
- Regular users constrained to own data
- Admin users transcend tenant boundaries (cross-account access)

**5. Search & Pagination**
- Critical for managing thousands of projects
- Real-time filtering as user types
- Performance-sensitive (sub-500ms requirement)

**6. Backwards Compatibility**
- Existing users unaffected (tag ID invisibility)
- Existing API contracts preserved
- Database schema extension (non-breaking)

## Existing Technology Stack (Brownfield Context)

### Frontend Architecture

**Core Technologies:**
- **Runtime:** React 19.2.0 with TypeScript 5.9.3
- **Build Tool:** Vite 7.2.4
- **Routing:** React Router DOM 7.12.0
- **Styling:** Tailwind CSS 4.1.18 with PostCSS
- **Linting:** ESLint 9.39.1 with TypeScript ESLint

**UI & Data Visualization Libraries:**
- **Charts:** Chart.js 4.5.1 with react-chartjs-2, ECharts 6.0.0
- **Maps:** Leaflet 1.9.4 with react-leaflet 5.0.0
- **Components:** Custom React components (no external UI framework)

**Project Structure:**
```
web/src/
├── components/     # Reusable UI components
│   ├── CollaboratorsModal.tsx
│   ├── CreateWidgetModal.tsx
│   ├── ProjectFunnelModal.tsx
│   ├── RequireAuth.tsx
│   ├── Reveal.tsx
│   └── ScanSiteModal.tsx
├── layouts/        # Page layouts
│   └── DashboardLayout.tsx
├── pages/          # Route-level components
│   ├── Accounts.tsx
│   ├── Articles.tsx
│   ├── Dashboard.tsx
│   ├── Inventory.tsx    # ← Where admin tag management will extend
│   ├── Login.tsx
│   ├── Privacy.tsx
│   ├── Projects.tsx
│   ├── Reports.tsx
│   └── Terms.tsx
├── lib/            # Utilities
│   └── supabase.ts      # Supabase client singleton
└── assets/         # Static assets
```

**State Management:**
- **Approach:** React hooks (`useState`, `useEffect`) with local component state
- **No global state library:** Currently using component-level state management
- **Authentication state:** Managed through Supabase Auth

**Routing Pattern:**
- **Setup:** BrowserRouter wrapping entire app (main.tsx)
- **Protected routes:** `<RequireAuth>` component wrapper for authenticated pages
- **Layout nesting:** `DashboardLayout` wraps authenticated pages

### Backend Architecture

**Database & Backend Services:**
- **Platform:** Supabase (PostgreSQL + Auth + API + Real-time)
- **Client Library:** @supabase/supabase-js 2.90.1
- **Configuration:** Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

**Authentication:**
- **Provider:** Supabase Auth with JWT tokens
- **Access:** `auth.uid()` for current user identification
- **Pattern:** RLS policies enforce row-level security

**Existing Database Schema:**

**Key Tables:**
- **`account`:** User accounts (id, user_id, name, icon_url, created_at)
- **`project`:** Widget/project configurations
  - Current columns: id, account_id, project_id, client_name, client_description, icon_url, language, direction, highlight_color, show_ad, input_text_placeholders, allowed_urls, display_mode, display_position, article_class, widget_container_class, created_at
  - **Missing:** `ad_tag_id` (to be added for admin feature)
- **`account_collaborator`:** Multi-user account access
- **`article`:** Content associated with projects
- **`freeform_qa`:** Q&A pairs for projects

**Row-Level Security (RLS) Policies:**
- Users can only access projects for accounts they own OR collaborate on
- Enforced via `account.user_id = auth.uid()` OR `account_collaborator.user_id = auth.uid()`
- **Admin bypass needed:** Current RLS does not support admin "god mode"

### Current API Patterns

**Data Access:**
- Direct Supabase client queries from React components
- Pattern: `supabase.from('table_name').select().eq()...`
- No custom API layer currently (direct client-to-Supabase)

**Authentication Flow:**
- Supabase Auth handles login/logout
- `RequireAuth` component guards protected routes
- JWT tokens managed automatically by Supabase client

### Deployment & Infrastructure

**Build Process:**
- Development: `npm run dev` (Vite dev server)
- Production build: `npm run build` (TypeScript + Vite)
- Preview: `npm run preview`

**Environment Configuration:**
- `.env` for local development
- Vite environment variables pattern (`VITE_*`)

### What Needs to Change for Admin Feature

**Frontend Changes Required:**
1. **Add admin role check logic** to differentiate admin vs regular users
2. **Conditional rendering** for tag ID fields (admins only)
3. **Admin-specific components** for tag ID editing modal
4. **Search/filter enhancements** for cross-account project viewing

**Backend Changes Required:**
1. **Database schema extension:** Add `ad_tag_id` column to `project` table
2. **Admin role storage:** Add role to Supabase Auth user metadata or custom table
3. **RLS policy updates:** Add admin bypass for cross-account viewing
4. **Audit logging:** New `audit_logs` table for tag ID change tracking
5. **API Gateway layer:** Add custom logic for field stripping (likely Supabase Edge Functions)

**Key Architectural Constraint:**
- Must preserve existing non-admin user experience (backwards compatibility)
- Cannot break existing RLS policies for regular users
- Tag ID field must be completely invisible to non-admins (not just disabled)

## Core Architectural Decisions

### Decision Summary

**Critical Decisions (Block Implementation):**
1. Admin role storage mechanism
2. Database schema for admin-only configuration
3. API security and field stripping approach
4. Admin role detection in frontend
5. RLS bypass pattern for cross-account access

**Important Decisions (Shape Architecture):**
6. UI component rendering strategy
7. Tag ID editing interface pattern

**Deferred Decisions (Post-MVP):**
8. Audit logging implementation (added after MVP proves successful)

---

### 1. Admin Role Storage & Management

**Decision:** Custom `admin_users` table

**Schema:**
```sql
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- RLS Policy: Users can only check their own admin status
CREATE POLICY "Users can check own admin status"
ON admin_users FOR SELECT
USING (user_id = auth.uid());
```

**Rationale:**
- Explicit admin role management separate from authentication
- Audit trail support (who granted admin, when, by whom)
- Future extensibility (super_admin, read_only_admin roles)
- Simple query pattern for admin checks

**Affects:** Authentication flow, RLS policies, `/api/me` endpoint

---

### 2. Admin-Only Configuration Data Model

**Decision:** Separate `project_config` table with admin-only RLS

**Schema:**
```sql
CREATE TABLE project_config (
  id SERIAL PRIMARY KEY,
  project_id INTEGER UNIQUE NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  ad_tag_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy: Admin-only access
CREATE POLICY "Admin-only access to project_config"
ON project_config
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
```

**Rationale:**
- **Security boundary at database level:** Users cannot even attempt SQL manipulation of admin fields
- **Clean separation:** User-editable (`project` table) vs admin-only (`project_config` table)
- **Existing RLS unchanged:** No modifications to `project` table RLS policies
- **Future-proof:** Additional admin-only fields can be added without affecting user access

**Relationship:** 1-to-1 with `project` table, created on-demand when admin first sets tag ID

**Affects:** Database schema, `/config` Edge Function, data migrations

---

### 3. API Security & Field Stripping

**Decision:** Extend existing `/config` Edge Function with role-based field stripping

**Implementation Pattern:**
```typescript
// /config Edge Function (existing, to be extended)
export async function handler(req: Request) {
  // 1. Validate JWT
  const jwt = extractJWT(req);
  const userId = validateJWT(jwt);
  
  // 2. Check if user is admin
  const isAdmin = await checkAdminStatus(userId);
  
  // 3. Query project data
  const project = await supabase
    .from('project')
    .select('*')
    .eq('project_id', projectId)
    .single();
  
  // 4. Query admin config (with service role if admin)
  let config = null;
  if (isAdmin) {
    config = await supabase
      .from('project_config')
      .select('*')
      .eq('project_id', project.id)
      .single();
  }
  
  // 5. Merge and return (ad_tag_id only if admin)
  return {
    ...project,
    ad_tag_id: config?.ad_tag_id || null, // Only present for admins
  };
}
```

**Rationale:**
- **API Gateway pattern:** Centralized security enforcement
- **Three-layer defense:** UI (conditional render) + API (field strip) + Database (RLS)
- **Cannot be bypassed:** Network inspection reveals nothing for non-admins
- **Uses existing endpoint:** No new API surface area

**Performance:** Adds ~50-100ms latency (acceptable within <200ms SLA)

**Affects:** Existing `/config` Edge Function, frontend config fetching

---

### 4. Admin Role Detection (Frontend)

**Decision:** `/api/me` endpoint with JWT validation

**Implementation:**
```typescript
// Edge Function: /api/me
export async function handler(req: Request) {
  // 1. Validate JWT from Authorization header
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
  const userId = validateJWT(jwt);
  
  // 2. Query admin status (using service role)
  const { data: adminRecord } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  const isAdmin = !!adminRecord;
  
  // 3. Get user profile
  const user = await getUserProfile(userId);
  
  // 4. Return enriched context
  return {
    user: { id: userId, email: user.email, name: user.name },
    isAdmin,
    accounts: await getUserAccounts(userId),
    preferences: await getUserPreferences(userId)
  };
}

// Frontend usage
const { data } = await fetch('/api/me', {
  headers: { 'Authorization': `Bearer ${supabaseJWT}` }
});

// Store in React Context
<UserContext.Provider value={{ user: data.user, isAdmin: data.isAdmin }}>
```

**Rationale:**
- **Simpler than JWT custom claims:** No Supabase Auth hooks/triggers needed
- **Real-time role updates:** Refresh page = updated status, no re-login required
- **Extensible:** Can return additional user context (permissions, preferences)
- **Easy to debug:** Just call endpoint, inspect response
- **Secure:** Uses service role to query admin_users, non-admins cannot see admin list

**Trade-off accepted:** One extra API call (~50-100ms) on app mount

**Affects:** New Edge Function, React Context for user state, app initialization flow

---

### 5. Admin RLS Bypass Pattern

**Decision:** Explicit admin checks in RLS policies

**Implementation:**
```sql
-- Example: Allow admins to SELECT all projects
DROP POLICY IF EXISTS "Users can view their projects" ON project;
CREATE POLICY "Users can view their projects"
ON project FOR SELECT
USING (
  -- Regular users: own projects only
  account_id IN (
    SELECT id FROM account WHERE user_id = auth.uid()
    UNION
    SELECT account_id FROM account_collaborator WHERE user_id = auth.uid()
  )
  OR
  -- Admins: all projects
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
```

**Rationale:**
- **Surgical control:** Explicit per-table, per-operation policies
- **Audit trail preserved:** All access still goes through RLS (logged)
- **Granular permissions:** Can control exactly what admins can bypass
- **Alternative rejected:** Service role key bypasses ALL security (too broad)

**Affects:** RLS policies on `project` table (SELECT, UPDATE), potentially `account` table

---

### 6. Frontend Component Strategy

**Decision:** Conditional rendering for admin-specific UI elements

**Implementation:**
```tsx
// React component pattern
import { useUser } from './contexts/UserContext';

function InventoryRow({ project }) {
  const { isAdmin } = useUser();
  
  return (
    <tr>
      <td>{project.client_name}</td>
      <td>{project.language}</td>
      
      {/* Admin-only column - completely absent from DOM for non-admins */}
      {isAdmin && (
        <td>
          <input 
            type="text" 
            value={project.ad_tag_id || ''} 
            onChange={handleTagChange}
          />
        </td>
      )}
      
      <td>
        <button onClick={openSettings}>Settings</button>
      </td>
    </tr>
  );
}
```

**Rationale:**
- **Field invisibility:** Tag ID field does not exist in DOM for non-admins (not just `display:none`)
- **Simple implementation:** Standard React conditional rendering
- **Security:** Combined with API field stripping, creates robust defense
- **Alternative considered:** Separate `AdminInventoryRow` component rejected for MVP (adds complexity)

**Affects:** Inventory page component, settings modal component

---

### 7. Tag ID Editing UI Pattern

**Decision:** Settings modal (existing UI pattern)

**User Flow:**
1. Admin searches for customer/project in Inventory page
2. Clicks "Settings" button on project row
3. Modal opens showing all project settings
4. Tag ID field visible and editable (admin only)
5. Admin pastes new tag ID, clicks Save
6. Success confirmation, modal closes, value updated in table

**Rationale:**
- **Consistent with existing patterns:** Leverages existing modal components
- **Contextual editing:** All settings in one place (user-editable + admin fields)
- **Prevents accidental changes:** Modal focus reduces mis-clicks
- **Future extensibility:** Can add more admin fields to same modal

**Component Structure:**
- Extend existing settings modal OR create `AdminSettingsModal`
- Conditional rendering of admin-only fields within modal
- Save handler updates both `project` and `project_config` tables

**Affects:** Inventory page, settings modal component, save/update logic

---

### 8. Audit Logging (Deferred)

**Decision:** DEFERRED to post-MVP

**Post-MVP Implementation Plan:**
- Database trigger on `project_config.ad_tag_id` changes
- Capture: user_id, timestamp, old_value, new_value, project_id
- Store in `audit_logs` table
- Admin-only view for audit trail review

**Rationale for Deferral:**
- Reduces MVP complexity, accelerates shipping
- Can be added later without breaking changes
- Non-blocking: Tag management works without audit trail
- Risk mitigation: Limited admin rollout, manual backups during MVP

**Risk Accepted:** No audit trail during initial rollout

**Future Enhancement:** Upgrade to hybrid model (trigger + Edge Function enrichment with IP, user agent)

---

### Decision Impact Analysis

**Implementation Sequence:**
1. **Database migrations:** Create `admin_users` and `project_config` tables with RLS policies
2. **Update RLS policies:** Add admin bypass to `project` SELECT policy
3. **Create `/api/me` Edge Function:** Admin role detection endpoint
4. **Extend `/config` Edge Function:** Add field stripping logic for `ad_tag_id`
5. **Frontend: User Context:** React Context for caching `/api/me` response
6. **Frontend: Conditional UI:** Add admin-only tag ID field to Inventory/Settings modal
7. **Frontend: Save Handler:** Update logic to save to `project_config` table

**Cross-Component Dependencies:**
- `/api/me` must complete before rendering admin UI (loading state required)
- `project_config` table must exist before `/config` can query it
- Admin RLS bypass needed for cross-account project viewing
- Field stripping in `/config` depends on admin role check

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming (Established Conventions):**
- **Tables:** `snake_case` following existing pattern
  - Existing: `project`, `account`, `article`, `freeform_qa`, `account_collaborator`
  - **New tables:** `admin_users`, `project_config`
- **Columns:** `snake_case` (e.g., `user_id`, `project_id`, `ad_tag_id`, `created_at`)
- **Foreign keys:** Direct column name with `_id` suffix (e.g., `account_id`, `project_id`)
- **Timestamps:** `created_at`, `updated_at` (PostgreSQL `TIMESTAMPTZ`)

**API Endpoint Naming:**
- **Pattern:** `/api/{resource}` or `/api/{action}`
- **Examples:**
  - `/api/me` (user context endpoint - new)
  - `/api/config` (project configuration endpoint - existing, to be extended)
- **Admin endpoints:** No special prefix, security enforced via JWT validation

**TypeScript/React Naming (Established Conventions):**
- **Components:** PascalCase files and exports (`Inventory.tsx`, `CollaboratorsModal.tsx`)
- **Interfaces:** PascalCase (`Project`, `Account`, `User`)
- **Functions:** camelCase (`handleSort`, `getSortIcon`, `getUserData`)
- **Variables:** camelCase (`userId`, `projectId`, `isAdmin`)
- **Admin components:** Follow existing pattern (`AdminSettingsModal.tsx`, `AdminTagField.tsx`)

---

### API Response Format Patterns

**Edge Function Response Format:**
```typescript
// Success response - direct data return
{
  user: { id, email, name },
  isAdmin: boolean,
  accounts: [...],
}

// Error response - throw or return error object
{
  error: {
    message: "Unauthorized: Invalid JWT",
    code: "INVALID_JWT"
  }
}
```

**Field Naming in JSON:**
- **Pattern:** Keep consistent with database `snake_case` for API responses (simpler mapping)
- **Example:** Database `ad_tag_id` → API response `ad_tag_id`
- **Rationale:** Reduces transformation layer, clearer database-API mapping

**Date/Time Format:**
- **Database:** PostgreSQL `TIMESTAMPTZ`
- **API:** ISO 8601 strings (`2026-01-28T19:34:50.536Z`)
- **Display:** Format in frontend as needed using date libraries

---

### Project Structure Patterns

```
web/src/
├── components/         # Reusable UI components
│   ├── RequireAuth.tsx
│   ├── {Feature}Modal.tsx
│   ├── AdminSettingsModal.tsx  # ← New admin component
│   └── ...
├── pages/              # Route-level components
│   ├── Inventory.tsx   # ← Extends with admin features
│   └── ...
├── layouts/            # Page layouts
│   └── DashboardLayout.tsx
├── contexts/           # React contexts
│   └── UserContext.tsx  # ← New for user/admin state
├── lib/                # Utilities and clients
│   ├── supabase.ts     # Existing Supabase client
│   └── admin.ts        # ← New admin utility functions
└── assets/             # Static assets

supabase/
├── functions/          # Edge Functions
│   ├── me/            # ← New: /api/me endpoint
│   │   └── index.ts
│   └── config/        # Existing: /api/config (to extend)
│       └── index.ts
└── migrations/         # Database migrations
    └── YYYYMMDDHHMMSS_description.sql
```

**File Placement Rules:**
- Admin components → `src/components/` (not separate admin folder)
- User context → `src/contexts/UserContext.tsx`
- Admin utilities → `src/lib/admin.ts`
- Edge Functions → `supabase/functions/{endpoint-name}/index.ts`
- Migrations → `supabase/migrations/` with timestamp prefix

---

### Error Handling Patterns

**Edge Function Error Handling:**
```typescript
// Standard pattern for all Edge Functions
try {
  // 1. Validate JWT
  const userId = validateJWT(req);
  
  // 2. Business logic
  const result = await performOperation(userId);
  
  // 3. Success response
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
} catch (error) {
  console.error('Error in /api/endpoint:', error);
  
  return new Response(
    JSON.stringify({ error: error.message }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: error.code === 'UNAUTHORIZED' ? 401 : 500
    }
  );
}
```

**Frontend Error Handling:**
- Use component-level error state (existing pattern)
- Display user-friendly error messages
- Log errors to console in development
- Show loading states while operations pending

---

### Authentication & Authorization Patterns

**JWT Validation Pattern (Reusable):**
```typescript
// lib/auth.ts - Standard JWT extraction and validation
async function validateJWT(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { message: 'Missing authorization header', code: 'UNAUTHORIZED' };
  }
  
  const jwt = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseClient.auth.getUser(jwt);
  
  if (error || !data.user) {
    throw { message: 'Invalid JWT', code: 'UNAUTHORIZED' };
  }
  
  return data.user.id;
}
```

**Admin Check Pattern (Reusable):**
```typescript
// lib/admin.ts - Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  return !!data;
}
```

**Frontend Admin Check Pattern:**
```typescript
// Use React Context for role-based rendering
import { useUser } from './contexts/UserContext';

function InventoryPage() {
  const { isAdmin, loading } = useUser();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <>
      {/* Admin-only UI - completely absent for non-admins */}
      {isAdmin && <AdminTagColumn />}
      
      {/* Shared UI for all users */}
      <RegularColumns />
    </>
  );
}
```

---

### Database Migration Patterns

**Migration File Structure:**
```sql
-- Migration: YYYYMMDDHHMMSS_description.sql
-- Description: Clear description of what this migration does
-- Author: Moshe
-- Date: 2026-01-28

-- Step 1: Create tables
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Step 3: Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can check own admin status"
ON admin_users FOR SELECT
USING (user_id = auth.uid());

-- Step 5: Insert seed data (if needed)
-- INSERT INTO admin_users (user_id, created_by, notes) 
-- VALUES ('...', '...', 'Initial admin user');
```

**Migration Naming Convention:**
- Format: `YYYYMMDDHHMMSS_snake_case_description.sql`
- Example: `20260128193500_add_admin_tables.sql`
- Order matters: Migrations run in chronological sequence
- Idempotent: Use `IF NOT EXISTS`, `DROP POLICY IF EXISTS` for safety

---

### State Management Pattern

**Component-Level State (Existing Pattern):**
```typescript
// Continue using existing pattern from Inventory.tsx
const [projects, setProjects] = useState<Project[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
```

**User Context Pattern (New for Admin Role):**
```typescript
// contexts/UserContext.tsx
interface UserContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUserContext();
  }, []);
  
  async function fetchUserContext() {
    try {
      const response = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${supabaseJWT}` }
      });
      const data = await response.json();
      setUser(data.user);
      setIsAdmin(data.isAdmin);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <UserContext.Provider value={{ user, isAdmin, loading, refreshUser: fetchUserContext }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
```

---

### Testing Patterns (Future Implementation)

**Test File Location:**
- Co-located with source: `Component.tsx` → `Component.test.tsx`
- Or in `__tests__/` directory within same folder

**Test Naming:**
- Describe behavior being tested
- Example: `"AdminSettingsModal renders tag ID field for admin users"`
- Example: `"config endpoint strips ad_tag_id for non-admin users"`

---

## Critical Consistency Rules for AI Agents

**NEVER:**
1. ❌ Mix naming conventions (database = `snake_case`, TypeScript = `camelCase`)
2. ❌ Skip JWT validation in Edge Functions
3. ❌ Return `ad_tag_id` to non-admin users
4. ❌ Use service role key in client-side code
5. ❌ Create new architectural patterns (follow existing)
6. ❌ Bypass RLS policies in application code

**ALWAYS:**
1. ✅ Validate JWT in all Edge Functions (no exceptions)
2. ✅ Check admin status before returning sensitive data
3. ✅ Use existing Supabase client pattern from `lib/supabase.ts`
4. ✅ Follow established component structure
5. ✅ Use RLS policies for data access control
6. ✅ Verify `ad_tag_id` invisibility at UI, API, and Database layers

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
divee.ai/
├── supabase/
│   ├── migrations/
│   │   └── 20260129000001_add_admin_infrastructure.sql    # NEW: Admin tables + RLS
│   │       ├── CREATE TABLE admin_users
│   │       ├── CREATE TABLE project_config (ad_tag_id lives here)
│   │       ├── RLS policies for admin_users (admin-only SELECT)
│   │       ├── RLS policies for project_config (admin-only ALL)
│   │       └── UPDATE project SELECT policy (add admin bypass)
│   │
│   └── functions/
│       ├── me/                                             # NEW: User context endpoint
│       │   └── index.ts                                    # JWT validation + admin check
│       │       ├── Validates JWT from Authorization header
│       │       ├── Queries admin_users table (service role)
│       │       ├── Returns { user, isAdmin, accounts }
│       │       └── AUTHORITATIVE admin status source
│       │
│       └── config/                                         # EXISTS: Extend for security
│           └── index.ts                                    # MODIFY: Add admin check + field strip
│               ├── Validates JWT (existing or add)
│               ├── Checks isAdmin via admin_users query
│               ├── Joins project + project_config tables
│               ├── Strips ad_tag_id if NOT admin
│               └── Returns merged config object
│
└── web/
    ├── src/
    │   ├── contexts/
    │   │   └── UserContext.tsx                             # NEW: User + admin state
    │   │       ├── Calls /api/me on mount
    │   │       ├── Provides { user, isAdmin, loading }
    │   │       ├── isAdmin used ONLY for UI hints (not security)
    │   │       └── Custom hook: useUser()
    │   │
    │   ├── lib/
    │   │   ├── supabase.ts                                 # EXISTS: No changes
    │   │   └── admin.ts                                    # NEW: Admin utilities
    │   │       ├── updateProjectConfig(projectId, tagId)
    │   │       ├── Helper functions (no auth logic)
    │   │       └── Data transformation utilities
    │   │
    │   ├── components/
    │   │   ├── RequireAuth.tsx                             # EXISTS: No changes
    │   │   ├── CollaboratorsModal.tsx                      # EXISTS: Reference pattern
    │   │   ├── CreateWidgetModal.tsx                       # EXISTS: Reference pattern
    │   │   └── AdminSettingsModal.tsx                      # NEW: Settings modal
    │   │       ├── Takes projectId as prop
    │   │       ├── Fetches data via /api/config
    │   │       ├── Renders tag field IF data.ad_tag_id exists (backend decides)
    │   │       ├── Saves to Supabase project_config table
    │   │       └── Backend RLS validates admin on write
    │   │
    │   └── pages/
    │       └── Inventory.tsx                               # MODIFY: Admin features
    │           ├── Import useUser hook
    │           ├── Add conditional Settings button (if isAdmin)
    │           ├── Add optional tag ID column (renders if data.ad_tag_id present)
    │           ├── Integrate AdminSettingsModal component
    │           └── Maintain existing user experience
    │
    └── main.tsx                                            # MODIFY: Wrap in UserProvider
        └── Add <UserProvider> wrapper around app
```

---

### Architectural Boundaries

#### **🔐 API Boundaries (PRIMARY SECURITY LAYER)**

**All security decisions happen in the backend. Frontend receives only what it's authorized to see.**

**Endpoint: `/api/me` (NEW)**
- **Purpose:** Authoritative user context with admin role detection
- **Request:** 
  ```
  GET /api/me
  Headers: { Authorization: "Bearer <JWT>" }
  ```
- **Backend Security Enforcement:**
  ```typescript
  // In Edge Function
  const userId = await validateJWT(req);
  
  // Query admin_users table (service role - bypasses RLS)
  const { data: adminRecord } = await supabaseServiceRole
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  const isAdmin = !!adminRecord;  // ← BACKEND decides, NOT frontend
  
  return Response.json({ user, isAdmin, accounts });
  ```
- **Response:**
  ```typescript
  {
    user: { id: string, email: string, name: string },
    isAdmin: boolean,      // FROM backend admin_users query
    accounts: Account[]    // User's accessible accounts
  }
  ```
- **Security Guarantees:**
  - JWT validation prevents impersonation
  - Service role query ensures accurate admin status
  - Non-admins cannot forge `isAdmin: true`

**Endpoint: `/api/config` (EXTEND EXISTING)**
- **Purpose:** Project configuration with backend-controlled field visibility
- **Request:** 
  ```
  GET /api/config?projectId=xxx
  Headers: { Authorization: "Bearer <JWT>" }
  ```
- **Backend Security Enforcement:**
  ```typescript
  // In Edge Function
  const userId = await validateJWT(req);
  const projectId = req.url.searchParams.get('projectId');
  
  // Check admin status (BACKEND DECISION)
  const isAdmin = await checkAdminStatus(userId);
  
  // Query project data
  const project = await supabase
    .from('project')
    .select('*')
    .eq('id', projectId)
    .single();
  
  // Query admin config ONLY if admin
  let adminConfig = null;
  if (isAdmin) {
    adminConfig = await supabase
      .from('project_config')
      .select('ad_tag_id')
      .eq('project_id', projectId)
      .maybeSingle();
  }
  
  // BACKEND decides what fields to include
  const response = {
    ...project,
    ...(isAdmin && adminConfig ? { ad_tag_id: adminConfig.ad_tag_id } : {})
  };
  
  return Response.json(response);
  ```
- **Response (Admin):**
  ```typescript
  {
    id: 123,
    client_name: "Customer Corp",
    language: "en",
    ad_tag_id: "ca-pub-xxx",  // ← Included by backend
    // ... other fields
  }
  ```
- **Response (Non-Admin):**
  ```typescript
  {
    id: 123,
    client_name: "Customer Corp",
    language: "en",
    // ad_tag_id NOT present - backend didn't send it
    // ... other fields
  }
  ```
- **Security Guarantees:**
  - Field stripping happens server-side
  - Non-admins never receive `ad_tag_id` in network response
  - Network inspection reveals nothing sensitive

---

#### **🧩 Component Boundaries**

**UserContext (Global Application State)**
- **Responsibility:** Cache user context from `/api/me` for UI convenience
- **Exposes:** `useUser()` hook with `{ user, isAdmin, loading }`
- **Security Role:** **UI hints ONLY** - not for security enforcement
- **Pattern:**
  ```typescript
  const { isAdmin } = useUser();
  
  // ✅ ALLOWED: UI hint (show/hide buttons)
  {isAdmin && <button>Settings</button>}
  
  // ❌ FORBIDDEN: Security decision
  {isAdmin && <input name="ad_tag_id" />}  // NO! Backend controls this
  ```
- **Communication:** 
  - Calls `/api/me` once on app mount
  - No child components query admin status independently
  - Single source of truth for UI hints

**AdminSettingsModal (Feature Component)**
- **Responsibility:** Display/edit project settings (backend controls field visibility)
- **Props:** `{ projectId: string, isOpen: boolean, onClose: () => void }`
- **Security Pattern (Data-Driven Rendering):**
  ```typescript
  // Fetch config from backend
  const config = await fetch(`/api/config?projectId=${projectId}`);
  // Backend already stripped fields based on admin status
  
  // ✅ CORRECT: Render based on DATA presence
  {config.ad_tag_id !== undefined && (
    <label>
      Ad Tag ID
      <input 
        name="ad_tag_id" 
        value={config.ad_tag_id || ''} 
        onChange={handleChange}
      />
    </label>
  )}
  
  // ❌ WRONG: Render based on role check
  {isAdmin && <input name="ad_tag_id" />}  // NO! Backend decides
  ```
- **Data Flow:**
  1. Modal opens → calls `/api/config`
  2. Backend validates admin, returns appropriate fields
  3. Modal renders ONLY fields backend sent
  4. On save → POST to `project_config` table
  5. RLS policy validates admin before write

**Inventory Page (Container Component)**
- **Responsibility:** Display projects list with backend-controlled admin features
- **Admin Features (Backend-Driven):**
  ```typescript
  const { isAdmin } = useUser();
  const projects = await fetchProjects();  // Backend includes/excludes ad_tag_id
  
  // ✅ Settings button: UI hint from isAdmin (backend validated)
  {isAdmin && <button onClick={openSettings}>Settings</button>}
  
  // ✅ Tag ID column: Data-driven rendering
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Language</th>
        {/* Column appears ONLY if backend sent ad_tag_id for ANY row */}
        {projects.some(p => p.ad_tag_id !== undefined) && <th>Tag ID</th>}
      </tr>
    </thead>
    <tbody>
      {projects.map(project => (
        <tr key={project.id}>
          <td>{project.client_name}</td>
          <td>{project.language}</td>
          {/* Cell renders ONLY if backend sent this field */}
          {project.ad_tag_id !== undefined && <td>{project.ad_tag_id}</td>}
        </tr>
      ))}
    </tbody>
  </table>
  ```
- **Integration:** Mounts `<AdminSettingsModal>` for editing

---

#### **🗄️ Data Boundaries (DATABASE SECURITY LAYER)**

**Table: `admin_users` (Admin Role Registry)**
- **Purpose:** Authoritative source of admin role assignments
- **Schema:**
  ```sql
  CREATE TABLE admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    notes TEXT
  );
  ```
- **RLS Policies:**
  ```sql
  -- Only admins can see admin list (prevents regular users from discovering who is admin)
  CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));
  
  -- No INSERT/UPDATE/DELETE via RLS (ops team manages via direct SQL or admin tools)
  ```
- **Access Pattern:**
  - Frontend: **NEVER queries directly**
  - Edge Functions: Query with **service role only** (bypasses RLS)
  - Ops team: Direct SQL or future admin management UI

**Table: `project_config` (Admin-Only Configuration)**
- **Purpose:** Store admin-controlled project configuration (ad tag IDs)
- **Schema:**
  ```sql
  CREATE TABLE project_config (
    project_id INTEGER PRIMARY KEY REFERENCES project(id) ON DELETE CASCADE,
    ad_tag_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
  );
  ```
- **RLS Policies:**
  ```sql
  -- Only admins can SELECT
  CREATE POLICY "Admins can view project_config"
  ON project_config FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));
  
  -- Only admins can INSERT/UPDATE/DELETE
  CREATE POLICY "Admins can modify project_config"
  ON project_config FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));
  ```
- **Access Pattern:**
  - Regular users: **Cannot query** (RLS blocks SELECT)
  - Admins: Can query and modify (RLS allows ALL operations)
  - Edge Functions: Use user's JWT (RLS applies)

**Table: `project` (MODIFIED - Admin Bypass)**
- **Purpose:** Existing project data - add admin cross-account access
- **Schema:** No changes to columns
- **RLS Policy Update:**
  ```sql
  -- Existing policy modified to add admin bypass
  DROP POLICY IF EXISTS "Users can view their projects" ON project;
  
  CREATE POLICY "Users can view their projects"
  ON project FOR SELECT
  USING (
    -- Regular users: own projects only (existing logic)
    account_id IN (
      SELECT id FROM account WHERE user_id = auth.uid()
      UNION
      SELECT account_id FROM account_collaborator WHERE user_id = auth.uid()
    )
    OR
    -- Admins: all projects (NEW admin bypass)
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
  ```
- **Impact:** Admins can now SELECT all projects across all accounts

---

### Requirements to Structure Mapping

**Functional Requirement: Admin Tag ID Management**

**Maps to:**
- **Database:**
  - `supabase/migrations/20260129000001_add_admin_infrastructure.sql`
    - `admin_users` table (admin role storage)
    - `project_config` table (ad_tag_id storage)
    - RLS policies (security enforcement)

- **API Layer:**
  - `supabase/functions/me/index.ts` (NEW)
    - Returns authoritative `isAdmin` flag
  - `supabase/functions/config/index.ts` (EXTEND)
    - Backend admin check
    - Field stripping logic
    - Joins project + project_config

- **Frontend:**
  - `web/src/contexts/UserContext.tsx` (NEW)
    - Caches `/api/me` response
    - Provides `useUser()` hook for UI hints
  - `web/src/lib/admin.ts` (NEW)
    - Admin utility functions
    - updateProjectConfig() helper
  - `web/src/components/AdminSettingsModal.tsx` (NEW)
    - Settings modal with data-driven field rendering
    - Saves to project_config table
  - `web/src/pages/Inventory.tsx` (MODIFY)
    - Conditional Settings button (UI hint)
    - Data-driven tag ID column rendering
    - Modal integration

**Functional Requirement: Cross-Account Access (Admin "God Mode")**

**Maps to:**
- **Database:**
  - `project` table SELECT policy (add admin bypass)
  - Admin check via `EXISTS` query against `admin_users`

- **API:** No specific endpoint needed (RLS handles via JWT)

- **Frontend:**
  - `Inventory.tsx` shows all projects (backend determines visibility via RLS)

**Functional Requirement: Search & Discovery**

**Maps to:**
- **Frontend:**
  - `Inventory.tsx` existing search functionality (no changes needed)
  - Search filters projects client-side or via Supabase query

**Non-Functional Requirement: Security (Three-Layer Defense)**

**Maps to:**
1. **Database Layer:**
   - `project_config` RLS policies (blocks unauthorized access)
   - `admin_users` RLS policies (prevents admin list exposure)
   
2. **API Layer:**
   - `/api/me` Edge Function (authoritative admin check)
   - `/api/config` Edge Function (field stripping logic)
   
3. **UI Layer:**
   - Data-driven rendering (fields appear only if backend sent them)
   - `isAdmin` for UI hints only (not security)

---

### Cross-Cutting Concerns Mapping

**Authentication & Authorization (Spans All Layers)**
- **Database:** `admin_users` table, RLS policies with admin checks
- **API:** JWT validation in all Edge Functions, admin status queries
- **Frontend:** `UserContext` for caching auth state, `useUser()` hook

**Audit Logging (Post-MVP)**
- **Database:** Future `audit_logs` table with triggers on `project_config`
- **API:** No changes needed (triggers handle logging)
- **Frontend:** No changes needed (backend logs automatically)

**Backwards Compatibility (All Layers)**
- **Database:** Separate `project_config` table (no changes to `project`)
- **API:** Field stripping ensures non-admins see no changes
- **Frontend:** Conditional rendering ensures regular users see no new fields

---

### Integration Points

#### **Internal Communication Flow**

**App Initialization (Security Bootstrap):**
```
main.tsx
  └── <UserProvider>
        └── useEffect on mount
              └── fetch('/api/me', { headers: { Authorization: Bearer JWT } })
                    └── Edge Function validates JWT
                          └── Edge Function queries admin_users (service role)
                                └── Returns { user, isAdmin: BOOLEAN }
                                      └── Context stores for UI hints
                                            └── App renders with user context available
```

**Admin Tag Editing Flow (Backend-Controlled):**
```
Inventory.tsx
  └── Admin sees Settings button (isAdmin UI hint)
        └── Admin clicks Settings
              └── <AdminSettingsModal projectId={xxx}>
                    └── Modal fetches /api/config?projectId=xxx
                          └── BACKEND checks admin status
                                └── BACKEND includes ad_tag_id in response (if admin)
                                      └── Modal renders tag field (data.ad_tag_id exists)
                                            └── Admin edits value, clicks Save
                                                  └── POST to supabase.from('project_config').upsert(...)
                                                        └── RLS policy validates admin status
                                                              └── Write succeeds (if admin) or fails (if not)
                                                                    └── Success → refetch → close modal
```

**Security Enforcement Flow (Multiple Defense Layers):**
```
Regular User (Not Admin) Visits Inventory:
  1. /api/me returns { isAdmin: false }  ← BACKEND decision
  2. Settings button hidden (UI hint from isAdmin)
  3. User somehow crafts API call: GET /api/config?projectId=xxx
  4. BACKEND checks admin status → false
  5. BACKEND omits ad_tag_id from response
  6. Frontend receives config WITHOUT ad_tag_id
  7. Modal renders NO tag ID field (data not present)
  8. User somehow crafts POST to project_config table
  9. RLS policy blocks write (admin_users check fails)
 10. Database returns error, write rejected

Admin User Visits Inventory:
  1. /api/me returns { isAdmin: true }  ← BACKEND decision
  2. Settings button visible (UI hint)
  3. Admin clicks Settings
  4. GET /api/config → BACKEND includes ad_tag_id
  5. Modal renders tag ID field (data present)
  6. Admin edits, saves
  7. POST to project_config → RLS allows (admin check passes)
  8. Write succeeds
```

**Data Flow (Project Configuration Loading):**
```
Component needs config:
  └── fetch('/api/config?projectId=xxx', { JWT })
        └── Edge Function receives request
              ├── Validates JWT → userId
              ├── Queries admin_users → isAdmin
              ├── Queries project table → base config
              ├── IF isAdmin: queries project_config → admin fields
              └── Returns merged object (conditionally includes ad_tag_id)
                    └── Component receives config
                          └── Renders fields based on DATA presence
```

---

#### **External Integrations**

**Supabase Authentication:**
- **Integration Point:** All Edge Functions validate JWT via Supabase Auth
- **Pattern:** `supabaseClient.auth.getUser(jwt)`
- **Security:** JWT signature verification prevents token forgery

**Supabase Database:**
- **Integration Point:** Edge Functions query via Supabase client
- **Access Modes:**
  - Anon key: Subject to RLS policies (user queries)
  - Service role key: Bypasses RLS (admin status checks only)
- **Security:** RLS provides final enforcement layer

**Supabase Real-time (Future):**
- **Potential Use:** Live updates when admin changes tag ID
- **Not MVP:** Refresh page to see changes initially

---

### File Organization Patterns

**Database Migrations (`supabase/migrations/`):**
- **Naming:** `YYYYMMDDHHMMSS_snake_case_description.sql`
- **Example:** `20260129000001_add_admin_infrastructure.sql`
- **Content Order:**
  1. Table creation
  2. Index creation
  3. RLS enablement
  4. RLS policy creation
  5. Seed data (optional)
- **Execution:** Applied via `supabase db push` or `supabase migration up`

**Edge Functions (`supabase/functions/{endpoint}/`):**
- **Structure:**
  ```
  supabase/functions/
  ├── me/
  │   ├── index.ts          # Main handler
  │   └── deno.json         # Optional Deno config
  └── config/
      └── index.ts          # Existing, to extend
  ```
- **Entry Point:** `index.ts` exports default handler function
- **Pattern:**
  ```typescript
  // Standard Edge Function structure
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
  
  serve(async (req: Request) => {
    try {
      const userId = await validateJWT(req);
      const result = await businessLogic(userId);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.code === 'UNAUTHORIZED' ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });
  ```

**React Components (`web/src/components/`):**
- **Location:** Flat structure in `components/` directory
- **Naming:** PascalCase files matching export name
- **Pattern:**
  ```typescript
  // AdminSettingsModal.tsx
  interface AdminSettingsModalProps {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
  }
  
  export function AdminSettingsModal({ projectId, isOpen, onClose }: AdminSettingsModalProps) {
    // Component implementation
  }
  ```
- **Examples:** `CollaboratorsModal.tsx`, `CreateWidgetModal.tsx`, `AdminSettingsModal.tsx`

**React Contexts (`web/src/contexts/`):**
- **Location:** `contexts/` directory (NEW directory)
- **Pattern:** Context + Provider + custom hook in same file
- **Example:**
  ```typescript
  // UserContext.tsx
  export const UserContext = createContext<UserContextType | undefined>(undefined);
  export const UserProvider = ({ children }) => { /* ... */ };
  export const useUser = () => useContext(UserContext);
  ```

**Utilities (`web/src/lib/`):**
- **Location:** `lib/` directory
- **Naming:** camelCase files, camelCase exports
- **Examples:**
  - `supabase.ts` (existing - Supabase client singleton)
  - `admin.ts` (new - admin utility functions)

---

### Development Workflow Integration

**Local Development Setup:**
```bash
# Terminal 1: Start Supabase locally
supabase start

# Terminal 2: Run frontend dev server
cd web && npm run dev

# Apply new migration
supabase migration up

# Create test admin user
supabase db execute "INSERT INTO admin_users (user_id) VALUES ('...')"
```

**Testing Admin Features Locally:**
1. **Apply migration:** `supabase migration up`
2. **Insert test admin:** Direct SQL to add your user to `admin_users`
3. **Test admin flow:**
   - Login as admin user
   - Call `/api/me` → verify `isAdmin: true`
   - Visit Inventory → see Settings button
   - Open Settings modal → see tag ID field
   - Edit tag ID → save
   - Verify in database: `SELECT * FROM project_config`

4. **Test non-admin flow:**
   - Login as regular user (not in `admin_users`)
   - Call `/api/me` → verify `isAdmin: false`
   - Visit Inventory → no Settings button
   - Direct API call to `/api/config` → no `ad_tag_id` in response
   - Attempt to query `project_config` → RLS blocks

**Build Process:**
- **Frontend:** `npm run build` → `web/dist/`
- **Backend:** `supabase functions deploy me` (deploys /api/me)
- **Backend:** `supabase functions deploy config` (deploys /api/config updates)
- **Migrations:** `supabase db push` (applies to production)

**Deployment Sequence:**
1. Deploy migration (add tables, RLS policies)
2. Deploy Edge Functions (me, config)
3. Deploy frontend (updated components)
4. Manually add initial admin users via SQL

---

### Data Flow Architecture

**Read Flow (Admin Fetching Project Config):**
```
AdminSettingsModal
  ├── Calls: fetch('/api/config?projectId=123', { JWT })
  │
  └── Edge Function: /api/config
        ├── Validates JWT → userId
        ├── Queries admin_users (service role) → isAdmin = true
        ├── Queries project table → base config
        ├── Queries project_config table → { ad_tag_id: "ca-pub-xxx" }
        ├── Merges data (includes ad_tag_id because isAdmin)
        └── Returns: { id, name, ..., ad_tag_id: "ca-pub-xxx" }
              │
              └── Modal receives config
                    └── Renders tag ID field (data.ad_tag_id exists)
```

**Write Flow (Admin Saving Tag ID):**
```
AdminSettingsModal
  ├── User clicks Save
  │
  └── Calls: supabase.from('project_config').upsert({
        project_id: 123,
        ad_tag_id: "ca-pub-new",
        updated_by: userId
      })
        │
        └── Supabase Database
              ├── RLS Policy Check: "Admins can modify project_config"
              ├── Queries: EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
              ├── Result: true (user is admin)
              ├── Write allowed ✅
              └── Returns success
                    │
                    └── Modal shows success message, closes
```

**Security Breach Attempt (Non-Admin Trying to Access Tag ID):**
```
Malicious User
  ├── Attempt 1: Direct API call
  │     └── fetch('/api/config?projectId=123', { THEIR_JWT })
  │           └── Edge Function
  │                 ├── Validates JWT → their userId
  │                 ├── Queries admin_users → isAdmin = false
  │                 ├── Omits ad_tag_id from response
  │                 └── Returns: { id, name, ... } (NO ad_tag_id)
  │                       └── Network inspection: no sensitive data ✅
  │
  ├── Attempt 2: Direct database query
  │     └── supabase.from('project_config').select('*')
  │           └── RLS Policy: "Admins can view project_config"
  │                 ├── Checks: EXISTS (admin_users WHERE user_id = THEIR_ID)
  │                 ├── Result: false
  │                 └── Returns: 0 rows (blocked by RLS) ✅
  │
  └── Attempt 3: SQL injection or manipulation
        └── Supabase prepared statements prevent injection
              └── Even if attempted, RLS blocks unauthorized access ✅
```

---

## ✅ **Critical Security Architecture Summary**

### **Backend-First Security Model**

**Layer 1: Database (Final Enforcement)**
- RLS policies on `project_config` table block unauthorized access
- Admin checks via `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())`
- No way to circumvent at database level
- Even compromised Edge Function cannot bypass RLS

**Layer 2: API (Primary Enforcement)**
- `/api/me`: Authoritative admin status from `admin_users` table (service role query)
- `/api/config`: Backend validates admin, conditionally includes `ad_tag_id` in response
- All mutations validated on backend before database write
- Field stripping happens server-side (non-admins never receive sensitive data)

**Layer 3: UI (User Experience)**
- `UserContext.isAdmin`: UI hints ONLY (show/hide Settings button)
- Conditional rendering: Based on DATA PRESENCE, not role checks
  ```typescript
  // ✅ CORRECT: Data-driven
  {config.ad_tag_id !== undefined && <input />}
  
  // ❌ WRONG: Role-driven (security decision in frontend)
  {isAdmin && <input />}
  ```
- If backend didn't send `ad_tag_id`, field doesn't render

### **Security Invariants (Enforced by Architecture)**

1. **Non-admins NEVER see ad_tag_id:**
   - Database: RLS blocks `project_config` SELECT
   - API: Field stripping removes from response
   - UI: Field doesn't exist in DOM (data not present)

2. **Admin status determined server-side:**
   - `/api/me` queries `admin_users` table (authoritative)
   - Frontend `isAdmin` is cache of backend decision, not source of truth
   - All security checks repeat backend validation

3. **Defense in depth:**
   - Each layer enforces independently
   - Compromise of one layer doesn't expose data
   - Example: Malicious Chrome extension modifying `isAdmin` in React state → API still strips fields

4. **No client-side secrets:**
   - Service role key NEVER in frontend code
   - JWT tokens used for user authentication only
   - Admin queries use service role in backend only

---

## Architecture Validation Results

### ✅ Coherence Validation

**Decision Compatibility:**
- ✅ All technology choices compatible (React 19.2 + Vite 7.2.4 + Supabase 2.90.1 + TypeScript 5.9.3)
- ✅ Separate `project_config` table pattern works with existing `project` table
- ✅ Edge Functions (Deno runtime) integrate cleanly with Supabase
- ✅ Backend-first security model enforces consistently at all layers

**Pattern Consistency:**
- ✅ Naming conventions aligned: `snake_case` (DB) → `camelCase` (TypeScript) → PascalCase (Components)
- ✅ Backend security enforcement pattern consistent across `/api/me` and `/api/config`
- ✅ Data-driven rendering pattern removes frontend security responsibility
- ✅ RLS policies follow same `EXISTS (admin_users)` check pattern

**Structure Alignment:**
- ✅ Project structure supports backend-first security (Edge Functions control data flow)
- ✅ Separate `project_config` table maintains security boundary at database level
- ✅ `UserContext` provides UI hints without security decision-making
- ✅ Component boundaries respect security layers (no client-side admin checks for data access)

### ✅ Requirements Coverage Validation

**Functional Requirements Coverage:**
- ✅ **Admin Tag ID Management:** `project_config` table + `AdminSettingsModal` + backend field stripping
- ✅ **Search & Discovery:** Existing Inventory search + admin RLS bypass for cross-account access
- ✅ **Inline Editing Interface:** Modal-based settings UI following existing modal pattern
- ✅ **Cross-Account Access:** Admin RLS bypass in `project` SELECT policy via `EXISTS (admin_users)`
- ✅ **Audit Trail:** DEFERRED to post-MVP (documented, can be added without breaking changes)
- ✅ **Field Invisibility:** Backend field stripping + data-driven rendering ensures field absent from DOM

**Non-Functional Requirements Coverage:**
- ✅ **Security (Critical - Three-Layer Defense):**
  - Database: RLS policies block unauthorized `project_config` access
  - API: `/api/me` and `/api/config` validate admin status, strip fields server-side
  - UI: Data-driven rendering (fields only appear if backend sent them)
  - Tag IDs control revenue distribution → architecture treats as existential protection

- ✅ **Performance:**
  - `/api/me`: ~50-100ms on app mount (one-time cost, acceptable)
  - Field stripping: Minimal overhead (<10ms per request)
  - RLS queries: Indexed on `admin_users.user_id` for fast checks
  - Meets <200ms API response SLA

- ✅ **Scalability:**
  - RLS policies scale with existing patterns (proven at thousands of projects)
  - Admin checks via indexed `admin_users` table
  - Pagination supported by existing Inventory patterns
  - No architectural bottlenecks introduced

- ✅ **Compliance & Backwards Compatibility:**
  - Row-level isolation maintained (RLS policies unchanged for regular users)
  - Separate `project_config` table → zero impact on existing `project` table
  - Field stripping preserves existing API contracts
  - Non-admin users experience no changes

### ✅ Implementation Readiness Validation

**Decision Completeness:**
- ✅ All database tables specified with exact schemas, column types, and RLS policies
- ✅ All Edge Function endpoints documented with code examples and security patterns
- ✅ Reusable patterns defined: JWT validation, admin checks, field stripping, data-driven rendering
- ✅ Technology stack versions specified for all dependencies
- ✅ Migration naming, file structure, and idempotent patterns documented

**Structure Completeness:**
- ✅ Complete file tree with NEW/MODIFY/EXISTS annotations per file
- ✅ All Edge Function endpoints specified: `/api/me` (new), `/api/config` (extend)
- ✅ All React components mapped: `UserContext`, `AdminSettingsModal`, `Inventory` modifications
- ✅ Integration points clearly defined: App initialization, admin tag editing flow, security breach attempts
- ✅ Database migration file structure and execution sequence documented

**Pattern Completeness:**
- ✅ Backend-first security pattern documented with flow diagrams at every layer
- ✅ Error handling patterns for Edge Functions (try/catch, status codes, error responses)
- ✅ JWT validation pattern (reusable across all endpoints)
- ✅ Data-driven rendering pattern with correct/incorrect examples
- ✅ Critical consistency rules for AI agents (NEVER/ALWAYS lists)

### Gap Analysis Results

**Critical Gaps: NONE** ✅
- All blocking architectural decisions documented and approved
- Security model complete with three-layer enforcement
- Implementation sequence clear with dependencies mapped

**Important Considerations (Non-Blocking):**
1. **Audit Logging (Intentionally Deferred to Post-MVP):**
   - Decision documented with post-MVP implementation plan
   - Can be added via database triggers without breaking changes
   - Risk accepted: No audit trail during MVP with limited admin rollout mitigation

2. **Admin Management UI (Future Enhancement):**
   - Currently ops team adds admins via direct SQL
   - Non-blocking: Only affects admin onboarding, not end-user features
   - Future: Build admin management interface after MVP validation

3. **Real-time Updates (Future Enhancement):**
   - Currently requires page refresh after tag ID changes
   - Supabase real-time can be added incrementally
   - Non-blocking: Manual refresh acceptable for MVP admin workflows

**Nice-to-Have Enhancements (Post-MVP):**
- TypeScript interfaces generated from database schema (e.g., Supabase CLI type generators)
- E2E tests for admin flows (currently manual testing plan provided)
- Performance monitoring/telemetry for `/api/me` and `/api/config` endpoints
- Admin activity dashboard for operational visibility

### Validation Issues Addressed

**Issue 1: Frontend Security Decision-Making → RESOLVED ✅**
- **Original Concern:** Frontend `isAdmin` role checks could enable security decisions in client code
- **Resolution:** Backend-first security architecture implemented
  - `UserContext.isAdmin` explicitly documented as "UI hints ONLY"
  - All security decisions made server-side (API field stripping, RLS policies)
  - Data-driven rendering pattern: `{config.ad_tag_id !== undefined && <input />}`
  - Pattern enforced via "Critical Consistency Rules" section
- **Validation:** Security model reviewed across all three layers, no client-side decision points found

**Issue 2: Audit Trail Requirement → ACCEPTED RISK ✅**
- **Original Concern:** PRD specified audit trail as functional requirement
- **Resolution:** Explicitly deferred to post-MVP with documented rationale
  - Reduces MVP complexity, accelerates shipping to validate business value
  - Post-MVP implementation plan specified (database triggers + audit_logs table)
  - Risk mitigation: Limited admin rollout during MVP phase
- **Validation:** Stakeholder (Moshe) accepted deferral in Decision 8

**No Additional Critical Issues Found** ✅

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (brownfield React 19.2 + TypeScript 5.9.3 + Supabase environment)
- [x] Scale and complexity assessed (Medium-High, thousands of projects across hundreds of accounts)
- [x] Technical constraints identified (must preserve existing RLS, backwards compatible, no breaking changes)
- [x] Cross-cutting concerns mapped (authentication, security, audit logging, backwards compatibility)

**✅ Architectural Decisions**
- [x] 8 critical decisions documented with full rationale and code examples
- [x] Technology stack fully specified with versions (React 19.2, Vite 7.2.4, Supabase 2.90.1, etc.)
- [x] Integration patterns defined (three-layer security, backend-first enforcement, data-driven rendering)
- [x] Performance trade-offs analyzed and accepted (~50-100ms for `/api/me` on app mount)

**✅ Implementation Patterns**
- [x] Naming conventions established (`snake_case` DB, `camelCase` TS, PascalCase components)
- [x] Structure patterns defined (migrations, Edge Functions, React components, file placement)
- [x] Communication patterns specified (JWT validation, admin checks, field stripping, error handling)
- [x] Process patterns documented (testing approach, deployment sequence, development workflow)

**✅ Project Structure**
- [x] Complete directory structure defined with 3 levels deep (NEW/MODIFY/EXISTS per file)
- [x] Component boundaries established (Database → API → UI layers with clear responsibilities)
- [x] Integration points mapped (6 detailed flow diagrams: app init, admin editing, security breach attempts)
- [x] Requirements to structure mapping complete (each FR/NFR → specific files and components)

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **HIGH**

**Reasoning:**
- Backend-first security architecture is sound with three independent enforcement layers
- All critical decisions documented with versions, rationale, and code examples
- Patterns are clear, reusable, and include correct/incorrect usage examples
- No critical gaps or blockers identified during validation
- Security model reviewed and validated against breach attempt scenarios
- Implementation sequence clear with dependency mapping

**Key Architectural Strengths:**

1. **Security by Design (Defense in Depth):**
   - Three independent enforcement layers cannot be bypassed
   - Backend controls all security decisions (frontend never trusted)
   - Each layer validates independently (compromise of one doesn't expose data)
   - Explicit threat modeling: Breach attempt flow diagrams document expected behavior

2. **Backend Authoritative Pattern:**
   - `/api/me` queries `admin_users` table (single source of truth)
   - `/api/config` strips fields server-side before response
   - RLS policies provide final database-level enforcement
   - No client-side secrets or security logic

3. **Backwards Compatible Architecture:**
   - Separate `project_config` table (zero changes to existing `project` schema)
   - Field stripping preserves API contracts for non-admin users
   - Existing RLS policies unchanged (admin bypass additive only)
   - Non-admin users experience identical application behavior

4. **Clear, Reusable Patterns:**
   - JWT validation pattern documented for reuse across all endpoints
   - Admin check pattern standardized (`EXISTS (SELECT 1 FROM admin_users)`)
   - Data-driven rendering pattern with examples (correct vs incorrect)
   - Error handling patterns for Edge Functions

5. **Implementation-Ready Documentation:**
   - Complete file tree with exact paths and NEW/MODIFY annotations
   - Exact database schemas with column types and RLS policy SQL
   - Code examples for all patterns (TypeScript, SQL, React)
   - First implementation priority with step-by-step commands

**Areas for Future Enhancement (Post-MVP):**

1. **Audit Logging System:**
   - Database triggers on `project_config.ad_tag_id` changes
   - Capture: user_id, timestamp, old_value, new_value, IP, user agent
   - Admin-only audit trail viewer component

2. **Admin Management Interface:**
   - UI for ops team to add/remove admin users
   - Currently: Direct SQL inserts to `admin_users` table
   - Future: Secure admin panel with role management

3. **Real-time Synchronization:**
   - Supabase real-time subscriptions for live tag ID updates
   - Currently: Page refresh required after changes
   - Future: Instant updates across admin sessions

4. **Automated Testing Suite:**
   - E2E tests for admin workflows (tag ID editing, cross-account access)
   - Integration tests for Edge Functions (field stripping validation)
   - Unit tests for React components (data-driven rendering)

5. **Performance Monitoring:**
   - Telemetry for `/api/me` and `/api/config` latency
   - RLS policy performance monitoring (admin check query times)
   - Admin dashboard with operational metrics

### Implementation Handoff

**AI Agent Guidelines:**

1. **Follow Backend-First Security:** 
   - Never make security decisions in frontend code
   - Always validate admin status on backend before returning sensitive data
   - Use data-driven rendering (render based on data presence, not role checks)

2. **Reuse Documented Patterns:**
   - JWT validation pattern (defined in "Authentication & Authorization Patterns")
   - Admin check pattern (`EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())`)
   - Field stripping pattern (query conditionally, merge conditionally, return)
   - Data-driven rendering (`{config.ad_tag_id !== undefined && ...}`)

3. **Respect Architectural Boundaries:**
   - Database layer enforces via RLS (admin checks in policies)
   - API layer enforces via Edge Functions (validate JWT, check admin, strip fields)
   - UI layer renders based on data (no security logic in components)

4. **Maintain Consistency Rules:**
   - NEVER: Return `ad_tag_id` to non-admin users
   - NEVER: Skip JWT validation in Edge Functions
   - ALWAYS: Check admin status before returning sensitive data
   - ALWAYS: Use existing Supabase client pattern from `lib/supabase.ts`

5. **Refer to This Document:**
   - All architectural questions answered in relevant sections
   - Code examples provided for all major patterns
   - Critical consistency rules enforce agent alignment

**First Implementation Steps:**

```bash
# Step 1: Create and apply database migration
cd divee.ai
supabase migration new add_admin_infrastructure

# Edit migration file with:
# - CREATE TABLE admin_users (...)
# - CREATE TABLE project_config (...)
# - RLS policies for both tables
# - UPDATE project SELECT policy (add admin bypass)

supabase migration up

# Step 2: Create /api/me Edge Function
supabase functions new me

# Edit supabase/functions/me/index.ts with:
# - JWT validation
# - Admin status query (service role)
# - Return { user, isAdmin, accounts }

supabase functions deploy me

# Step 3: Extend /api/config Edge Function
# Modify supabase/functions/config/index.ts to add:
# - Admin status check
# - Conditional project_config query
# - Field stripping before response

supabase functions deploy config

# Step 4: Frontend - Create UserContext
# Create web/src/contexts/UserContext.tsx with:
# - UserProvider component
# - useUser() custom hook
# - Calls /api/me on mount

# Step 5: Frontend - Create AdminSettingsModal
# Create web/src/components/AdminSettingsModal.tsx with:
# - Modal UI following existing pattern (CollaboratorsModal.tsx)
# - Data-driven tag ID field rendering
# - Save handler to project_config table

# Step 6: Frontend - Modify Inventory page
# Edit web/src/pages/Inventory.tsx to:
# - Import and use useUser() hook
# - Add conditional Settings button (if isAdmin)
# - Add conditional tag ID column (if data.ad_tag_id present)
# - Integrate AdminSettingsModal component

# Step 7: Test admin flow
# - Insert test admin: INSERT INTO admin_users (user_id) VALUES ('...')
# - Login as admin user
# - Verify Settings button appears
# - Open modal, verify tag ID field present
# - Edit and save tag ID
# - Verify database update in project_config table

# Step 8: Test non-admin flow
# - Login as regular user (not in admin_users)
# - Verify no Settings button
# - Attempt API call to /api/config
# - Verify ad_tag_id not in response (field stripped)
```

**Implementation Priority:**
1. Database migration (foundation for all features)
2. `/api/me` Edge Function (authoritative admin status)
3. `/api/config` extension (field stripping security)
4. Frontend UserContext (caching admin status)
5. Frontend AdminSettingsModal (admin UI)
6. Frontend Inventory modifications (integration point)

**Success Criteria:**
- ✅ Admin users can view and edit tag IDs across all projects
- ✅ Non-admin users see no tag ID fields in UI
- ✅ Network inspection reveals no `ad_tag_id` in responses for non-admins
- ✅ RLS policies block direct database queries from non-admins
- ✅ All three security layers enforce independently

---

## ✅ Architecture Workflow Complete

**Document Status:** COMPLETE - Ready for Implementation

**Next Steps:**
1. Return to PM agent to create Epics and Stories
2. Use this Architecture document + PRD as input for story breakdown
3. Generate implementation-ready development tasks

**Architecture Document Location:**
`_bmad-output/planning-artifacts/architecture.md`

**Total Sections Completed:**
1. ✅ Project Context Analysis
2. ✅ Existing Technology Stack
3. ✅ Core Architectural Decisions (8 decisions)
4. ✅ Implementation Patterns & Consistency Rules
5. ✅ Project Structure & Boundaries
6. ✅ Architecture Validation Results
7. ✅ Use TypeScript interfaces for type safety
8. ✅ Handle loading and error states in frontend

**Security Checklist (Every Implementation):**
- [ ] JWT validated in Edge Function
- [ ] Admin status checked before privileged operations
- [ ] `ad_tag_id` stripped from non-admin API responses
- [ ] RLS policies prevent unauthorized database access
- [ ] Frontend conditionally renders admin-only UI
- [ ] Error handling doesn't leak sensitive information
