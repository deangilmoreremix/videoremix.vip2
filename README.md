# VideoRemix - AI-Powered Video Tools Platform

A comprehensive platform for AI-powered video creation, editing, and personalization tools with admin management system.

**Production URL**: [https://videoremix.vip](https://videoremix.vip)

## Overview

VideoRemix is a multi-app platform that provides:
- 🎥 AI-powered video creation and editing tools
- 👥 User authentication and authorization with Supabase
- 🛒 Purchase management and app access control
- 🔧 Comprehensive admin dashboard
- 📊 CSV import system for bulk user management
- 💳 Subscription and lifetime purchase support
- 🌐 Multiple app deployments on subdomains

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Deployment**: Netlify with custom domain
- **Payments**: Stripe, PayPal, PayKickstart integration
- **AI**: OpenAI GPT + Google Gemini APIs

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account
- Netlify account (for deployment)

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/videoremix.git
cd videoremix
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required variables (see [ENVIRONMENT_VARIABLES_AUDIT.md](./ENVIRONMENT_VARIABLES_AUDIT.md)):
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Run migrations:**

Apply database migrations in Supabase SQL Editor (see `supabase/migrations/`)

5. **Start development server:**
```bash
npm run dev
```

Visit: http://localhost:5173

## Deployment

### GitHub + Netlify Integration

This project is configured for automatic deployment via Netlify when you push to GitHub.

**Step-by-step guides:**
- [GitHub Setup Guide](./GITHUB_SETUP_GUIDE.md) - Connect repository to GitHub
- [Netlify Custom Domain Guide](./NETLIFY_CUSTOM_DOMAIN_GUIDE.md) - Configure videoremix.vip domain

**Quick deployment:**
```bash
# Build for production
npm run build

# Deploy to Netlify (requires Netlify CLI)
npm run deploy
```

### Environment Variables

**Critical**: Environment variables must be set in Netlify for production builds.

See [ENVIRONMENT_VARIABLES_AUDIT.md](./ENVIRONMENT_VARIABLES_AUDIT.md) for complete audit and setup instructions.

## Project Structure

```
videoremix/
├── src/
│   ├── components/       # React components
│   │   ├── admin/       # Admin dashboard components
│   │   └── dashboard/   # User dashboard components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── context/         # React context providers
│   ├── services/        # API services
│   ├── config/          # Configuration files
│   └── utils/           # Utility functions
├── supabase/
│   ├── functions/       # Edge Functions
│   ├── migrations/      # Database migrations
│   └── email-templates/ # Email templates
├── public/              # Static assets
└── tests/               # Test files
```

## Key Features

### Admin Dashboard

Access at `/admin` with admin credentials.

Features:
- User management and role assignment
- Purchase and subscription tracking
- App access control
- CSV import for bulk operations
- Product-to-app mapping
- Analytics and reporting

See [ADMIN_QUICK_START.md](./ADMIN_QUICK_START.md) for setup instructions.

### CSV Import System

Import users and purchases from CSV files.

```bash
# Via admin dashboard (recommended)
1. Login at /admin
2. Go to CSV Import tab
3. Upload your CSV file
4. Map products to apps
5. Import completes automatically

# Via command line
node bulk-import-buyers.mjs path/to/buyers.csv
```

See [CSV_IMPORT_SYSTEM_GUIDE.md](./CSV_IMPORT_SYSTEM_GUIDE.md) for details.

### Multi-App Architecture

Apps are deployed on subdomains:
- ai-personalizedcontent.videoremix.vip
- ai-funnelcraft.videoremix.vip
- ai-skills.videoremix.vip
- (and 9 more...)

Access control managed via purchase records and app mappings.

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run tests
npm run test:ui          # Run tests with UI
npm run test:run         # Run tests once

# Linting
npm run lint             # Check code quality

# Deployment
npm run deploy           # Deploy to Netlify production
npm run deploy:preview   # Deploy preview
```

## Documentation

### Setup & Deployment
- [GitHub Setup Guide](./GITHUB_SETUP_GUIDE.md) - Connect to GitHub repository
- [Netlify Custom Domain Guide](./NETLIFY_CUSTOM_DOMAIN_GUIDE.md) - Configure custom domain
- [Environment Variables Audit](./ENVIRONMENT_VARIABLES_AUDIT.md) - Environment setup
- [Deploy Instructions](./DEPLOY_INSTRUCTIONS.md) - General deployment guide
- [Quick Deploy Guide](./QUICK_DEPLOY_GUIDE.md) - Fast deployment checklist

### Admin & Management
- [Admin Quick Start](./ADMIN_QUICK_START.md) - Admin setup
- [Admin Access Guide](./ADMIN_ACCESS_GUIDE.md) - Admin permissions
- [Bulk Import Guide](./BULK_IMPORT_GUIDE.md) - Import previous buyers
- [CSV Import System Guide](./CSV_IMPORT_SYSTEM_GUIDE.md) - CSV import details

### Features & Integration
- [Stripe Sync Guide](./STRIPE_SYNC_GUIDE.md) - Stripe integration
- [Email Setup Guide](./EMAIL_SETUP_GUIDE.md) - Email configuration
- [Adding More Apps Guide](./ADDING_MORE_APPS_GUIDE.md) - Add new apps

### Database
- [Supabase Migrations](./supabase/migrations/) - Database schema
- [Edge Functions](./supabase/functions/) - Serverless functions

## Security

- All environment variables with `VITE_` prefix are public (embedded in build)
- Service role keys are server-side only (Edge Functions)
- Row Level Security (RLS) enabled on all tables
- Admin access requires specific role in `user_roles` table
- HTTPS enforced via Netlify

See [ENVIRONMENT_VARIABLES_AUDIT.md](./ENVIRONMENT_VARIABLES_AUDIT.md) for security best practices.

## Support & Troubleshooting

### Common Issues

**Build fails:**
- Check environment variables are set in Netlify
- Run `npm run build` locally to verify
- Check build logs in Netlify dashboard

**Admin page blank:**
- Verify Supabase credentials in environment variables
- Trigger new deployment with cache clear
- See [NETLIFY_DEPLOYMENT_FIX.md](./NETLIFY_DEPLOYMENT_FIX.md)

**Custom domain not working:**
- Check DNS records are correct
- Wait 24-48 hours for DNS propagation
- See [NETLIFY_CUSTOM_DOMAIN_GUIDE.md](./NETLIFY_CUSTOM_DOMAIN_GUIDE.md)

### Getting Help

- Check documentation in project root
- Review error logs in Netlify dashboard
- Inspect browser console for client-side errors
- Check Supabase Edge Function logs

## Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm test`
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

## License

Proprietary - All rights reserved

## Links

- **Production**: https://videoremix.vip
- **Admin**: https://videoremix.vip/admin
- **GitHub**: https://github.com/YOUR_USERNAME/videoremix
- **Netlify**: https://app.netlify.com

---

**Last Updated**: October 31, 2025
