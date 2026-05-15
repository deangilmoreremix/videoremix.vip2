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

## Proposed Enhancements

### Enhancement 1: Export Users to CSV

**Files:**
- Modify: `src/components/admin/AdminUsersManagement.tsx`
- Test: Manual testing

- [ ] **Step 1: Add export functionality**

Add a button to export users to CSV format:
```typescript
const exportUsersToCSV = () => {
  const headers = ['Email', 'Name', 'Role', 'Status', 'App Count', 'Created At'];
  const csvContent = [
    headers.join(','),
    ...users.map(user => [
      user.email,
      `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      user.role,
      user.is_active ? 'Active' : 'Inactive',
      user.app_count || 0,
      user.created_at
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

- [ ] **Step 2: Add export button to UI**

Add button next to "Bulk Upload" button in the header section.

### Enhancement 2: User Activity Timeline

**Files:**
- Modify: `src/components/admin/AdminUsersManagement.tsx`
- Test: Manual testing

- [ ] **Step 1: Add activity display**

Display user login history and activity in the user card:
```typescript
// Add to User interface
interface User {
  // ... existing fields
  last_login?: string;
  login_count?: number;
}

// Add to user card display
{user.last_login && (
  <span className="text-xs text-gray-500">
    Last login: {new Date(user.last_login).toLocaleDateString()}
  </span>
)}
```

- [ ] **Step 2: Fetch additional user data**

Extend the admin-users Edge Function to include login statistics.

### Enhancement 3: Bundle Usage Analytics

**Files:**
- Modify: `src/components/admin/AdminUsersManagement.tsx`
- Test: Manual testing

- [ ] **Step 1: Add analytics section**

Show bundle usage statistics:
```typescript
// Add state for bundle analytics
const [bundleAnalytics, setBundleAnalytics] = useState<Record<string, { granted: number, revoked: number }>>({});

// Fetch analytics when component loads
useEffect(() => {
  const fetchAnalytics = async () => {
    // Calculate from users data
    const analytics: Record<string, { granted: number, revoked: number }> = {};
    bundles.forEach(bundle => {
      const granted = users.filter(u => 
        bundle.apps.every(app => u.app_access?.includes(app))
      ).length;
      analytics[bundle.id] = { granted, revoked: 0 };
    });
    setBundleAnalytics(analytics);
  };
  fetchAnalytics();
}, [users, bundles]);
```

- [ ] **Step 2: Display analytics in UI**

Add a "Analytics" tab or section showing bundle adoption rates.

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