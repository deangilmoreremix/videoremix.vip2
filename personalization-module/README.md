# Universal Personalization Module

This module provides a personalization engine for VideoRemix VIP apps.
It connects a frontend personalization widget and Netlify serverless functions to a Python Maigret worker, with Supabase persistence for scan and content results.

## Structure

- `frontend-widget/` — React widget and UI components
- `shared-client/` — shared request and response types plus client helpers
- `netlify/functions/personalization/` — Netlify function endpoints
- `python-worker/` — Maigret worker service for OSINT profile scanning
- `supabase/` — database schema and security policies
- `prompts/` — personalization prompt templates
- `docs/` — integration and usage docs

## Goals

1. Scan a username with Maigret
2. Generate personalized scripts, storyboards, emails, or proposals
3. Save scan metadata and generated outputs to Supabase
4. Expose the flow through Netlify functions

## Getting started

1. Configure environment variables:
   - `PERSONALIZER_WORKER_URL`
   - `PERSONALIZER_WORKER_KEY`
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Deploy the Python worker separately on Render or another Python host.
3. Use the Netlify functions in `netlify/functions/personalization/` via `/.netlify/functions/personalization/<name>`.
