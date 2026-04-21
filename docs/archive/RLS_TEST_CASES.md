# Row Level Security Test Cases

This document provides comprehensive test cases for verifying RLS policies work correctly.

## Test Setup

Before running tests, ensure you have:
1. Three test users: `user_a`, `user_b`, `admin_user`
2. The admin user should have `super_admin` role in `user_roles` table
3. Each test case includes the expected result

## Test Categories

### 1. User-Owned Data Tests

#### 1.1 Purchases Table

**Test: User can only read their own purchases**

```sql
-- Setup: Create purchases for both users
INSERT INTO purchases (user_id, email, platform, platform_transaction_id, product_name, amount, status)
VALUES 
  ('user_a_uuid', 'user_a@test.com', 'stripe', 'txn_a_001', 'Product A', 99.00, 'completed'),
  ('user_b_uuid', 'user_b@test.com', 'stripe', 'txn_b_001', 'Product B', 149.00, 'completed');

-- Test as user_a (should only see own purchase)
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
SELECT * FROM purchases;
-- Expected: 1 row (user_a's purchase only)

-- Test as user_b (should only see own purchase)
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_b_uuid"}';
SELECT * FROM purchases;
-- Expected: 1 row (user_b's purchase only)

-- Test as admin (should see all)
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin_user_uuid"}';
SELECT * FROM purchases;
-- Expected: 2 rows (all purchases)
```

**Test: User cannot insert purchases directly**

```sql
-- Test as regular user
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
INSERT INTO purchases (user_id, email, platform, platform_transaction_id, product_name, amount, status)
VALUES ('user_a_uuid', 'user_a@test.com', 'stripe', 'txn_fake', 'Fake', 0, 'completed');
-- Expected: ERROR - new row violates row-level security policy
```

**Test: User cannot update purchases**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
UPDATE purchases SET amount = 0 WHERE user_id = 'user_a_uuid';
-- Expected: ERROR - no policies apply to UPDATE for authenticated role
```

**Test: User cannot delete purchases**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
DELETE FROM purchases WHERE user_id = 'user_a_uuid';
-- Expected: ERROR - no policies apply to DELETE for authenticated role
```

#### 1.2 User App Access Table

**Test: User can only read their own access**

```sql
-- Setup
INSERT INTO user_app_access (user_id, app_slug, access_type, is_active)
VALUES 
  ('user_a_uuid', 'video-remix', 'lifetime', true),
  ('user_b_uuid', 'ai-editor', 'lifetime', true);

-- Test as user_a
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
SELECT * FROM user_app_access;
-- Expected: 1 row (user_a's access only)

-- Test as user_b
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_b_uuid"}';
SELECT * FROM user_app_access;
-- Expected: 1 row (user_b's access only)
```

**Test: User cannot grant themselves access**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
INSERT INTO user_app_access (user_id, app_slug, access_type, is_active)
VALUES ('user_a_uuid', 'premium-app', 'lifetime', true);
-- Expected: ERROR - new row violates row-level security policy
```

**Test: User cannot modify their own access**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
UPDATE user_app_access SET is_active = false WHERE user_id = 'user_a_uuid';
-- Expected: ERROR - no policies apply to UPDATE
```

#### 1.3 Videos Table

**Test: User can only see their own videos and public videos**

```sql
-- Setup
INSERT INTO videos (user_id, title, is_public, status)
VALUES 
  ('user_a_uuid', 'User A Private Video', false, 'completed'),
  ('user_a_uuid', 'User A Public Video', true, 'completed'),
  ('user_b_uuid', 'User B Private Video', false, 'completed'),
  ('user_b_uuid', 'User B Public Video', true, 'completed');

-- Test as user_a
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
SELECT title, is_public FROM videos;
-- Expected: 3 rows (user_a's 2 videos + user_b's public video)

-- Test as anonymous
SET ROLE anon;
SELECT title, is_public FROM videos;
-- Expected: 2 rows (only public videos)
```

**Test: User cannot change video ownership**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
-- First create a video
INSERT INTO videos (user_id, title, is_public, status) 
VALUES ('user_a_uuid', 'Test Video', false, 'completed');

-- Try to change ownership
UPDATE videos SET user_id = 'user_b_uuid' WHERE user_id = 'user_a_uuid';
-- Expected: ERROR - Cannot modify ownership field (user_id)
```

### 2. IDOR Prevention Tests

#### 2.1 Guessing Purchase IDs

**Test: User cannot access purchase by guessing ID**

```sql
-- Get a purchase ID from another user
SELECT id FROM purchases WHERE user_id = 'user_b_uuid';
-- Let's say it returns: 'some-uuid-1234'

