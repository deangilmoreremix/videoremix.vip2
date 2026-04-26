# Vercel Deployment Guide

## Prerequisites
- Vercel account
- Project connected to GitHub
- Environment variables configured

## Environment Variables (Vercel Dashboard)
Set these in your Vercel project's environment variables:

```
VITE_SUPABASE_URL=https://bzxohkrxcwodllketcpz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_key_here
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id_here
```

## Build Settings
- **Framework Preset**: Vite
- **Root Directory**: ./
- **Build Command**: npm run build
- **Output Directory**: dist
- **Node.js Version**: 18.x

## Domain Configuration
1. Go to Project Settings > Domains
2. Add custom domain (e.g., videoremix.vip)
3. Configure DNS records as instructed

## Deployment Process
1. Push changes to main branch
2. Vercel automatically builds and deploys
3. Check deployment status in Vercel dashboard

## Troubleshooting
- Check build logs in Vercel dashboard
- Verify environment variables are set correctly
- Ensure all dependencies are listed in package.json
- Check that build command completes successfully locally