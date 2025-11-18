# VideoRemix.vip Landing Page

This repository contains the landing page for VideoRemix.vip, an AI-powered video creation and editing platform.

## Features

- Modern, responsive design built with React, TypeScript, and Tailwind CSS
- Framer Motion animations for smooth, engaging interactions
- Supabase backend for content management
- Edge Functions for serverless API functionality
- Personalization features for targeted content delivery

## Backend Services

### Supabase Tables

- `hero_content` - Hero section content (title, description, buttons, etc.)
- `benefits_features` - Benefits and features content
- `testimonials` - User testimonials
- `faqs` - Frequently asked questions
- `pricing_plans` - Pricing information
- `contact_submissions` - Contact form submissions
- `newsletter_subscribers` - Newsletter signups
- `video_metadata` - Processed video metadata
- `personalization_events` - Tracking for content personalization
- `audience_segments` - Define audience segments
- `content_variations` - Store personalized content variations
- `personalization_rules` - Rules for content personalization
- `ai_settings` - User settings for AI features
- `api_usage` - Track API usage

### Edge Functions

- `contact-form` - Handle contact form submissions
- `newsletter-signup` - Process newsletter signups
- `video-processor` - Generate video thumbnails and metadata
- `personalized-content` - Deliver user-specific content based on behavior and preferences

## Development

1. Clone this repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Connect to Supabase using the provided environment variables

## Deployment

This project can be deployed to any static hosting platform (Vercel, Netlify, etc.) with Supabase handling the backend functionality.