-- Try to access as user_a
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
SELECT * FROM purchases WHERE id = 'some-uuid-1234';
-- Expected: 0 rows (policy filters out other user's data)
```

#### 2.2 Using Public IDs

**Test: Public IDs can be safely used in URLs**

```sql
-- Purchases have public_id for URL use
SELECT public_id FROM purchases WHERE user_id = 'user_a_uuid';
-- Returns: 'public-uuid-5678'

-- User can access their own purchase via public_id
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
SELECT * FROM purchases WHERE public_id = 'public-uuid-5678';
-- Expected: 1 row

-- Other user cannot access via public_id
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_b_uuid"}';
SELECT * FROM purchases WHERE public_id = 'public-uuid-5678';
-- Expected: 0 rows
```

### 3. Admin Access Tests

#### 3.1 Admin Can Read All

**Test: Admin can read all purchases**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin_user_uuid"}';
SELECT COUNT(*) FROM purchases;
-- Expected: All purchases in table
```

**Test: Admin can read all user access**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin_user_uuid"}';
SELECT * FROM user_app_access;
-- Expected: All access records
```

#### 3.2 Admin Can Modify

**Test: Admin can grant access**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin_user_uuid"}';
INSERT INTO user_app_access (user_id, app_slug, access_type, is_active)
VALUES ('user_a_uuid', 'new-app', 'lifetime', true);
-- Expected: Success
```

**Test: Admin can revoke access**

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin_user_uuid"}';
DELETE FROM user_app_access WHERE user_id = 'user_a_uuid' AND app_slug = 'new-app';
-- Expected: Success
```

### 4. Public Content Tests

#### 4.1 Anonymous Access

**Test: Anonymous users can read public content**

```sql
SET ROLE anon;
SELECT * FROM apps WHERE status = 'approved' AND is_public = true;
-- Expected: All approved public apps

SELECT * FROM hero_content WHERE enabled = true;
-- Expected: All enabled hero content

SELECT * FROM pricing_plans WHERE enabled = true;
-- Expected: All enabled pricing plans
```

**Test: Anonymous users cannot modify content**

```sql
SET ROLE anon;
INSERT INTO hero_content (title, enabled) VALUES ('Hacked', true);
-- Expected: ERROR - relation "hero_content" does not exist or permission denied

UPDATE hero_content SET title = 'Hacked';
-- Expected: ERROR - permission denied
```

### 5. Service Role Tests

#### 5.1 Webhook Operations

**Test: Service role can insert purchases**

```sql
SET ROLE service_role;
INSERT INTO purchases (user_id, email, platform, platform_transaction_id, product_name, amount, status)
VALUES ('user_a_uuid', 'user_a@test.com', 'stripe', 'webhook_txn', 'Webhook Product', 199.00, 'completed');
-- Expected: Success
```

**Test: Service role can update purchases**

```sql
SET ROLE service_role;
UPDATE purchases SET status = 'refunded' WHERE platform_transaction_id = 'webhook_txn';
-- Expected: Success
```

**Test: Service role can insert webhook logs**

```sql
SET ROLE service_role;
INSERT INTO webhook_logs (platform, event_type, webhook_payload, processing_status)
VALUES ('stripe', 'payment_intent.succeeded', '{"test": true}', 'processed');
-- Expected: Success
```

### 6. Edge Cases

#### 6.1 Null User ID

**Test: Purchases with null user_id (guest purchases)**

```sql
-- Create a purchase without user_id
SET ROLE service_role;
INSERT INTO purchases (user_id, email, platform, platform_transaction_id, product_name, amount, status)
VALUES (NULL, 'guest@test.com', 'stripe', 'guest_txn', 'Guest Product', 99.00, 'completed');

-- Regular user cannot see guest purchases
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
SELECT * FROM purchases WHERE email = 'guest@test.com';
-- Expected: 0 rows

-- Admin can see guest purchases
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin_user_uuid"}';
SELECT * FROM purchases WHERE email = 'guest@test.com';
-- Expected: 1 row
```

#### 6.2 Deleted User

**Test: Accessing data of deleted user**

```sql
-- When a user is deleted, their purchases should have user_id set to NULL
-- (ON DELETE SET NULL on foreign key)

-- Other users should not see these purchases
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid"}';
SELECT * FROM purchases WHERE user_id IS NULL;
-- Expected: 0 rows (policy: user_id = current_user_id() filters these out)

-- Admin can still see them
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin_user_uuid"}';
SELECT * FROM purchases WHERE user_id IS NULL;
-- Expected: All orphaned purchases
```

#### 6.3 Role Change

**Test: User loses admin role**

```sql
-- Admin creates some data
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin_user_uuid"}';
INSERT INTO products_catalog (name, slug, product_type, is_active)
VALUES ('Test Product', 'test-product', 'one_time', true);

-- Admin role is removed
-- (This would be done by super_admin via user_roles table)

-- Former admin tries to access admin-only data
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "former_admin_uuid"}';
SELECT * FROM platform_product_mappings;
-- Expected: ERROR or 0 rows (policy: is_admin() returns false)
```

### 7. Performance Tests

#### 7.1 Index Usage

**Test: RLS policies use indexes efficiently**

```sql
-- Check that queries use indexes
EXPLAIN ANALYZE SELECT * FROM purchases WHERE user_id = 'user_a_uuid';
-- Expected: Index Scan using idx_purchases_user_id

