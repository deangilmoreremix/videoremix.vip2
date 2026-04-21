# Authentication Reliability Testing Checklist

This document provides a comprehensive manual testing checklist for verifying authentication reliability in the VideoRemix application.

## Prerequisites

- Access to the deployed application
- Test user account credentials
- Multiple browser tabs/windows
- Browser DevTools (Application/Storage tab)
- Network throttling capability (Chrome DevTools)

---

## 1. Session Initialization Tests

### 1.1 Fresh Page Load
- [ ] **Test**: Open the application in a new browser session (incognito/private window)
- [ ] **Expected**: Loading state shows briefly, then redirects to landing/signin if not authenticated
- [ ] **Verify**: No flash of protected content before redirect

### 1.2 Authenticated Page Load
- [ ] **Test**: Sign in, then refresh the page
- [ ] **Expected**: Session persists, user remains logged in
- [ ] **Verify**: No redirect to signin page occurs

### 1.3 Protected Route Direct Access
- [ ] **Test**: While logged out, navigate directly to `/dashboard`
- [ ] **Expected**: Redirects to `/signin` with `from` state preserved
- [ ] **Verify**: After signing in, redirects back to `/dashboard`

---

## 2. Tab Switching Tests

### 2.1 Sign Out in Another Tab
- [ ] **Test**: 
  1. Open the app in two tabs
  2. Sign in on Tab 1
  3. Navigate to `/dashboard` on both tabs
  4. Sign out on Tab 2
  5. Switch to Tab 1 and interact
- [ ] **Expected**: Tab 1 detects session invalidation and redirects to signin
- [ ] **Verify**: No protected content accessible after sign out

### 2.2 Sign In in Another Tab
- [ ] **Test**:
  1. Open the app in two tabs (logged out)
  2. Sign in on Tab 1
  3. Switch to Tab 2 and refresh or interact
- [ ] **Expected**: Tab 2 recognizes the new session
- [ ] **Verify**: User can access protected routes on Tab 2

### 2.3 Session Expiry During Tab Inactivity
- [ ] **Test**:
  1. Sign in and navigate to `/dashboard`
  2. Open a different website in another tab
  3. Wait for session to approach expiry (or manually clear session)
  4. Return to the app tab
- [ ] **Expected**: Session is validated on tab focus
- [ ] **Verify**: If expired, user is redirected to signin; if valid, user remains logged in

---

## 3. Token Refresh Tests

### 3.1 Automatic Token Refresh
- [ ] **Test**: 
  1. Sign in and open DevTools Console
  2. Monitor for "[Auth] Session expiring soon, refreshing..." message
  3. Wait for session refresh (or trigger by approaching expiry)
- [ ] **Expected**: Session refreshes automatically before expiry
- [ ] **Verify**: User remains logged in without interruption

### 3.2 Manual Session Refresh
- [ ] **Test**:
  1. Sign in
  2. Open browser console
  3. Run: `window.location.reload()`
- [ ] **Expected**: Session persists after reload
- [ ] **Verify**: User remains on the same page

---

## 4. Network Connectivity Tests

### 4.1 Offline During Protected Route Access
- [ ] **Test**:
  1. Sign in and navigate to `/dashboard`
  2. Open DevTools Network tab
  3. Set network to "Offline"
  4. Refresh the page
- [ ] **Expected**: Appropriate error message shown
- [ ] **Verify**: When network returns, session is restored

### 4.2 Network Recovery
- [ ] **Test**:
  1. Sign in
  2. Go offline
  3. Wait 30 seconds
  4. Go back online
- [ ] **Expected**: Session refreshes automatically on reconnection
- [ ] **Verify**: Console shows "[Auth] Network back online, refreshing session..."

### 4.3 Slow Network
- [ ] **Test**:
  1. Set network throttling to "Slow 3G"
  2. Sign in
  3. Navigate between protected routes
- [ ] **Expected**: Loading states show appropriately
- [ ] **Verify**: No premature redirects or flicker

---

## 5. Deep Link Tests

### 5.1 Direct Protected Link
- [ ] **Test**: 
  1. While logged out, click a direct link to `/dashboard?tab=settings`
- [ ] **Expected**: Redirects to signin, preserves full URL
- [ ] **Verify**: After login, redirects to `/dashboard?tab=settings`

### 5.2 Magic Link Authentication
- [ ] **Test**:
  1. Request a magic link (passwordless sign in)
  2. Click the link in email
- [ ] **Expected**: Session established, redirected to intended destination
- [ ] **Verify**: User is authenticated and on correct page

### 5.3 Password Reset Link
- [ ] **Test**:
  1. Request password reset
  2. Click the link in email
- [ ] **Expected**: Redirected to password reset page with valid session
- [ ] **Verify**: Can set new password successfully

### 5.4 Email Verification Link
- [ ] **Test**:
  1. Create new account
  2. Click verification link in email
- [ ] **Expected**: Email confirmed, session established
- [ ] **Verify**: Redirected to dashboard or intended page

