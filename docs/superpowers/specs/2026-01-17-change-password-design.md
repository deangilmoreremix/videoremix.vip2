# Change Password Functionality Design

## Overview
Implement a streamlined change password feature for logged-in users without requiring email verification. Leverage the existing ResetPassword page infrastructure while improving discoverability and user experience.

## Problem Statement
Users currently need to navigate to `/reset-password` (which is designed for email-based password resets) to change their password, but there's no clear way to access this functionality from their profile. The page messaging also focuses on "resetting" rather than "changing" passwords.

## Solution
- Add a "Change Password" link to the ProfilePage for easy access
- Rebrand the ResetPassword page to focus on password changes for logged-in users
- Maintain existing functionality since it already supports direct password updates

## User Experience

### ProfilePage Changes
- Add "Change Password" link next to the email field in the Profile Information section
- Link navigates to `/reset-password` route
- Clear, accessible placement following existing UI patterns

### Change Password Page (ResetPassword) Updates
- Update page title and headings from "Reset Password" to "Change Password"
- Modify instructional text to focus on password changes rather than resets
- Keep existing form validation (8+ characters, password confirmation)
- Maintain success messaging and redirect to dashboard

## Technical Implementation

### Files to Modify
1. `src/pages/ProfilePage.tsx` - Add change password link
2. `src/pages/ResetPassword.tsx` - Update UI text and branding

### No New Dependencies
- Uses existing Supabase auth functionality
- Leverages current form validation patterns
- Follows established UI component library usage

## Security Considerations
- Maintains existing session validation (redirects to signin if not authenticated)
- Uses Supabase's `updateUser({ password })` which handles server-side validation
- No reduction in security compared to current implementation

## Testing Requirements
- Verify logged-in users can access and use the change password functionality
- Confirm form validation works correctly
- Test navigation flow from ProfilePage to change password page
- Verify success redirect to dashboard

## Success Criteria
- Users can easily find and access password change functionality from their profile
- Password changes work without email verification for logged-in users
- UI clearly communicates the purpose (changing vs resetting passwords)
- No breaking changes to existing forgot password flow</content>
<parameter name="filePath">docs/superpowers/specs/2026-01-17-change-password-design.md