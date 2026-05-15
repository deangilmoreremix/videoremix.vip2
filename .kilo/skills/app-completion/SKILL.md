# App Data Completion Skill

## Purpose
Complete missing data fields for all 116 apps to ensure 100% production readiness.

## Context
- Total apps: 116 (101 standard + 15 premium)
- Premium apps: already have `price: 197` and `premium: true`
- Standard apps: need `price: 97` added
- All apps need: longDescription, benefits, features, steps, useCases, testimonials, faqs, tags

## Strategy
1. Generate realistic, contextual content for each app based on its name, description, and category
2. Use template-based generation for scalability
3. Ensure uniqueness and relevance per app
4. Verify no placeholder text like "TODO" or "coming soon"

## Implementation
Run completion script that:
1. Reads all app data from appsData.ts
2. Identifies missing fields per app
3. Generates appropriate content using templates and AI-like patterns
4. Writes back updated app objects
5. Validates completeness

## Commands
- `/complete-app-data` - Run the completion script
- `/verify-app-completeness` - Verify all apps are complete
- `/audit-apps` - Generate production readiness report