EXPLAIN ANALYZE SELECT * FROM user_app_access WHERE user_id = 'user_a_uuid';
-- Expected: Index Scan using idx_user_app_access_user_id

EXPLAIN ANALYZE SELECT * FROM apps WHERE status = 'approved' AND is_public = true;
-- Expected: Index Scan using idx_apps_status_public
```

### 8. SQL Injection Prevention Tests

#### 8.1 Malicious Input

**Test: SQL injection in user_id**

```sql
-- This should be handled by parameterized queries, but RLS adds another layer
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "user_a_uuid'' OR ''1''=''1"}';
SELECT * FROM purchases;
-- Expected: 0 rows or error (invalid UUID format)
```

## Automated Test Script

```sql
-- Run this script to verify all RLS policies

DO $$
DECLARE
  test_result text;
  pass_count int := 0;
  fail_count int := 0;
BEGIN
  RAISE NOTICE 'Starting RLS Tests...';
  
  -- Test 1: Check RLS is enabled on all tables
  SELECT string_agg(tablename, ', ') INTO test_result
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = false;
  
  IF test_result IS NULL THEN
    RAISE NOTICE 'PASS: All tables have RLS enabled';
    pass_count := pass_count + 1;
  ELSE
    RAISE NOTICE 'FAIL: Tables without RLS: %', test_result;
    fail_count := fail_count + 1;
  END IF;
  
  -- Test 2: Check helper functions exist
  BEGIN
    PERFORM is_admin();
    RAISE NOTICE 'PASS: is_admin() function exists';
    pass_count := pass_count + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL: is_admin() function missing';
    fail_count := fail_count + 1;
  END;
  
  -- Test 3: Check indexes exist
  BEGIN
    PERFORM 1 FROM pg_indexes WHERE indexname = 'idx_purchases_user_id';
    IF FOUND THEN
      RAISE NOTICE 'PASS: idx_purchases_user_id exists';
      pass_count := pass_count + 1;
    ELSE
      RAISE NOTICE 'FAIL: idx_purchases_user_id missing';
      fail_count := fail_count + 1;
    END IF;
  END;
  
  RAISE NOTICE '===================================';
  RAISE NOTICE 'RLS Test Results: % passed, % failed', pass_count, fail_count;
END $$;
```

## Manual Testing Checklist

| Test Case | Expected Result | Actual Result | Status |
|-----------|-----------------|---------------|--------|
| User can read own purchases | 1 row | | ☐ |
| User cannot read others' purchases | 0 rows | | ☐ |
| User cannot insert purchases | Error | | ☐ |
| User cannot update purchases | Error | | ☐ |
| User cannot delete purchases | Error | | ☐ |
| User can read own access | 1 row | | ☐ |
| User cannot grant own access | Error | | ☐ |
| User cannot modify own access | Error | | ☐ |
| Admin can read all purchases | All rows | | ☐ |
| Admin can grant access | Success | | ☐ |
| Admin can revoke access | Success | | ☐ |
| Anonymous can read public apps | Public apps | | ☐ |
| Anonymous cannot modify content | Error | | ☐ |
| Service role can insert purchases | Success | | ☐ |
| IDOR prevention works | 0 rows | | ☐ |
| Ownership change blocked | Error | | ☐ |

## Reporting Issues

When reporting RLS issues, include:
1. The exact SQL query that failed or succeeded unexpectedly
2. The role used (authenticated, anon, service_role)
3. The user ID in the JWT claims
4. Expected vs actual behavior
5. Any error messages received