---

## 6. Session Expiry Tests

### 6.1 Expired Token on Load
- [ ] **Test**:
  1. Sign in
  2. Open DevTools Application > Local Storage
  3. Find and modify the session token to be expired
  4. Refresh the page
- [ ] **Expected**: App detects invalid session, redirects to signin
- [ ] **Verify**: No errors thrown, clean redirect

### 6.2 Session Expiry During Use
- [ ] **Test**:
  1. Sign in
  2. Wait for session to expire (or manually trigger)
  3. Try to perform an action
- [ ] **Expected**: User is prompted to re-authenticate
- [ ] **Verify**: No data loss or corruption

---

## 7. Redirect Loop Prevention Tests

### 7.1 Signin Page While Authenticated
- [ ] **Test**:
  1. Sign in
  2. Navigate directly to `/signin`
- [ ] **Expected**: Redirected to dashboard (already authenticated)
- [ ] **Verify**: No redirect loop occurs

### 7.2 Protected Route After Sign Out
- [ ] **Test**:
  1. Sign in
  2. Navigate to `/dashboard`
  3. Sign out
  4. Use browser back button
- [ ] **Expected**: Redirected to signin (not back to dashboard)
- [ ] **Verify**: No redirect loop

### 7.3 Multiple Rapid Navigations
- [ ] **Test**:
  1. Rapidly click between protected and public routes
  2. Include signin/signup pages in navigation
- [ ] **Expected**: App handles gracefully without loops
- [ ] **Verify**: Final state is correct based on auth status

---

## 8. Loading State Tests

### 8.1 No Content Flash
- [ ] **Test**:
  1. Sign out
  2. Clear browser cache
  3. Navigate to `/dashboard`
- [ ] **Expected**: Loading state shows until auth is resolved
- [ ] **Verify**: Never see protected content before redirect

### 8.2 Loading State Duration
- [ ] **Test**:
  1. Sign in
  2. Refresh page multiple times
- [ ] **Expected**: Loading state shows for minimum time (prevents flash)
- [ ] **Verify**: No flicker between loading and content

---

## 9. Error Handling Tests

### 9.1 Invalid Session Data
- [ ] **Test**:
  1. Sign in
  2. Corrupt session data in storage
  3. Refresh
- [ ] **Expected**: Error state shown with retry option
- [ ] **Verify**: Can recover by signing in again

### 9.2 Server Error During Auth
- [ ] **Test**:
  1. Block auth endpoints in DevTools
  2. Try to sign in
- [ ] **Expected**: Appropriate error message shown
- [ ] **Verify**: Can retry sign in

---

## 10. Cross-Browser Tests

### 10.1 Chrome
- [ ] All tests pass

### 10.2 Firefox
- [ ] All tests pass

### 10.3 Safari
- [ ] All tests pass (especially tab switching)

### 10.4 Edge
- [ ] All tests pass

---

## 11. Mobile Tests

### 11.1 iOS Safari
- [ ] Session persists across tab switches
- [ ] Deep links work correctly
- [ ] No redirect loops

### 11.2 Android Chrome
- [ ] Session persists across tab switches
- [ ] Deep links work correctly
- [ ] No redirect loops

---

## Test Results Template

| Test Category | Pass | Fail | Notes |
|---------------|------|------|-------|
| Session Initialization | ☐ | ☐ | |
| Tab Switching | ☐ | ☐ | |
| Token Refresh | ☐ | ☐ | |
| Network Connectivity | ☐ | ☐ | |
| Deep Links | ☐ | ☐ | |
| Session Expiry | ☐ | ☐ | |
| Redirect Loop Prevention | ☐ | ☐ | |
| Loading States | ☐ | ☐ | |
| Error Handling | ☐ | ☐ | |
| Cross-Browser | ☐ | ☐ | |
| Mobile | ☐ | ☐ | |

---

## Debug Console Commands

Useful commands for testing in browser console:

```javascript
// Check current auth state
console.log("Auth State:", window.__AUTH_STATE__);

// Force session refresh
window.__REFRESH_SESSION__?.();

// Check session storage
console.log("Session Hint:", sessionStorage.getItem("sb-session-state"));

// Clear session (simulate sign out in another tab)
sessionStorage.removeItem("sb-session-state");
localStorage.clear();
```

---

## Known Issues & Workarounds

### Issue 1: Safari ITP
Safari's Intelligent Tracking Prevention may clear localStorage after 7 days of inactivity.
**Workaround**: Users must re-authenticate after extended inactivity.

### Issue 2: Chrome Third-Party Cookies
If the app runs in an iframe, third-party cookie restrictions may affect sessions.
**Workaround**: Ensure app runs in top-level context or use storage-based sessions.

---

## Reporting Issues

When reporting authentication issues, include:

1. Browser and version
2. Steps to reproduce
3. Console logs (filter by "[Auth]")
4. Network tab screenshot
5. Application/Storage state
6. Expected vs actual behavior