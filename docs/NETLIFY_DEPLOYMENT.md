# Netlify Deployment Guide

## Prerequisites
- Netlify account
- Project connected to GitHub
- Environment variables configured

## Environment Variables (Netlify Dashboard)
Set these in your Netlify site's environment variables:

```
VITE_SUPABASE_URL=https://bzxohkrxcwodllketcpz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key_here
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here
```

## Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18

## Domain Configuration
1. Go to Site settings > Domain management
2. Add custom domain (e.g., videoremix.vip)
3. Configure DNS records as instructed

## SSL Certificate
Netlify provides automatic HTTPS certificates for custom domains.

## Deployment Process
1. Push changes to main branch
2. Netlify automatically builds and deploys
3. Check deployment status in Netlify dashboard

## Troubleshooting
- Check build logs in Netlify dashboard
- Verify environment variables are set correctly
- Ensure all dependencies are listed in package.json
- Check that build command completes successfully locally