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
2. `src/pages/ForgotPasswordPage.tsx` - Redesigned for direct password changes (no email required)
3. `src/pages/ResetPassword.tsx` - Complete redesign for email-based password changes
4. `supabase/functions/change-user-password/index.ts` - New edge function for password updates

### New Dependencies
- Edge function using Supabase admin client
- Modified authentication flow

## User Experience

### ProfilePage Changes
- Add "Change Password" link next to the email field in the Profile Information section
- Link navigates to `/reset-password` route

### ForgotPasswordPage Changes (Main Password Change Page)
- Complete redesign from "forgot password" to "change password"
- Direct password change without email verification
- Email + New Password + Confirm Password fields
- Success message shows password changed immediately

### ResetPassword Page Changes
- Updated UI for consistency
- Email input field for password changes without login
- Maintains existing functionality for edge cases

## Security Considerations
⚠️ **CRITICAL SECURITY NOTICE**: This implementation allows password changes without any verification. Anyone knowing a user's email address can change their password. The system returns success messages even for non-existent emails to prevent enumeration attacks, but will actually update passwords for valid email addresses. This is an extremely high security risk and should only be used in controlled environments where this level of access is explicitly required.

## Testing Requirements
- Verify users can change passwords by providing only email
- Test form validation works correctly (8+ characters, password confirmation)
- Verify success messaging appears for all email inputs
- Confirm passwords are actually updated for existing users
- Test ForgotPasswordPage (/forgot-password) works as main change password page

## Success Criteria
- Users can change passwords without being logged in
- Only email address required (must exist in database)
- No email verification required
- Clear UI indicating the simplified process
- ForgotPasswordPage serves as the main password change interface</content>
<parameter name="filePath">docs/superpowers/specs/2026-01-17-change-password-design.md