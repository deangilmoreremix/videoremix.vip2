# Admin Access Diagnosis & Resolution

**Date:** 2026-05-12  
**Issue:** Admin user (ID: `12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd`) cannot be recognized as administrator; sees only regular user view despite having admin credentials.

---

## Executive Summary

### Root Cause
The admin user **lacks an entry in the `user_roles` table**, causing:
1. `AdminContext` to fail fetching admin privileges → user signed out or treated as non-admin
2. RLS policy `Users can view apps` to evaluate `EXISTS` subquery as false → admin sees only `is_active=true` apps
3. Application-level role checks fail → admin features disabled

### Database Facts
- `user_roles` has **UNIQUE constraint on `user_id`** (single column) - confirmed via migration `20251003150055_create_admin_users_system.sql`
- `apps` table contains all required GTM columns: `description`, `long_description`, `benefits`, `features`, `use_cases`, `testimonials`, `faqs`, `price`, `tags`, `category`
- RLS is **enabled** on `apps` and `user_roles` tables
- Apps SELECT policy: `is_active = true OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin'))`
- user_roles SELECT policy: `user_id = auth.uid() OR EXISTS (... WHERE role='super_admin')` (allows users to read own role, super_admins read all)

### Resolution
Execute `SUPABASE_ADMIN_FIX.sql` in Supabase SQL Editor to assign the admin role. This creates/updates the `user_roles` entry with `role='admin'` for the target user, linked to the `videoremix` tenant.

---

## 1. Authentication Chain Trace

### 1.1 User Login Flow
```
User credentials → Supabase Auth (auth.users) → JWT token issued
```

The JWT contains the user ID (`sub` claim) but **does NOT contain role information**. Role data lives exclusively in `public.user_roles`.

### 1.2 AdminContext Initialization
**File:** `src/context/AdminContext.tsx`

```
useEffect → verifyAuth()
  ↓
supabase.auth.getSession() → gets JWT session
  ↓
Query: SELECT role FROM user_roles WHERE user_id = session.user.id
  ↓
RLS Policy "Users can read roles" applies:
  - ALLOWED if: user_id = auth.uid() OR user is super_admin
  - This query uses WHERE user_id = session.user.id → matches first condition
  → Row should be visible if it exists
  ↓
If no row found OR role not in ('admin','super_admin'):
  → signOut(), setUser(null)
Else:
  → setUser(adminUser), admin privileges granted
```

**Critical observation:** AdminContext queries `user_roles` with `eq("user_id", auth.uid())`. If the row doesn't exist, query returns empty → admin access denied.

### 1.3 useApps Hook - Catalog Visibility
**File:** `src/hooks/useApps.ts`

```
fetchApps():
  supabase.from("apps").select("*").order("sort_order")
  ↓
RLS Policy "Users can view apps" applies:
  Condition: is_active = true OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
  ↓
- If user has admin/super_admin role → ALL rows returned
- If user is regular user → only is_active=true rows returned
```

**Note:** The `is_active` filter was **removed** from the client query (previously it had `.eq("is_active", true)`). The RLS policy handles filtering correctly. Removing the client filter was essential to allow RLS to grant admin bypass.

### 1.4 useUserAccess Hook - Purchase Verification
**File:** `src/hooks/useUserAccess.ts`

```
loadPurchaseData():
  - purchaseService.getUserPurchasedApps(user.id)
    → queries user_app_access table for owned apps
  - purchaseService.getUserAppAccessDetails(user.id)
  - Edge Function resolve-user-access (imported product mapping)
```

The `hasAccessToApp(appSlug)` function checks locally cached purchased app slugs. It does **not** consult RLS directly; instead it relies on `user_app_access` records.

### 1.5 UI Enforcement
**DashboardToolsSection.tsx** (lines 481-488):
```tsx
const isPurchased = user && hasAccessToApp(app.id);
if (!isPurchased) {
  e.preventDefault();
  setSelectedAppForPurchase(app);
  setPurchaseModalOpen(true);
}
```

**LockedAppOverlay.tsx** (referenced but not examined in depth): Appears over locked apps.

**Conclusion:** Access control is enforced at three levels:
1. **Database RLS**: apps visibility based on role
2. **API/Service**: user_app_access checks for launch permission
3. **UI**: Conditional rendering of purchase modal vs direct launch

All three must be satisfied for full admin functionality.

---

## 2. RLS Policy Audit

