---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type']
inputDocuments: ['C:\\Users\\moshe\\Documents\\Development\\divee.ai\\_bmad-output\\planning-artifacts\\admin-tag-id-brainstorming-2026-01-28.md']
workflowType: 'prd'
briefCount: 0
researchCount: 0
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: 'Web Application - Admin Operations Panel'
  domain: 'SaaS Platform Operations / AdTech'
  complexity: 'Medium-High'
  projectContext: 'Brownfield'
  coreProblem: 'Remove risky direct database access from non-technical operations staff and replace with safe, constrained UI for tag ID management'
  primaryUser: 'Non-technical operations staff'
  keyConstraint: 'Must prevent accidental data destruction while enabling necessary operational tasks'
---

# Product Requirements Document - divee.ai

**Author:** Moshe
**Date:** 2026-01-28

## Success Criteria

### User Success (Operations Staff)

**Emotional Success:** Confidence to manage projects independently without fear of breaking things

**Measurable Outcomes:**
- Ops staff can update tag ID in <30 seconds without technical assistance
- Zero "did I break it?" support tickets from ops team
- Ops staff handles 100% of tag ID updates without escalating to tech team

### Business Success

**3-Month Success (MVP Launch):**
- 100% of tag ID updates handled through admin UI (zero direct database access)
- Tech team time spent on tag ID requests drops to zero
- All tag ID changes logged with audit trail

**12-Month Success (Scale):**
- Ops team independently creates 100+ projects monthly
- Ops team manages 10,000+ projects without tech team involvement
- Zero revenue loss due to tag ID errors or tampering

### Technical Success

- Zero unauthorized tag ID access attempts succeed
- 100% of tag ID changes logged in audit trail
- Non-admin users never see tag ID fields (complete invisibility)
- API response time <200ms for tag ID operations
- System handles 1000+ concurrent admin operations

### Measurable Outcomes

- **Security:** Zero successful unauthorized access attempts
- **Speed:** <30 seconds to update single tag ID
- **Scale:** Bulk operations handle 100+ projects in <2 minutes
- **Reliability:** 99.9% uptime for admin panel
- **Adoption:** 100% of tag ID operations through UI within 30 days of launch

## Product Scope

### MVP - Minimum Viable Product (This PRD)

**Core Focus:** Safe tag ID management for existing projects

**Must Have:**
- Admin authentication & role checking (JWT-based)
- Search/filter projects by name
- View all projects across all accounts (system admin "god mode")
- Inline tag ID editing on inventory page
- API security (field stripping for non-admins)
- Audit logging for all tag ID changes
- Tag ID immutability (requires admin approval to change)

**Success Gate:** Ops team can update tag IDs without database access

### Growth Features (Post-MVP)

**Phased rollout after MVP proves successful**

**Phase 2A - Operational Efficiency:**
- Centralized tag management hub (`/admin/tag-management`)
- Bulk tag ID updates (100+ projects at once)
- Filter by "missing tag ID"
- Import/export tag IDs (CSV)
- Search by project ID (in addition to name)

**Phase 2B - Data Protection:**
- Soft-delete with 30-day recovery
- Tag ID locking for critical projects
- 2FA for destructive operations

### Vision (Future) - Full Admin Capabilities

**Long-term goal: Complete self-service ops**

**Project Lifecycle Management:**
- Create new projects through admin UI
- Edit all widget properties (not just tag IDs):
  - Name, description, colors
  - Allowed URLs, language settings
  - Display mode, positioning
  - Article class, container class
- Delete projects with safeguards
- Duplicate/clone projects

**Advanced Operations:**
- Proactive alert system (revenue impact monitoring)
- Dashboard with aggregate metrics
- Time-filtered onboarding velocity tracking
- Bulk project creation
- Template management for common configurations

**Success Gate:** Ops team creates 100+ projects monthly without tech team involvement

## User Journeys

### Journey 1: Operations Staff - Safe Tag ID Update

