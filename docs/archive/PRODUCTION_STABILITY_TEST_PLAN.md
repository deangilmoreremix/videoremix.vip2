# Production Stability Test Plan

This document provides manual test procedures for verifying frontend reliability under real-world conditions.

## Test Environment Setup

Before testing, ensure:
1. The app is running in production mode (`npm run build && npm run preview`)
2. Browser DevTools are open (Network tab)
3. You have test user credentials

---

## Test Categories

### 1. Network Failure Tests

#### 1.1 Offline Mode
**Setup:** Open DevTools Network tab → Select "Offline"

| Action | Expected Behavior |
|--------|-------------------|
| Navigate to dashboard | Loading spinner shows briefly, then error message appears with "Connection issue" |
| Click "Try Again" button | Retry attempt is made, error persists while offline |
| Go back online | Clicking "Try Again" succeeds, data loads |
| Submit a form | Button shows loading state, then error message appears |
| Auth-protected page | Network status indicator shows "You're offline" |

**Verification:**
- [ ] No white screen crashes
- [ ] User-friendly error messages (not raw errors)
- [ ] Retry buttons work correctly
- [ ] Network status indicator appears when offline

#### 1.2 Slow Network
**Setup:** DevTools Network → Select "Slow 3G"

| Action | Expected Behavior |
|--------|-------------------|
| Navigate to any page | Loading spinner/skeleton shows for the duration |
| Click a button | Button shows loading state, doesn't allow double-click |
| Load a list page | Skeleton placeholders appear while loading |
| Submit a form | Button disabled during submission, shows loading spinner |

**Verification:**
- [ ] Loading states are visible throughout
- [ ] No flickering or flashing content
- [ ] Buttons are disabled during operations
- [ ] No duplicate submissions possible

#### 1.3 Intermittent Connection
**Setup:** Use DevTools to toggle between online/offline rapidly

| Action | Expected Behavior |
|--------|-------------------|
| Load page while toggling | App handles gracefully, shows error or retry option |
| Submit form while toggling | Either succeeds or shows error with retry |
| Navigate during toggle | Protected routes handle auth state correctly |

**Verification:**
- [ ] No crashes or white screens
- [ ] App recovers when connection returns
- [ ] No corrupted UI state

---

### 2. Timeout Tests

#### 2.1 API Timeout
**Setup:** In DevTools, block specific API requests or use a proxy to delay responses

| Action | Expected Behavior |
|--------|-------------------|
| Request that times out (>30s) | Shows "Request timed out" message |
| Click retry after timeout | Request is retried with exponential backoff |
| Multiple timeouts in a row | Shows error after max retries (3) |

**Verification:**
- [ ] Timeout errors show user-friendly message
- [ ] Retry logic works with backoff
- [ ] App doesn't hang indefinitely

#### 2.2 Auth Token Expiry
**Setup:** Wait for session to expire or manually clear session

| Action | Expected Behavior |
|--------|-------------------|
| Make request with expired token | Shows "Your session has expired. Please sign in again." |
| Navigate to protected route | Redirects to sign-in page |
| Click sign-in link | Redirects to sign-in with return URL preserved |

**Verification:**
- [ ] Auth errors trigger re-authentication flow
- [ ] User is not stuck in error state
- [ ] Return URL is preserved

---

### 3. Double-Click Prevention Tests

#### 3.1 Form Submission
**Setup:** Any form (sign-in, sign-up, settings)

| Action | Expected Behavior |
|--------|-------------------|
| Rapidly double-click submit button | Only one submission occurs |
| Click button while loading | Button is disabled, no action taken |
| Click multiple times rapidly | First click triggers action, subsequent clicks ignored |

**Verification:**
- [ ] Buttons show loading state immediately
- [ ] Buttons are disabled during operation
- [ ] Only one network request is made
- [ ] No duplicate data created

#### 3.2 Action Buttons
**Setup:** Any action button (delete, save, update)

| Action | Expected Behavior |
|--------|-------------------|
| Double-click "Delete" button | Only one delete request |
| Double-click "Save" button | Only one save request |
| Click during processing | Button disabled, click ignored |