### 2.1 apps Table Policies
**Source:** Migration `20251028092317_fix_security_performance_issues.sql` (lines 472-508)

| Policy Name | Command | Condition |
|-------------|---------|-----------|
| Users can view apps | SELECT | `is_active = true OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('admin','super_admin'))` |
| Admins manage apps | ALL | `EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('admin','super_admin'))` |

**Columns referenced:** `is_active` (apps) — confirmed present in schema line 1079.

**Validity:** ✅ Correct. No reference to non-existent columns.

### 2.2 user_roles Table Policies
Same migration (lines 81-98):

| Policy Name | Command | Condition |
|-------------|---------|-----------|
| Users can read roles | SELECT | `user_id = (select auth.uid()) OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role = 'super_admin')` |
| Super admins manage roles | ALL | `EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role = 'super_admin')` |

**Important:** 
- Admin role (`role='admin'`) can read own record via first condition
- Only `super_admin` can read/update other users' roles
- Admin user should successfully read their own role in AdminContext

**Validity:** ✅ Correct.

### 2.3 Policy Application to Admin User
After admin role is assigned to `user_roles`:
- AdminContext's SELECT query matches `user_id = auth.uid()` → row visible → role fetched → admin session established.
- Apps query: `EXISTS` condition returns true → all apps (active + inactive) visible.

---

## 3. user_roles Table Schema Deep Dive

### 3.1 Original Definition (20251003150055)
```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
**Key:** `user_id` has **UNIQUE constraint** (single-column). One row per user system-wide.

### 3.2 Multitenant Columns Added Later
- `tenant_id` (ADDED via `20260226000001_add_tenant_id.sql`, made NOT NULL)
- `app_id` (ADDED via `20260323041225_multitenant_architecture.sql`, nullable)

Despite these additions, the UNIQUE constraint remains **only on `user_id`**. This design enforces a **single global role per user**, regardless of tenant or app context. The tenant_id is for information/audit, not for uniqueness.

### 3.3 Implication for `assign_admin_role.sql`
The `ON CONFLICT (user_id)` clause is VALID because `user_id` has a unique constraint. The statement:
```sql
INSERT INTO user_roles (user_id, role, tenant_id)
SELECT '12d69594-...', 'admin', id
FROM tenant
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```
Will:
1. Insert new row if no existing `user_roles` entry for that user_id
2. If row already exists, update role to 'admin' (preserving existing tenant_id unless we override it)

**The script is correct.** Previous failures likely stemmed from Supabase API schema cache staleness (PGRST204 errors) rather than SQL syntax.

---

## 4. GTM Information Schema Mapping

### 4.1 Apps Table GTM-Relevant Columns
| Column | Type | Purpose | Displayed In |
|--------|------|---------|--------------|
| `description` | text | Short app tagline | Dashboard, AppDetailPage, PurchaseModal |
| `long_description` | text | Detailed overview | *Not visibly used* |
| `benefits` | jsonb | Key value props | AppDetailPage (Overview tab) |
| `features` | jsonb | Feature list | AppDetailPage (Features tab) |
| `use_cases` | jsonb | Usage scenarios | *Not visibly used* |
| `testimonials` | jsonb | Social proof | AppDetailPage ( testimonials section ) |
| `faqs` | jsonb | Q&A | AppDetailPage (FAQ tab) |
| `price` | numeric | Purchase cost | PurchaseModal (displayed as $97 default if null) |
| `tags` | jsonb | Search keywords | Dashboard (displayed as badges) |
| `category` | text | Market segment | Dashboard, AppDetailPage |
| `image` / `demo_image` | text | Visual assets | Dashboard, AppDetailPage, PurchaseModal |
| `is_public` | boolean | Public discoverability | *RLS might reference* |
| `is_active` | boolean | Soft delete/visibility | RLS policy uses this |

### 4.2 GTM Field Coverage Assessment
- ✅ **Market Positioning:** `category`, `tags`, `description`, `long_description` (even if not all displayed, data exists)
- ✅ **Target Audience:** `use_cases` (captured but not displayed), `benefits`
- ✅ **Pricing Strategy:** `price` (exposed in PurchaseModal)
- ⚠️ **Timeline:** Not explicitly present (could be derived from `steps` or `features`)
- ⚠️ **Channels:** Not explicitly present (could be encoded in `tags` or `use_cases`)
- ✅ **Competitive Analysis:** Not stored (outside scope for app catalog)

**Missing display:** `long_description` and `use_cases` are stored but not rendered in current UI. This is a **UI enhancement opportunity**, not a blocker for admin access.

---

## 5. Complete Resolution Plan

### Step 1: Execute Admin Role Assignment
**Action:** Run `SUPABASE_ADMIN_FIX.sql` in Supabase SQL Editor.

**Why SQL Editor?** Bypasses any schema cache issues that Supabase CLI or API might have. Direct database execution is authoritative.

**Script actions:**
1. Ensures tenant `slug='videoremix'` exists (INSERT ... ON CONFLICT)
2. Inserts or updates `user_roles` for admin user with `role='admin'`
3. Verifies assignment with SELECT

**Expected output:**
```
INSERT 0 1  (or UPDATE if row existed)
         tenant_id
