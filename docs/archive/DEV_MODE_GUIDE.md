# Development Mode Admin Login Guide

## Quick Testing Access

A development mode has been added to the admin login for easy testing without needing to manage passwords.

## How to Use

### Step 1: Access the Admin Login Page

Navigate to: `/admin/login`

### Step 2: Look for the Dev Mode Button

When running in development mode (localhost or `npm run dev`), you'll see a yellow banner at the bottom of the login form with:

**"Development Mode - Quick login for testing"**

### Step 3: Click "Dev Login"

Simply click the **"Dev Login"** button to instantly access the admin dashboard without entering any credentials.

## What It Does

When you click "Dev Login", the system:
- Creates a temporary dev session in localStorage
- Bypasses all authentication checks
- Logs you in as `dev@videoremix.vip` with super_admin privileges
- Redirects you to the admin dashboard

## When It's Available

The dev mode button **only appears** when:
- Running `npm run dev` (development mode)
- OR accessing via `localhost`

The button will **NOT appear** in production builds or on deployed domains.

## Logging Out

Click the "Logout" button in the admin dashboard to clear the dev session and return to the login page.

## Security Note

This feature is strictly for development and testing purposes. It's automatically disabled in production builds and will not work on live domains. The dev token is only valid within the browser's localStorage and provides no actual backend authentication.

## Troubleshooting

If you need to reset your dev session:
1. Open browser DevTools (F12)
2. Go to Application/Storage → Local Storage
3. Delete the `admin_token` and `admin_user` keys
4. Refresh the page

## For Production Access

For the real admin account (`dean@videoremix.vip`):
- Use the password reset flow via the "Forgot Password" link
- Or contact the database administrator to reset the password using the Supabase dashboard
- Or use the `reset-admin-password` edge function