**Verification:**
- [ ] All mutation buttons prevent double-submission
- [ ] Loading state is visible
- [ ] No duplicate operations

---

### 4. Refresh During Request Tests

#### 4.1 Refresh During Form Submit
**Setup:** Start a form submission

| Action | Expected Behavior |
|--------|-------------------|
| Refresh during submission | Page reloads, no corrupted state |
| Navigate away during submission | Navigation succeeds, no errors |
| Return to form page | Form is in initial state |

**Verification:**
- [ ] No corrupted data after refresh
- [ ] No error messages about "cancelled requests"
- [ ] Form resets to initial state

#### 4.2 Refresh During Data Fetch
**Setup:** Navigate to a page that loads data

| Action | Expected Behavior |
|--------|-------------------|
| Refresh during data load | Page reloads, shows loading, then data |
| Navigate away during load | No errors, navigation succeeds |
| Use browser back button | Page loads fresh data |

**Verification:**
- [ ] No stale data displayed
- [ ] No error messages about cancelled requests
- [ ] Data loads correctly after navigation

---

### 5. Error State Tests

#### 5.1 Server Error (500)
**Setup:** Force a server error (modify request or use mock)

| Action | Expected Behavior |
|--------|-------------------|
| Trigger 500 error | Shows "Server error. Please try again later." |
| Click retry | Request is retried |
| Multiple retries fail | Shows error with retry button still available |

**Verification:**
- [ ] User-friendly error message
- [ ] Retry option is available
- [ ] No raw error codes shown to user

#### 5.2 Permission Error (403)
**Setup:** Try to access resource without permission

| Action | Expected Behavior |
|--------|-------------------|
| Access forbidden resource | Shows "You do not have access to this resource." |
| No retry option | Retry button not shown (not retryable) |
| Navigate away | Error clears, new page loads |

**Verification:**
- [ ] Permission errors show correct message
- [ ] No retry for permission errors
- [ ] User can navigate away

#### 5.3 Not Found Error (404)
**Setup:** Request non-existent resource

| Action | Expected Behavior |
|--------|-------------------|
| Request missing data | Shows "The requested resource was not found." |
| Navigate to invalid URL | Shows 404 page or empty state |
| Use browser back | Returns to previous page correctly |

**Verification:**
- [ ] 404 errors handled gracefully
- [ ] User can navigate away
- [ ] No crashes

---

### 6. Empty State Tests

#### 6.1 Empty Data Lists
**Setup:** View a list with no items

| Action | Expected Behavior |
|--------|-------------------|
| View empty purchases list | Shows "No purchases yet" message |
| View empty videos list | Shows "No videos" message with upload option |
| View empty search results | Shows "No results found" message |

**Verification:**
- [ ] Empty states are clear and helpful
- [ ] Appropriate actions are offered (create, search again)
- [ ] No broken layouts

#### 6.2 Empty Dashboard
**Setup:** New user with no data

| Action | Expected Behavior |
|--------|-------------------|
| View dashboard as new user | Shows welcome message and getting started |
| View profile with no data | Shows default values or empty state |
| View analytics with no data | Shows "No data available" message |

**Verification:**
- [ ] Dashboard handles new users gracefully
- [ ] No broken charts or widgets
- [ ] Clear guidance for new users

---

### 7. Global Error Boundary Tests

#### 7.1 Component Crash
**Setup:** Trigger a component error (can use React DevTools)

| Action | Expected Behavior |
|--------|-------------------|
| Component throws error | Error boundary catches, shows error UI |
| Click "Try Again" | Error boundary resets, component re-renders |
| Click "Go to Home" | Navigates to home page |
| Click "Refresh Page" | Page reloads |

**Verification:**
- [ ] No white screen of death
- [ ] Error UI is user-friendly
- [ ] Recovery options work
- [ ] Error ID is shown for support

#### 7.2 Render Error
**Setup:** Cause a render error (undefined property access)

| Action | Expected Behavior |
|--------|-------------------|
| Render error occurs | Error boundary catches it |
| Error details in dev | Stack trace shown in development |
| No details in prod | Only error ID shown in production |

