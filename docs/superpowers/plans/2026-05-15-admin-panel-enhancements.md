# Admin Panel Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the admin panel with additional features for user management, reporting, and analytics.

**Architecture:** Extend the existing AdminUsersManagement component with new features using the existing patterns for data fetching, state management, and UI components.

**Tech Stack:** React, TypeScript, Tailwind CSS, Radix UI, Supabase, React Query (if available), Recharts (for charts)

---

## Current State Analysis

The admin panel already has:
- ✅ User management (create, delete, toggle status)
- ✅ App access management (individual app toggles)
- ✅ Bundle-level access management (12 bundles, 116 apps)
- ✅ Bulk operations (batch of 50 users)
- ✅ Search and filtering
- ✅ super_admin restriction
- ✅ Export Users to CSV (already implemented)
- ✅ User Activity Timeline (login_count field, already implemented)
- ✅ Bundle Analytics Dashboard (implemented 2026-05-15)

## Proposed Enhancements

### Enhancement 1: Export Users to CSV ✅ COMPLETED

Already implemented in the codebase.

### Enhancement 2: User Activity Timeline ✅ COMPLETED

Already implemented in the codebase (login_count field exists).

### Enhancement 3: Bundle Usage Analytics ✅ COMPLETED

**Files:**
- Modify: `src/components/admin/AdminUsersManagement.tsx`
- Test: Manual testing

- [x] **Step 1: Add analytics section**

Show bundle usage statistics:
```typescript
// Add state for bundle analytics
const [bundleAnalytics, setBundleAnalytics] = useState<Record<string, { granted: number, total: number, rate: number }>>({});

// Calculate analytics when component loads
useEffect(() => {
  const calculateBundleAnalytics = () => {
    const analytics: Record<string, { granted: number, total: number, rate: number }> = {};
    bundles.forEach(bundle => {
      const granted = users.filter(u => 
        bundle.apps.every(app => u.app_access?.includes(app))
      ).length;
      const total = users.length;
      analytics[bundle.id] = {
        granted,
        total,
        rate: total > 0 ? Math.round((granted / total) * 100) : 0
      };
    });
    setBundleAnalytics(analytics);
  };
  calculateBundleAnalytics();
}, [users, bundles]);
```

- [x] **Step 2: Display analytics in UI**

Add a "Analytics" section showing bundle adoption rates.

### Enhancement 4: Audit Log for Access Changes

**Files:**
- Modify: `supabase/functions/admin-users/index.ts`
- Modify: `src/components/admin/AdminUsersManagement.tsx`
- Test: Manual testing

- [ ] **Step 1: Add audit log table**

Create migration for audit_log table:
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  admin_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

- [ ] **Step 2: Log access changes**

Log every app/bundle access grant/revoke:
```typescript
// In admin-users Edge Function
const logAudit = async (action: string, resourceType: string, resourceId: string, details: any) => {
  await supabase.from('audit_log').insert({
    user_id: userId,
    admin_id: adminUserId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    details
  });
};
```

- [ ] **Step 3: Display audit log**

Add audit log modal accessible from user detail view.

### Enhancement 5: Role-Based Access Control (RBAC) Management

**Files:**
- Create: `src/components/admin/AdminRolesManagement.tsx`
- Modify: `src/components/admin/AdminUsersManagement.tsx`
- Test: Manual testing

- [ ] **Step 1: Create roles management component**

Build a dedicated roles management page with:
- List of roles (user, admin, super_admin)
- Permissions matrix per role
- Assign/remove roles from users

- [ ] **Step 2: Add navigation link**

Add link to roles management in admin sidebar.

## Testing Strategy

For each enhancement:
1. Manual testing in browser
2. Verify TypeScript compilation
3. Verify build success
4. Test on staging environment

## Deployment

Each enhancement should be:
1. Implemented in a feature branch
2. Tested locally
3. PR created with review
4. Merged to main
5. Auto-deployed via Netlify