**Persona: John - Customer Success Manager**

**Context:**
- Non-technical customer success manager with zero coding skills
- Comfortable with basic web UIs but fears breaking technical things
- Main anxiety: Accidentally affecting customer revenue

**Opening Scene:**

It's Tuesday morning. Moshe messages John on Slack: "Hey, we're reorganizing our ad tag structure. Need you to update Acme Corp's widget to tag ID `pub-987654321`. Shouldn't take more than a minute."

John's stomach tightens slightly. He remembers the time he accidentally updated the wrong customer's tag with direct database access - took hours to fix. But now there's a proper admin panel with guardrails.

**The Journey:**

1. **Login & Access**
   - John opens divee.ai admin portal, logs in with admin credentials
   - Sees familiar dashboard with new "Ad Tags" menu item
   - Clicks "Ad Tags" → dedicated admin page loads

2. **Search & Discovery**
   - Page displays list of thousands of widgets with prominent search bar
   - Types "Acme Corp" → results filter instantly
   - Sees 3 widgets for Acme Corp, identifies "Acme Corp - Main Site Widget"

3. **Edit Configuration**
   - Clicks "Settings" button next to the widget
   - Modal opens showing all widget configuration
   - Locates "Ad Tag ID" field showing current value: `pub-123456789`
   - Carefully pastes new tag: `pub-987654321`
   - Double-checks the value (controls customer revenue - no room for typos)

4. **Save & Confirm**
   - Clicks "Save"
   - Brief loading state
   - Success message: "Settings updated successfully for Acme Corp - Main Site Widget"
   - Modal closes, updated tag ID visible in the list

**Resolution:**

John messages back: "Done ✓"

He feels relief wash over him. No database queries. No risk of wrong-row updates. Search, click, paste, save. 45 seconds total. His confidence grows - he can do this independently without tech team handholding.

**Emotional Arc:** Anxiety → Caution → Relief → Confidence

### Journey Requirements Summary

This journey reveals the following capability requirements:

**Access Control:**
- Admin-only menu item ("Ad Tags")
- Role-based authentication before page access
- Admin credentials validated via JWT

**Search & Navigation:**
- Real-time search filtering across thousands of widgets
- Search by account/customer name
- Multiple results per account handled gracefully
- Clear widget identification (account name + project name)

**Editing Interface:**
- Per-widget "Settings" button
- Modal/popup UI pattern
- All settings visible in one view
- Ad Tag ID field (admin-only visibility)
- Copy/paste support for tag values
- Current value displayed before editing

**Validation & Confirmation:**
- Success message showing which widget was updated
- Updated value immediately visible after save
- No page refresh required
- Audit logging (backend) for compliance

**Error Prevention:**
- Clear widget identification prevents wrong-target updates
- Modal pattern focuses attention on single widget at a time
- Confirmation message includes widget name for verification

## Domain-Specific Requirements

### AdTech & Business Model Security

**Publisher Compliance:**
- Google AdSense (or similar network) TOS compliance required
- Invalid traffic prevention (click fraud detection)
- Ad placement policies must be followed (user experience requirements)
- Revenue reporting accuracy is critical

**Business Model Protection:**
- Tag IDs control revenue distribution in zero-friction model
- Platform doesn't charge users, PAYS users rev-share from ads
- Tag ID compromise = revenue diversion = business collapse
- Tag ID security is existential business protection, not just a feature

### Multi-Tenant SaaS Constraints

**Data Isolation:**
- Complete separation of customer data across accounts
- No cross-customer data leakage through admin interface
- Role-based access control enforced at all layers

**Audit Requirements:**
- All tag ID changes must be logged with: who, what, when, previous value
- Audit trail enables compliance verification and troubleshooting
- Logs must be tamper-proof and retained for compliance

**Scale Requirements:**
- Support thousands of projects across hundreds of accounts
- Handle hundreds of concurrent admin operations
- Sub-200ms API response time for tag ID operations

