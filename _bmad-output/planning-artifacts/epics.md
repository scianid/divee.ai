---
stepsCompleted: [1, 2]
inputDocuments:
  - 'C:\Users\moshe\Documents\Development\divee.ai\_bmad-output\planning-artifacts\prd.md'
  - 'C:\Users\moshe\Documents\Development\divee.ai\_bmad-output\planning-artifacts\architecture.md'
---

# divee.ai - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for divee.ai Admin Tag Management, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**FR1:** Admin authentication & role checking (JWT-based)
**FR2:** Search/filter projects by name with real-time filtering across thousands of projects
**FR3:** View all projects across all accounts (system admin "god mode")
**FR4:** Inline tag ID editing interface (modal-based settings UI for per-project tag ID updates)
**FR5:** API security with field stripping for non-admins (tag_id removed from responses)
**FR6:** Audit logging for all tag ID changes (who, what, when, old value, new value)
**FR7:** Tag ID field invisibility for non-admin users (completely absent from DOM)
**FR8:** Cross-account access capability for admin users
**FR9:** Admin-only menu item ("Ad Tags") with role-based route protection
**FR10:** Per-widget "Settings" button with modal/popup UI pattern
**FR11:** Current tag value displayed before editing with copy/paste support
**FR12:** Success confirmation message showing which widget was updated
**FR13:** Updated value immediately visible after save (no page refresh required)
**FR14:** Clear widget identification (account name + project name) to prevent wrong-target updates

### Non-Functional Requirements

**NFR1:** API response time <200ms for single tag ID operations
**NFR2:** Search performance <500ms across thousands of projects
**NFR3:** Support 100+ concurrent admin operations
**NFR4:** System handles 1000+ concurrent operations
**NFR5:** 99.9% uptime for admin panel
**NFR6:** Three-layer defense architecture (UI + API + Database)
**NFR7:** JWT-based authentication with role validation on every request
**NFR8:** Tag IDs control revenue distribution (existential business protection)
**NFR9:** Tamper-proof audit logs with retention policy
**NFR10:** Row-level data isolation (multi-tenant architecture)
**NFR11:** Backwards compatibility (no breaking changes to existing system)
**NFR12:** Manage thousands of projects across hundreds of customer accounts
**NFR13:** Pagination required (100 projects per page recommended)
**NFR14:** Indexed search on customer/project names
**NFR15:** Zero unauthorized tag ID access attempts succeed
**NFR16:** 100% of tag ID changes logged in audit trail
**NFR17:** Non-admin users never see tag ID fields (complete invisibility)
**NFR18:** Desktop-first responsive design (operations staff use desktop workstations)

### Additional Requirements

**From Architecture:**

- **Backend-First Security Model:** All security decisions made server-side, frontend renders only data it receives
- **Separate `admin_users` table:** Custom table for admin role storage with RLS policies
- **Separate `project_config` table:** 1-to-1 with `project` table, admin-only RLS, stores `ad_tag_id`
- **Edge Function `/api/me`:** Authoritative admin status detection endpoint (validates JWT, queries admin_users)
- **Edge Function `/api/config` extension:** Field stripping logic - conditionally includes `ad_tag_id` based on admin status
- **RLS policy updates:** Add admin bypass to `project` SELECT policy via `EXISTS (admin_users)` check
- **Data-driven rendering pattern:** Frontend components render based on data presence, not role checks
- **UserContext implementation:** React Context caching `/api/me` response with `useUser()` hook for UI hints
- **Admin utilities library:** `admin.ts` helper functions (no auth logic in utilities)
- **Migration file:** `20260129000001_add_admin_infrastructure.sql` with all schema changes
- **Idempotent migrations:** Use `IF NOT EXISTS`, `DROP POLICY IF EXISTS` for safety
- **Database naming conventions:** `snake_case` for tables/columns, PascalCase for React components, camelCase for TypeScript
- **JWT validation pattern:** Reusable across all Edge Functions (extract, validate, return userId)
- **Admin check pattern:** Reusable `EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())`
- **Error handling pattern:** Standard try/catch with 401/500 status codes in Edge Functions
- **Three independent enforcement layers:** Database RLS + API field stripping + UI data-driven rendering
- **Complete file tree documented:** NEW/MODIFY/EXISTS annotations per file with exact paths
- **Supabase integration:** Extend existing stack (React 19.2, TypeScript 5.9.3, Vite 7.2.4, Supabase 2.90.1)
- **Brownfield constraints:** Must preserve existing RLS policies, backwards compatible, no breaking changes
- **Audit logging deferred to post-MVP:** Database triggers on project_config changes (future enhancement)
- **Testing approach:** Manual testing during MVP, E2E tests post-MVP