--------------------------
         xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
(1 row)

Admin user record should show:
   user_id                            | role  | tenant_id
-------------------------------------+-------+--------------------------------------
 12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd | admin | <tenant-uuid>
```

### Step 2: Validate RLS Policy Activation
Run `VERIFY_RLS_AND_ACCESS.sql` to confirm:
- RLS is ENABLED on `apps` and `user_roles`
- Policies exist with correct definitions
- Admin user record is present with role='admin'

### Step 3: Application-Level Verification
1. **Log in as admin** with the admin credentials (email associated with user ID `12d69594-...`)
2. **Observe AdminContext**: Should not sign out immediately. Check console for "AdminContext - Login successful" message.
3. **Navigate to Dashboard**: 
   - Should see ALL apps (including any with `is_active=false` if such exist)
   - Currently all 204 apps are active, so visual difference may be subtle unless an inactive app is artificially created for testing.
4. **Check GTM info**: Click any app → AppDetailPage should show description, benefits, features, testimonials, faqs, steps.
5. **Test access restrictions**:
   - For an app the admin does NOT own (no `user_app_access` record), clicking should open PurchaseModal.
   - Admin does NOT automatically have free access; admin role only grants catalog visibility, not free usage. (This is correct per requirements: "Only users with purchase transaction can LAUNCH/USE apps". Admins can see all but still need to purchase to use unless there's an exception.)
6. **Optional**: Create a test user with no purchases, verify they see only active apps and cannot launch locked apps.

### Step 4: Regular User Flow Validation
- Non-admin authenticated users should browse full catalog of active apps (all 204) with GTM details.
- Attempting to launch opens PurchaseModal.
- After purchase (creating `user_app_access` record), the app becomes launc hable.

---

## 6. Potential Schema Cache Issues & Workarounds

### Symptom
Supabase CLI or REST API returns `PGRST204: Could not find column` when executing SQL that references existing columns. This indicates the API's schema cache is stale.

### Cause
Supabase's PostgREST maintains an in-memory cache of the database schema. cache invalidates on schema-modifying statements but sometimes lags, especially after migrations applied outside the API (direct SQL).

### Workaround
**Execute SQL via Supabase SQL Editor (web UI)**. The SQL Editor connects directly to the database, bypassing PostgREST's cache layer. After running statements there, the API's cache eventually refreshes (usually within seconds to minutes). For immediate effect on API calls, you can also:
- Make any schema change (e.g., `ALTER TABLE ... RENAME TO ...` then rename back) to force cache invalidation
- Wait ~60 seconds for automatic cache refresh
- Restart the Supabase project (drastic)

**Our approach:** Use SQL Editor for the admin fix, then wait ~30 seconds before testing in app.

---

## 7. Code Review Findings

### 7.1 useApps.ts (Good)
- Removed `.eq("is_active", true)` filter ✅
- Graceful RLS error handling (returns empty array on permission denied) ✅
- LocalStorage caching with TTL ✅
- Potential improvement: Add query parameter `?select=*` to explicitly request all columns; currently fine.

### 7.2 AdminContext.tsx (Good)
- Robust error handling for missing role records
- Distinguishes between `admin` and `super_admin` roles (both accepted)
- Role check: `roleData.role !== "super_admin" && roleData.role !== "admin"` → comprehensive ✅

### 7.3 useUserAccess.ts (Good)
- Separates direct purchase access from imported product mapping
- Retry logic for resilience
- No issues identified.

### 7.4 DashboardToolsSection.tsx (Good)
- Shows OWNED / LOCKED badges clearly ✅
- Clicking locked app triggers PurchaseModal ✅
- Shows brief description; full GTM details are in AppDetailPage ✅

### 7.5 LockedAppOverlay.tsx
> Not examined in this session but previously reviewed. Should block app launch when `!hasAccessToApp`.

---

## 8. Edge Cases & Future Improvements

1. **Tenant-scoped roles:** Currently `user_roles.tenant_id` is NOT NULL but not used in RLS. Future multi-tenant features may need `tenant_id` in RLS policies. The current unique-on-user_id design prevents per-tenant roles. If that's required, the unique constraint would need to change to `(user_id, tenant_id)` — a breaking migration.

2. **Admin launch without purchase:** Requirements state only purchasing users can launch apps. Admins must also purchase unless explicit exception is desired. If admins should launch anything freely, modify:
   - `purchaseService.checkUserHasAccess` to return true for admins
   - Or add a separate RLS bypass on `user_app_access` for admins.

3. **Caching:** `useApps` caches in localStorage; if admin role is newly granted, cache may still reflect previous RLS-filtered results. The `refetch` function (clears cache) should be called after login or admin role assignment.

4. **Stale AdminContext:** After admin role is added, existing admin sessions may still have no role cached. User should sign out and sign back in to refresh JWT and role query.

5. **Missing GTM fields:** `long_description` and `use_cases` are stored but not displayed. Consider showing these in AppDetailPage's Overview tab for richer content.

---

## 9. Testing Checklist

### Pre-Fix Baseline
- [ ] Admin user cannot access `/dashboard` (gets redirected/signed out)
- [ ] `user_roles` table has zero rows for admin user ID
- [ ] useApps returns only active apps to admin (same as regular user)
- [ ] Console shows AdminContext role fetch errors

### Post-Fix Verification
- [ ] Run `SUPABASE_ADMIN_FIX.sql` → confirms 1 row inserted/updated
- [ ] Run `VERIFY_RLS_AND_ACCESS.sql` → shows RLS enabled, policies exist, admin role record present
- [ ] Admin signs in → stays signed in, AdminContext loads
- [ ] Admin visits Dashboard → sees all apps (count = total apps count)
- [ ] Admin clicks locked app → PurchaseModal appears
- [ ] Regular user signs in → sees only active apps
- [ ] Regular user cannot launch unowned apps → PurchaseModal appears
- [ ] After purchase (test transaction), app launches successfully

### GTM Audit
- [ ] All GTM fields present in `apps` table: `description`, `long_description`, `benefits`, `features`, `use_cases`, `testimonials`, `faqs`, `price`, `tags`, `category`
- [ ] Dashboard cards show: name, short description, image, category, OWNED/LOCKED badge
- [ ] AppDetailPage shows: description, benefits, features, steps, testimonials, FAQs
- [ ] PurchaseModal shows: name, description, price, features list

---

## 10. References

**Key Files:**
- `supabase_schema.sql` – Full database schema
- `assign_admin_role.sql` – Original admin role assignment script
- `SUPABASE_ADMIN_FIX.sql` – New robust admin fix (created)
- `VERIFY_RLS_AND_ACCESS.sql` – Verification script (created)
- `src/context/AdminContext.tsx` – Admin auth state
- `src/hooks/useApps.ts` – App catalog fetching
- `src/hooks/useUserAccess.ts` – Purchase access checking
- `src/components/dashboard/DashboardToolsSection.tsx` – App grid UI
- `src/components/AppDetailPage.tsx` – App details with GTM info
- `src/components/PurchaseModal.tsx` – Purchase prompt
- Migration: `20251028092317_fix_security_performance_issues.sql` – RLS policies

**Database Objects:**
- Table: `public.user_roles` (unique on user_id)
- Table: `public.apps` (contains all GTM columns)
- Policy: `Users can view apps` on apps
- Policy: `Users can read roles` on user_roles
- Function: `is_super_admin()` (SECURITY DEFINER)

**User ID:** `12d69594-82f1-4fff-ad9b-8d7ff2bfc7fd`

---

## Appendix: SQL Scripts

### SUPABASE_ADMIN_FIX.sql
See separate file: `SUPABASE_ADMIN_FIX.sql`

### VERIFY_RLS_AND_ACCESS.sql
See separate file: `VERIFY_RLS_AND_ACCESS.sql`

---

**Status:** Ready for execution. After applying the fix and verifying, update todos accordingly.