### Security Architecture

**Three-Layer Defense:**

1. **UI Layer** - Field invisibility pattern
   - Non-admin users never see tag ID fields in DOM
   - Fields don't exist in HTML for non-admins (not just hidden/disabled)
   - Admin role checked before rendering sensitive components

2. **API Layer** - Centralized security via API Gateway
   - JWT validation on every request
   - Role extraction from JWT claims
   - Field stripping for non-admin requests (tag_id removed from payloads)
   - Economic barrier: JWT harder to forge than session tokens

3. **Database Layer** - Last line of defense
   - Audit logging triggers on tag_id updates
   - RLS policies for admin-only operations
   - Database constraints prevent invalid states

**Why API Gateway Pattern:**
- Centralizes security logic (vs distributed RLS across tables)
- Easier to audit and test security rules
- Clearer separation of concerns
- Better performance (single auth check vs per-row checks)

### Integration Constraints

**Brownfield Environment:**
- Existing Supabase database schema must be extended (not rebuilt)
- Existing Supabase Auth system for user authentication
- Existing RLS policies may need adjustment for admin roles
- React/TypeScript frontend with existing component library

**Technical Stack:**
- Frontend: React + TypeScript + existing UI components
- Backend: Supabase (PostgreSQL) with existing schema
- Auth: Supabase Auth with JWT tokens
- API: Supabase API + custom Edge Functions for admin operations

### Risk Mitigations

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|---------|---------------------|
| **User modifies tag ID via API manipulation** | High | Catastrophic | API field stripping + JWT role validation + database audit logging |
| **Ops staff updates wrong project** | Medium | High | Search result confirmation + clear project identification + audit trail for rollback |
| **Tag ID accidentally deleted** | Medium | High | Audit logging with previous values + soft-delete capability (Growth phase) |
| **Unauthorized admin access** | Low | Catastrophic | JWT validation + admin role verification + 2FA for destructive operations (Growth phase) |
| **Mass incorrect updates** | Low | High | Backup strategy + audit trail for bulk rollback + bulk operation confirmation dialogs (Growth phase) |

### Performance Requirements

- **API Response Time:** <200ms for single tag ID operations
- **Search Performance:** <500ms for search across thousands of projects
- **Bulk Operations:** <2 minutes for 100+ project updates (Growth phase)
- **Uptime:** 99.9% availability for admin panel
- **Concurrent Users:** Support 100+ concurrent admin operations

## Web Application - Admin Operations Panel Requirements

### Project-Type Overview

This is an **internal operations admin panel** for a multi-tenant SaaS platform. It extends the existing divee.ai web application to provide privileged access for operations staff to manage customer projects without direct database access.

**Key Characteristics:**
- Brownfield extension of existing React/TypeScript web app
- Role-based access control with two tiers (Admin, Regular User)
- Multi-tenant architecture with row-level data isolation
- Security-first design protecting business-critical data (tag IDs)
- Internal tool (not customer-facing), no subscription tiers

### Technical Architecture Considerations

**Frontend Architecture:**
- **Framework:** React + TypeScript (existing stack)
- **Component Library:** Extend existing UI components with admin-specific views
- **State Management:** Existing state management patterns (to be determined from codebase)
- **Routing:** Admin routes protected by role-based guards
- **Responsive Design:** Desktop-first (operations staff use desktop workstations)

**Backend Architecture:**
- **Database:** Supabase (PostgreSQL) with existing schema extension
- **Authentication:** Supabase Auth with JWT tokens
- **Authorization:** Role claims in JWT + API-level field stripping
- **API Pattern:** API Gateway for admin operations (centralized security)
- **Real-time:** Supabase real-time subscriptions (optional for admin dashboard)

### Multi-Tenancy Model