### FR Coverage Map

FR1: Epic 1 - Admin authentication & role checking (JWT-based)
FR2: Epic 2 - Real-time search/filter across thousands of projects (admin-only)
FR3: Epic 2 - View all projects across all accounts (god mode, admin-only)
FR4: Epic 3 - Inline tag ID editing (modal-based settings UI)
FR5: Epic 3 - API field stripping for non-admins
FR6: Future Enhancement - Audit logging (who/what/when/old/new)
FR7: Epic 3 - Tag ID field invisibility for non-admins
FR8: Epic 2 - Cross-account access capability (admin-only)
FR9: Epic 1 - Admin-only menu with route protection
FR10: Epic 3 - Per-widget Settings button (modal pattern)
FR11: Epic 3 - Display current tag value before editing
FR12: Epic 3 - Success confirmation message
FR13: Epic 3 - No-refresh updates
FR14: Epic 2 - Clear widget identification

**MVP Coverage:** 13 of 14 FRs mapped to Epics 1-3
**Post-MVP:** 1 FR (FR6) in Future Enhancements

## Epic List

### Epic 1: Admin Authentication & Access Foundation

Operations staff can securely log in as admins and access the admin interface with appropriate permissions. Ops staff log in with their admin credentials, system validates their admin role automatically, admin-only menu items appear in navigation, and foundation is established for all admin operations.

**FRs covered:** FR1, FR9

**Key deliverables:**
- `admin_users` table with RLS policies
- `/api/me` Edge Function for admin detection
- `UserContext` with `useUser()` hook
- JWT validation pattern established
- Backend-first security model foundation

---

### Epic 2: Cross-Account Project Visibility (Admin-Only)

Admin users only can view and search across ALL customer projects (god mode) to find the specific project they need to manage. Admins view complete list of all projects across all customer accounts, search/filter by account name or project name with real-time results, identify specific projects clearly, and navigate through thousands of projects with pagination. Regular users continue to see only their own projects (existing behavior preserved).

**FRs covered:** FR2, FR3, FR8, FR14

**Key deliverables:**
- RLS policy admin bypass on `project` table
- Search functionality with indexed queries
- Pagination (100 per page)
- Clear project identification UI
- Cross-account access enforced at database level

**Security note:** RLS admin bypass ensures only authenticated admin users can access cross-account data. Regular users remain isolated to their own projects.

---

### Epic 3: Secure Tag ID Management

Operations staff can safely view and edit ad tag IDs with full confidence that the system prevents unauthorized access. Admins view current tag ID values for any project (admin-only field), edit tag IDs through a safe guided UI (modal-based), save changes with immediate visual confirmation, and trust that non-admin users can never see or access tag IDs.

**FRs covered:** FR4, FR5, FR7, FR10, FR11, FR12, FR13

**Key deliverables:**
- `project_config` table for admin-only configuration
- `/api/config` Edge Function with field stripping
- `AdminSettingsModal` component with data-driven rendering
- Backend validates admin status on every write
- Three-layer security enforcement (Database RLS + API field stripping + UI data-driven rendering)

---

### Future Enhancements (Post-MVP)

**Audit Trail & Compliance:**
Complete audit logging system with database triggers, `audit_logs` table tracking all tag ID changes (who, what, when, old value, new value), admin-only audit log viewer UI, and tamper-proof logs for compliance and troubleshooting.

**FRs covered:** FR6
