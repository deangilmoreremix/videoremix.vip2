# Personalization Module Integration Guide

This guide explains how to connect the new personalization module to the VideoRemix app.

## Netlify functions

The personalization flows are exposed via Netlify functions:
- `/.netlify/functions/personalization/scan-prospect`
- `/.netlify/functions/personalization/generate-personalization`
- `/.netlify/functions/personalization/save-results`

## Frontend integration

1. Import the shared client helpers from `personalization-module/shared-client/personalizerClient.ts`.
2. Call `scanProspect` with `username`, `appId`, and `mode`.
3. Use the returned scan data to call `generatePersonalization`.
4. Save outputs with `saveResults`.

## Worker setup

The Python worker is a separate service that runs Maigret and returns prospect profile data.
Set these environment variables for the worker:
- `PERSONALIZER_WORKER_KEY`

The Netlify functions use `PERSONALIZER_WORKER_URL` and `PERSONALIZER_WORKER_KEY` to connect to the worker.