**Row-Level Isolation:**
- Single database, single schema
- Foreign key relationships establish ownership (`user_id`, `account_id`)
- Regular users see only their own projects (enforced by RLS policies)
- Admin users bypass tenant isolation to see all projects (god mode)

**Data Isolation Enforcement:**
- **Application Layer:** UI filters projects by user ownership
- **API Layer:** Admin role checked before returning cross-tenant data
- **Database Layer:** RLS policies with admin role bypass

**Tenant Boundaries:**
- Each user account is a tenant
- Projects/widgets belong to a single account
- Admin role transcends tenant boundaries (system-wide access)

### Role-Based Access Control (RBAC)

**Role Definitions:**

| Role | Description | Scope |
|------|-------------|-------|
| **Admin** | Operations staff with elevated privileges | System-wide access across all accounts |
| **Regular User** | Customer account users | Own account only |

**Permission Matrix:**

| Capability | Admin | Regular User | Enforcement Layer |
|------------|-------|--------------|-------------------|
| View own projects | ✓ | ✓ | Application UI |
| Edit own project settings | ✓ | ✓ | API + Database RLS |
| **View tag ID field** | ✓ | ✗ | UI (field invisible) + API (field stripped) |
| **Edit tag ID** | ✓ | ✗ | API field stripping + Database audit |
| **View ALL projects (any account)** | ✓ | ✗ | API role check + Database RLS bypass |
| Edit ANY project | ✓ | ✗ | API role check + Audit logging |
| Access admin menu/routes | ✓ | ✗ | Route guards + JWT validation |

**Role Assignment:**
- Roles stored in Supabase Auth user metadata or custom `user_roles` table
- JWT contains role claim (`role: 'admin'` or `role: 'user'`)
- Role checked on every API request via JWT validation

### Integration Requirements

**Supabase Integration:**
- **Supabase Database (PostgreSQL):**
  - Extend existing `projects` table with `ad_tag_id` column
  - Add `audit_logs` table for tag ID change tracking
  - Update RLS policies to support admin bypass
  
- **Supabase Auth:**
  - Leverage existing authentication system
  - Add `role` claim to JWT tokens
  - Support admin role assignment via Auth metadata or custom table

- **Supabase API:**
  - Use Supabase client for database queries
  - Add Edge Functions for admin-specific operations requiring field stripping
  - Real-time subscriptions (optional) for live admin dashboard updates

**No Third-Party Integrations:**
- No external analytics, monitoring, or third-party services required for MVP
- All functionality contained within existing Supabase + React stack

### Compliance & Audit Requirements

**Audit Logging:**
- **What to log:** Every tag ID change (who, what, when, old value, new value)
- **Storage:** Dedicated `audit_logs` table in Supabase
- **Retention:** TBD (to be determined based on legal/compliance needs)
- **Access:** Admin-only view of audit logs (future feature)

**Data Privacy:**
- Row-level data isolation prevents cross-tenant data leakage
- Admin access logged for accountability
- No PII exposure beyond what's necessary for operations

**Security Compliance:**
- JWT-based authentication (industry standard)
- API field stripping prevents unauthorized data access
- Three-layer defense (UI + API + Database)

### Implementation Considerations

**Migration Strategy:**
- Add `ad_tag_id` column to existing `projects` table (nullable initially)
- Backfill existing projects with tag IDs (one-time data migration)
- Deploy admin UI behind feature flag (dark launch)
- Gradual rollout to operations team (pilot → full adoption)

**Backwards Compatibility:**
- Existing non-admin users unaffected (no UI changes)
- API remains compatible (tag_id stripped for non-admins)
- Database schema extension (non-breaking change)

**Performance Considerations:**
- Admin "view all projects" queries must be indexed properly
- Search functionality requires full-text search or indexed columns
- Pagination required for thousands of projects (100 per page recommended)

**Testing Requirements:**
- Unit tests for API field stripping logic
- Integration tests for role-based access control
- E2E tests for admin user flows
- Security tests for JWT validation and unauthorized access attempts
