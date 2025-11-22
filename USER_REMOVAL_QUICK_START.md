# User Removal - Quick Start Guide

## 🚀 Quick Access

Choose your preferred method:

### Method 1: Using Scripts (Recommended)
```bash
# Single user removal
node remove-user-access.mjs user@example.com --revoke-only
node remove-user-access.mjs spammer@test.com --delete

# Bulk operations
node bulk-remove-users.mjs --dry-run --test-accounts
node bulk-remove-users.mjs --inactive-days 180 --revoke-only
node bulk-remove-users.mjs --no-purchases --delete
```

### Method 2: Using SQL (Supabase Dashboard)
```sql
-- Find user
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Revoke access
UPDATE user_app_access SET is_active = false WHERE user_id = 'USER_ID';

-- Delete user
DELETE FROM auth.users WHERE id = 'USER_ID';
```

### Method 3: Using Admin Dashboard
1. Go to `https://your-domain.com/admin`
2. Navigate to "Users Management"
3. Search for user
4. Click action button → Revoke/Delete

---

## 📚 Documentation Files

- **[REMOVE_UNAUTHORIZED_USERS_GUIDE.md](./REMOVE_UNAUTHORIZED_USERS_GUIDE.md)** - Complete detailed guide
- **[remove-users-queries.sql](./remove-users-queries.sql)** - All SQL queries
- **[remove-user-access.mjs](./remove-user-access.mjs)** - Single user script
- **[bulk-remove-users.mjs](./bulk-remove-users.mjs)** - Bulk operations script

---

## ⚠️ Important Safety Rules

1. **ALWAYS** backup database before deletions
2. **TEST** with `--dry-run` first
3. **VERIFY** you have the right user
4. **CANNOT** delete super admins
5. **WAIT** 10 seconds before bulk operations execute

---

## 🎯 Common Scenarios

### Scenario 1: Remove a Single Spammer
```bash
node remove-user-access.mjs spammer@email.com --delete
```

### Scenario 2: Clean Up Test Accounts
```bash
node bulk-remove-users.mjs --test-accounts --delete
```

### Scenario 3: Revoke Access for Inactive Users
```bash
node bulk-remove-users.mjs --inactive-days 365 --revoke-only
```

### Scenario 4: Remove Users Without Purchases
```bash
# Preview first
node bulk-remove-users.mjs --dry-run --no-purchases

# Then execute
node bulk-remove-users.mjs --no-purchases --delete
```

---

## 🔍 Quick Verification

After removing users, verify:

```sql
-- Check user is gone
SELECT * FROM auth.users WHERE email = 'user@example.com';
-- Should return 0 rows

-- Check active users count
SELECT COUNT(DISTINCT user_id) FROM user_app_access
WHERE is_active = true;
```

---

## 💡 Tips

1. Use `--dry-run` to preview changes
2. Start with `--revoke-only` if unsure
3. Use `--delete` only when certain
4. Check purchase history before deleting
5. Export user list before bulk operations

---

## 🆘 Need Help?

1. Read the [complete guide](./REMOVE_UNAUTHORIZED_USERS_GUIDE.md)
2. Check the [SQL queries file](./remove-users-queries.sql)
3. Use `--help` flag on scripts:
   ```bash
   node remove-user-access.mjs --help
   node bulk-remove-users.mjs --help
   ```

---

## 📝 Examples

### Example 1: Safe Removal (Recommended)
```bash
# Step 1: Preview
node remove-user-access.mjs user@test.com

# Step 2: Revoke access
node remove-user-access.mjs user@test.com --revoke-only

# Step 3: If needed, delete later
node remove-user-access.mjs user@test.com --delete
```

### Example 2: Bulk Test Account Cleanup
```bash
# Step 1: See what would be removed
node bulk-remove-users.mjs --dry-run --test-accounts

# Step 2: Revoke access first
node bulk-remove-users.mjs --test-accounts --revoke-only

# Step 3: Delete if confirmed
node bulk-remove-users.mjs --test-accounts --delete
```

### Example 3: SQL Quick Actions
```sql
-- Quick revoke for single user
UPDATE user_app_access
SET is_active = false, updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- Quick delete for single user
DELETE FROM auth.users WHERE email = 'user@example.com';
```

---

## 🎓 Best Practices

✅ **DO:**
- Backup before bulk operations
- Use dry-run mode first
- Start with revoke-only
- Verify user details before deletion
- Document reasons for removal

❌ **DON'T:**
- Delete super admins
- Skip verification steps
- Delete users with active subscriptions without refunding
- Run bulk deletes without dry-run
- Delete paying customers by mistake

---

## 🔐 Access Required

To use these tools, you need:
- **Scripts**: Service role key in `.env` file
- **SQL**: Supabase dashboard access
- **Admin Dashboard**: Super admin login credentials

---

**Last Updated:** 2025-01-21
**Version:** 1.0

For detailed instructions, see [REMOVE_UNAUTHORIZED_USERS_GUIDE.md](./REMOVE_UNAUTHORIZED_USERS_GUIDE.md)
