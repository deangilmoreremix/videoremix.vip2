# Change Password Functionality Design

## Overview
Implement password change functionality that allows users to update their passwords without requiring login or email verification. Users only need to provide their email address (if it exists in the database) to change their password.

## Problem Statement
Current password reset requires email verification and navigation through complex flows. Users want a simpler way to change passwords without authentication barriers.

## Solution
- Modify the ResetPassword page to allow password changes by email alone
- Remove authentication requirements
- Create a new edge function to handle password updates using admin privileges
- Update UI to reflect the new purpose

## User Experience

### ProfilePage Changes
- Add "Change Password" link next to the email field in the Profile Information section
- Link navigates to `/reset-password` route

### Change Password Page (ResetPassword) Updates
- Remove authentication requirement
- Add email input field as the first step
- Update page title and headings to "Change Password"
- Modify instructional text to focus on direct password changes
- Keep form validation (8+ characters, password confirmation)
- Update success messaging

## Technical Implementation

### Files to Create/Modify
1. `src/pages/ProfilePage.tsx` - Add change password link
2. `src/pages/ResetPassword.tsx` - Complete redesign for email-based password changes
3. `supabase/functions/change-user-password/index.ts` - New edge function for password updates

### New Dependencies
- Edge function using Supabase admin client
- Modified authentication flow

## Security Considerations
⚠️ **CRITICAL SECURITY NOTICE**: This implementation allows password changes with only email verification. Anyone knowing a user's email can change their password. This is a significant security risk and should only be used in controlled environments.

## Testing Requirements
- Verify users can change passwords by providing only email
- Confirm email validation (user exists in database)
- Test form validation works correctly
- Verify success/error messaging

## Success Criteria
- Users can change passwords without being logged in
- Only email address required (must exist in database)
- No email verification required
- Clear UI indicating the simplified process</content>
<parameter name="filePath">docs/superpowers/specs/2026-01-17-change-password-design.md