**Verification:**
- [ ] Error boundary catches all render errors
- [ ] Development mode shows details
- [ ] Production mode hides details

---

### 8. Rate Limiting Tests

#### 8.1 API Rate Limit
**Setup:** Trigger rate limiting (many rapid requests)

| Action | Expected Behavior |
|--------|-------------------|
| Hit rate limit | Shows "Too many requests. Please wait a moment." |
| Wait and retry | Request succeeds after cooldown |
| Auto-retry | Exponential backoff is applied |

**Verification:**
- [ ] Rate limit errors are handled
- [ ] User is informed to wait
- [ ] Auto-retry works correctly

---

### 9. Form Validation Tests

#### 9.1 Client-Side Validation
**Setup:** Any form with validation

| Action | Expected Behavior |
|--------|-------------------|
| Submit empty required field | Shows "This field is required" |
| Enter invalid email | Shows "Invalid email address" |
| Submit with errors | Form doesn't submit, errors highlighted |

**Verification:**
- [ ] Validation errors are clear
- [ ] Form doesn't submit with errors
- [ ] Errors clear when corrected

#### 9.2 Server-Side Validation
**Setup:** Submit data that fails server validation

| Action | Expected Behavior |
|--------|-------------------|
| Submit invalid data | Shows "Invalid data provided" |
| Specific field error | Error message indicates which field |
| Correct and resubmit | Submission succeeds |

**Verification:**
- [ ] Server validation errors are shown
- [ ] User can correct and resubmit
- [ ] No duplicate submissions

---

### 10. Browser Compatibility Tests

#### 10.1 Safari (macOS/iOS)
| Test | Expected | Result |
|------|----------|--------|
| All above tests | Same behavior as Chrome | ☐ |
| Session persistence | Works across tabs | ☐ |
| Back button | Works correctly | ☐ |

#### 10.2 Firefox
| Test | Expected | Result |
|------|----------|--------|
| All above tests | Same behavior as Chrome | ☐ |
| Session persistence | Works across tabs | ☐ |

#### 10.3 Edge
| Test | Expected | Result |
|------|----------|--------|
| All above tests | Same behavior as Chrome | ☐ |

---

## Test Results Template

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Network Failure | 10 | | | |
| Timeout | 5 | | | |
| Double-Click | 6 | | | |
| Refresh During Request | 6 | | | |
| Error States | 9 | | | |
| Empty States | 6 | | | |
| Error Boundary | 5 | | | |
| Rate Limiting | 3 | | | |
| Form Validation | 6 | | | |
| Browser Compatibility | 7 | | | |
| **Total** | **63** | | | |

---

## Automated Test Commands

### Simulate Slow Network
```javascript
// In browser console
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (connection) {
  console.log('Current connection:', connection.effectiveType);
}
```

### Simulate Offline
```javascript
// In browser console
window.dispatchEvent(new Event('offline'));
// To restore
window.dispatchEvent(new Event('online'));
```

### Check Loading States
```javascript
// In browser console - check for loading indicators
document.querySelectorAll('[class*="loading"], [class*="spinner"]').forEach(el => {
  console.log('Loading element:', el);
});
```

### Test Error Boundary
```javascript
// In browser console - trigger error
throw new Error('Test error boundary');
```

---

## Reporting Issues

When reporting stability issues, include:

1. **Browser and version**
2. **Network condition** (online, offline, slow 3G, etc.)
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Console errors** (screenshot)
7. **Network tab** (screenshot of failed requests)
8. **Error ID** (if shown)

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All network failure tests pass
- [ ] All timeout tests pass
- [ ] Double-click prevention works on all forms
- [ ] Refresh during request doesn't corrupt state
- [ ] All error states show user-friendly messages
- [ ] All empty states are implemented
- [ ] Error boundary catches all crashes
- [ ] Rate limiting is handled
- [ ] Form validation works correctly
- [ ] Tested on Safari, Firefox, Edge
- [ ] No console errors in normal usage
- [ ] Loading states show for all async operations
