/*
  # VideoRemix 95-App Catalog Slug Migration

  ## Overview
  This migration renames all app slugs in the Supabase `apps` table from
  the old technical identifiers to the new VideoRemix App IDs, and updates
  all cross-references in related tables.

  The frontend (src/data/appsData.ts) has been updated to use the new
  VideoRemix App IDs. This migration brings the database in sync.

  ## Changes
  1. Renames 100 old slugs to new VideoRemix slugs in `apps` table
  2. Updates `app_slug` references in:
     - user_app_access
     - ai_app_usage
     - app_usage_analytics
     - app_tenants
     - agent_executions, agent_schedules, agent_configurations
  3. Updates `apps_granted` JSONB array in products_catalog
  4. Adds 16 new apps that were missing from the database
  5. Removes 36 overflow/extra apps not in the 95-app catalog
  6. Handles 21 duplicate slug collisions by merging references

  ## Safety
  - Wrapped in a transaction (BEGIN/COMMIT)
  - Creates backup tables before destructive operations
  - Logs row counts at each step
  - ON CONFLICT clauses for idempotency

  Generated: 2026-06-03T10:18:44.000Z
*/

BEGIN;

-- =====================================================================
-- STEP 0: Create backup tables for safety
-- =====================================================================
CREATE TABLE IF NOT EXISTS _migration_backup_apps_20260603 AS
  SELECT * FROM apps;
CREATE TABLE IF NOT EXISTS _migration_backup_user_app_access_20260603 AS
  SELECT * FROM user_app_access;
CREATE TABLE IF NOT EXISTS _migration_backup_ai_app_usage_20260603 AS
  SELECT * FROM ai_app_usage;
CREATE TABLE IF NOT EXISTS _migration_backup_app_tenants_20260603 AS
  SELECT * FROM app_tenants;

-- =====================================================================
-- STEP 1: Handle duplicate slug collisions
-- =====================================================================
-- When multiple old slugs map to the same new slug, we need to merge
-- their references into one before renaming.


-- Merge 'ai-services-agency' into 'sales-assistant-app' (both map to 'ai-agency-builder-suite')
UPDATE user_app_access SET app_slug = 'sales-assistant-app' WHERE app_slug = 'ai-services-agency';
UPDATE ai_app_usage SET app_slug = 'sales-assistant-app' WHERE app_slug = 'ai-services-agency';
UPDATE app_usage_analytics SET app_slug = 'sales-assistant-app' WHERE app_slug = 'ai-services-agency';
UPDATE app_tenants SET app_slug = 'sales-assistant-app' WHERE app_slug = 'ai-services-agency';
UPDATE agent_executions SET app_slug = 'sales-assistant-app' WHERE app_slug = 'ai-services-agency';
UPDATE agent_schedules SET app_slug = 'sales-assistant-app' WHERE app_slug = 'ai-services-agency';
UPDATE agent_configurations SET app_slug = 'sales-assistant-app' WHERE app_slug = 'ai-services-agency';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-services-agency' THEN '"sales-assistant-app"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-services-agency';


-- Merge 'ai-audio-tour-agent' into '7-sessions' (both map to 'ai-audio-guide-creator')
UPDATE user_app_access SET app_slug = '7-sessions' WHERE app_slug = 'ai-audio-tour-agent';
UPDATE ai_app_usage SET app_slug = '7-sessions' WHERE app_slug = 'ai-audio-tour-agent';
UPDATE app_usage_analytics SET app_slug = '7-sessions' WHERE app_slug = 'ai-audio-tour-agent';
UPDATE app_tenants SET app_slug = '7-sessions' WHERE app_slug = 'ai-audio-tour-agent';
UPDATE agent_executions SET app_slug = '7-sessions' WHERE app_slug = 'ai-audio-tour-agent';
UPDATE agent_schedules SET app_slug = '7-sessions' WHERE app_slug = 'ai-audio-tour-agent';
UPDATE agent_configurations SET app_slug = '7-sessions' WHERE app_slug = 'ai-audio-tour-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-audio-tour-agent' THEN '"7-sessions"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-audio-tour-agent';


-- Merge 'multimodal-design-agent-team' into 'app' (both map to 'ai-design-studio')
UPDATE user_app_access SET app_slug = 'app' WHERE app_slug = 'multimodal-design-agent-team';
UPDATE ai_app_usage SET app_slug = 'app' WHERE app_slug = 'multimodal-design-agent-team';
UPDATE app_usage_analytics SET app_slug = 'app' WHERE app_slug = 'multimodal-design-agent-team';
UPDATE app_tenants SET app_slug = 'app' WHERE app_slug = 'multimodal-design-agent-team';
UPDATE agent_executions SET app_slug = 'app' WHERE app_slug = 'multimodal-design-agent-team';
UPDATE agent_schedules SET app_slug = 'app' WHERE app_slug = 'multimodal-design-agent-team';
UPDATE agent_configurations SET app_slug = 'app' WHERE app_slug = 'multimodal-design-agent-team';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'multimodal-design-agent-team' THEN '"app"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'multimodal-design-agent-team';


-- Merge 'ai-life-insurance-advisor-agent' into '9-1-sequential-agent' (both map to 'ai-intake-voice-agent')
UPDATE user_app_access SET app_slug = '9-1-sequential-agent' WHERE app_slug = 'ai-life-insurance-advisor-agent';
UPDATE ai_app_usage SET app_slug = '9-1-sequential-agent' WHERE app_slug = 'ai-life-insurance-advisor-agent';
UPDATE app_usage_analytics SET app_slug = '9-1-sequential-agent' WHERE app_slug = 'ai-life-insurance-advisor-agent';
UPDATE app_tenants SET app_slug = '9-1-sequential-agent' WHERE app_slug = 'ai-life-insurance-advisor-agent';
UPDATE agent_executions SET app_slug = '9-1-sequential-agent' WHERE app_slug = 'ai-life-insurance-advisor-agent';
UPDATE agent_schedules SET app_slug = '9-1-sequential-agent' WHERE app_slug = 'ai-life-insurance-advisor-agent';
UPDATE agent_configurations SET app_slug = '9-1-sequential-agent' WHERE app_slug = 'ai-life-insurance-advisor-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-life-insurance-advisor-agent' THEN '"9-1-sequential-agent"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-life-insurance-advisor-agent';


-- Merge 'ai-music-generator-agent' into '5-1-in-memory-conversation-agent' (both map to 'ai-music-jingle-assistant')
UPDATE user_app_access SET app_slug = '5-1-in-memory-conversation-agent' WHERE app_slug = 'ai-music-generator-agent';
UPDATE ai_app_usage SET app_slug = '5-1-in-memory-conversation-agent' WHERE app_slug = 'ai-music-generator-agent';
UPDATE app_usage_analytics SET app_slug = '5-1-in-memory-conversation-agent' WHERE app_slug = 'ai-music-generator-agent';
UPDATE app_tenants SET app_slug = '5-1-in-memory-conversation-agent' WHERE app_slug = 'ai-music-generator-agent';
UPDATE agent_executions SET app_slug = '5-1-in-memory-conversation-agent' WHERE app_slug = 'ai-music-generator-agent';
UPDATE agent_schedules SET app_slug = '5-1-in-memory-conversation-agent' WHERE app_slug = 'ai-music-generator-agent';
UPDATE agent_configurations SET app_slug = '5-1-in-memory-conversation-agent' WHERE app_slug = 'ai-music-generator-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-music-generator-agent' THEN '"5-1-in-memory-conversation-agent"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-music-generator-agent';


-- Merge 'ai-journalist-agent' into '1-starter-agent' (both map to 'ai-news-content-writer')
UPDATE user_app_access SET app_slug = '1-starter-agent' WHERE app_slug = 'ai-journalist-agent';
UPDATE ai_app_usage SET app_slug = '1-starter-agent' WHERE app_slug = 'ai-journalist-agent';
UPDATE app_usage_analytics SET app_slug = '1-starter-agent' WHERE app_slug = 'ai-journalist-agent';
UPDATE app_tenants SET app_slug = '1-starter-agent' WHERE app_slug = 'ai-journalist-agent';
UPDATE agent_executions SET app_slug = '1-starter-agent' WHERE app_slug = 'ai-journalist-agent';
UPDATE agent_schedules SET app_slug = '1-starter-agent' WHERE app_slug = 'ai-journalist-agent';
UPDATE agent_configurations SET app_slug = '1-starter-agent' WHERE app_slug = 'ai-journalist-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-journalist-agent' THEN '"1-starter-agent"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-journalist-agent';


-- Merge 'ai-movie-production-agent' into '4-running-agents' (both map to 'ai-video-script-producer')
UPDATE user_app_access SET app_slug = '4-running-agents' WHERE app_slug = 'ai-movie-production-agent';
UPDATE ai_app_usage SET app_slug = '4-running-agents' WHERE app_slug = 'ai-movie-production-agent';
UPDATE app_usage_analytics SET app_slug = '4-running-agents' WHERE app_slug = 'ai-movie-production-agent';
UPDATE app_tenants SET app_slug = '4-running-agents' WHERE app_slug = 'ai-movie-production-agent';
UPDATE agent_executions SET app_slug = '4-running-agents' WHERE app_slug = 'ai-movie-production-agent';
UPDATE agent_schedules SET app_slug = '4-running-agents' WHERE app_slug = 'ai-movie-production-agent';
UPDATE agent_configurations SET app_slug = '4-running-agents' WHERE app_slug = 'ai-movie-production-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-movie-production-agent' THEN '"4-running-agents"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-movie-production-agent';


-- Merge 'ai-blog-search' into 'ai-aqi-analysis-agent' (both map to 'blog-knowledge-search-ai')
UPDATE user_app_access SET app_slug = 'ai-aqi-analysis-agent' WHERE app_slug = 'ai-blog-search';
UPDATE ai_app_usage SET app_slug = 'ai-aqi-analysis-agent' WHERE app_slug = 'ai-blog-search';
UPDATE app_usage_analytics SET app_slug = 'ai-aqi-analysis-agent' WHERE app_slug = 'ai-blog-search';
UPDATE app_tenants SET app_slug = 'ai-aqi-analysis-agent' WHERE app_slug = 'ai-blog-search';
UPDATE agent_executions SET app_slug = 'ai-aqi-analysis-agent' WHERE app_slug = 'ai-blog-search';
UPDATE agent_schedules SET app_slug = 'ai-aqi-analysis-agent' WHERE app_slug = 'ai-blog-search';
UPDATE agent_configurations SET app_slug = 'ai-aqi-analysis-agent' WHERE app_slug = 'ai-blog-search';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-blog-search' THEN '"ai-aqi-analysis-agent"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-blog-search';


-- Merge 'rag-as-a-service' into '9-3-parallel-agent' (both map to 'business-knowledgebase-ai')
UPDATE user_app_access SET app_slug = '9-3-parallel-agent' WHERE app_slug = 'rag-as-a-service';
UPDATE ai_app_usage SET app_slug = '9-3-parallel-agent' WHERE app_slug = 'rag-as-a-service';
UPDATE app_usage_analytics SET app_slug = '9-3-parallel-agent' WHERE app_slug = 'rag-as-a-service';
UPDATE app_tenants SET app_slug = '9-3-parallel-agent' WHERE app_slug = 'rag-as-a-service';
UPDATE agent_executions SET app_slug = '9-3-parallel-agent' WHERE app_slug = 'rag-as-a-service';
UPDATE agent_schedules SET app_slug = '9-3-parallel-agent' WHERE app_slug = 'rag-as-a-service';
UPDATE agent_configurations SET app_slug = '9-3-parallel-agent' WHERE app_slug = 'rag-as-a-service';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'rag-as-a-service' THEN '"9-3-parallel-agent"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'rag-as-a-service';


-- Merge 'ai-email-gtm-reachout-agent' into 'ai-email-gtm-outreach-agent' (both map to 'candidate-outreach-ai')
UPDATE user_app_access SET app_slug = 'ai-email-gtm-outreach-agent' WHERE app_slug = 'ai-email-gtm-reachout-agent';
UPDATE ai_app_usage SET app_slug = 'ai-email-gtm-outreach-agent' WHERE app_slug = 'ai-email-gtm-reachout-agent';
UPDATE app_usage_analytics SET app_slug = 'ai-email-gtm-outreach-agent' WHERE app_slug = 'ai-email-gtm-reachout-agent';
UPDATE app_tenants SET app_slug = 'ai-email-gtm-outreach-agent' WHERE app_slug = 'ai-email-gtm-reachout-agent';
UPDATE agent_executions SET app_slug = 'ai-email-gtm-outreach-agent' WHERE app_slug = 'ai-email-gtm-reachout-agent';
UPDATE agent_schedules SET app_slug = 'ai-email-gtm-outreach-agent' WHERE app_slug = 'ai-email-gtm-reachout-agent';
UPDATE agent_configurations SET app_slug = 'ai-email-gtm-outreach-agent' WHERE app_slug = 'ai-email-gtm-reachout-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-email-gtm-reachout-agent' THEN '"ai-email-gtm-outreach-agent"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-email-gtm-reachout-agent';


-- Merge 'ai-competitor-intelligence-agent-team' into 'ai-proposal' (both map to 'competitor-spy-ai')
UPDATE user_app_access SET app_slug = 'ai-proposal' WHERE app_slug = 'ai-competitor-intelligence-agent-team';
UPDATE ai_app_usage SET app_slug = 'ai-proposal' WHERE app_slug = 'ai-competitor-intelligence-agent-team';
UPDATE app_usage_analytics SET app_slug = 'ai-proposal' WHERE app_slug = 'ai-competitor-intelligence-agent-team';
UPDATE app_tenants SET app_slug = 'ai-proposal' WHERE app_slug = 'ai-competitor-intelligence-agent-team';
UPDATE agent_executions SET app_slug = 'ai-proposal' WHERE app_slug = 'ai-competitor-intelligence-agent-team';
UPDATE agent_schedules SET app_slug = 'ai-proposal' WHERE app_slug = 'ai-competitor-intelligence-agent-team';
UPDATE agent_configurations SET app_slug = 'ai-proposal' WHERE app_slug = 'ai-competitor-intelligence-agent-team';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-competitor-intelligence-agent-team' THEN '"ai-proposal"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-competitor-intelligence-agent-team';


-- Merge 'chat-with-github' into 'ai-tic-tac-toe-agent' (both map to 'github-repo-assistant')
UPDATE user_app_access SET app_slug = 'ai-tic-tac-toe-agent' WHERE app_slug = 'chat-with-github';
UPDATE ai_app_usage SET app_slug = 'ai-tic-tac-toe-agent' WHERE app_slug = 'chat-with-github';
UPDATE app_usage_analytics SET app_slug = 'ai-tic-tac-toe-agent' WHERE app_slug = 'chat-with-github';
UPDATE app_tenants SET app_slug = 'ai-tic-tac-toe-agent' WHERE app_slug = 'chat-with-github';
UPDATE agent_executions SET app_slug = 'ai-tic-tac-toe-agent' WHERE app_slug = 'chat-with-github';
UPDATE agent_schedules SET app_slug = 'ai-tic-tac-toe-agent' WHERE app_slug = 'chat-with-github';
UPDATE agent_configurations SET app_slug = 'ai-tic-tac-toe-agent' WHERE app_slug = 'chat-with-github';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'chat-with-github' THEN '"ai-tic-tac-toe-agent"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'chat-with-github';


-- Merge 'chat-with-gmail' into 'agentic-rag-with-reasoning' (both map to 'gmail-intelligence-ai')
UPDATE user_app_access SET app_slug = 'agentic-rag-with-reasoning' WHERE app_slug = 'chat-with-gmail';
UPDATE ai_app_usage SET app_slug = 'agentic-rag-with-reasoning' WHERE app_slug = 'chat-with-gmail';
UPDATE app_usage_analytics SET app_slug = 'agentic-rag-with-reasoning' WHERE app_slug = 'chat-with-gmail';
UPDATE app_tenants SET app_slug = 'agentic-rag-with-reasoning' WHERE app_slug = 'chat-with-gmail';
UPDATE agent_executions SET app_slug = 'agentic-rag-with-reasoning' WHERE app_slug = 'chat-with-gmail';
UPDATE agent_schedules SET app_slug = 'agentic-rag-with-reasoning' WHERE app_slug = 'chat-with-gmail';
UPDATE agent_configurations SET app_slug = 'agentic-rag-with-reasoning' WHERE app_slug = 'chat-with-gmail';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'chat-with-gmail' THEN '"agentic-rag-with-reasoning"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'chat-with-gmail';


-- Merge 'ai-product-launch-intelligence-agent' into 'funnelcraft-ai' (both map to 'launch-campaign-builder-ai')
UPDATE user_app_access SET app_slug = 'funnelcraft-ai' WHERE app_slug = 'ai-product-launch-intelligence-agent';
UPDATE ai_app_usage SET app_slug = 'funnelcraft-ai' WHERE app_slug = 'ai-product-launch-intelligence-agent';
UPDATE app_usage_analytics SET app_slug = 'funnelcraft-ai' WHERE app_slug = 'ai-product-launch-intelligence-agent';
UPDATE app_tenants SET app_slug = 'funnelcraft-ai' WHERE app_slug = 'ai-product-launch-intelligence-agent';
UPDATE agent_executions SET app_slug = 'funnelcraft-ai' WHERE app_slug = 'ai-product-launch-intelligence-agent';
UPDATE agent_schedules SET app_slug = 'funnelcraft-ai' WHERE app_slug = 'ai-product-launch-intelligence-agent';
UPDATE agent_configurations SET app_slug = 'funnelcraft-ai' WHERE app_slug = 'ai-product-launch-intelligence-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-product-launch-intelligence-agent' THEN '"funnelcraft-ai"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-product-launch-intelligence-agent';


-- Merge 'web-scraping-ai-agent' into 'video-ai-editor' (both map to 'lead-research-scraper-ai')
UPDATE user_app_access SET app_slug = 'video-ai-editor' WHERE app_slug = 'web-scraping-ai-agent';
UPDATE ai_app_usage SET app_slug = 'video-ai-editor' WHERE app_slug = 'web-scraping-ai-agent';
UPDATE app_usage_analytics SET app_slug = 'video-ai-editor' WHERE app_slug = 'web-scraping-ai-agent';
UPDATE app_tenants SET app_slug = 'video-ai-editor' WHERE app_slug = 'web-scraping-ai-agent';
UPDATE agent_executions SET app_slug = 'video-ai-editor' WHERE app_slug = 'web-scraping-ai-agent';
UPDATE agent_schedules SET app_slug = 'video-ai-editor' WHERE app_slug = 'web-scraping-ai-agent';
UPDATE agent_configurations SET app_slug = 'video-ai-editor' WHERE app_slug = 'web-scraping-ai-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'web-scraping-ai-agent' THEN '"video-ai-editor"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'web-scraping-ai-agent';


-- Merge 'chat-with-substack' into 'personalizer-url-video-generation' (both map to 'newsletter-repurposer-ai')
UPDATE user_app_access SET app_slug = 'personalizer-url-video-generation' WHERE app_slug = 'chat-with-substack';
UPDATE ai_app_usage SET app_slug = 'personalizer-url-video-generation' WHERE app_slug = 'chat-with-substack';
UPDATE app_usage_analytics SET app_slug = 'personalizer-url-video-generation' WHERE app_slug = 'chat-with-substack';
UPDATE app_tenants SET app_slug = 'personalizer-url-video-generation' WHERE app_slug = 'chat-with-substack';
UPDATE agent_executions SET app_slug = 'personalizer-url-video-generation' WHERE app_slug = 'chat-with-substack';
UPDATE agent_schedules SET app_slug = 'personalizer-url-video-generation' WHERE app_slug = 'chat-with-substack';
UPDATE agent_configurations SET app_slug = 'personalizer-url-video-generation' WHERE app_slug = 'chat-with-substack';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'chat-with-substack' THEN '"personalizer-url-video-generation"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'chat-with-substack';


-- Merge 'chat-with-pdf' into 'ag2-adaptive-research-team' (both map to 'pdf-business-assistant')
UPDATE user_app_access SET app_slug = 'ag2-adaptive-research-team' WHERE app_slug = 'chat-with-pdf';
UPDATE ai_app_usage SET app_slug = 'ag2-adaptive-research-team' WHERE app_slug = 'chat-with-pdf';
UPDATE app_usage_analytics SET app_slug = 'ag2-adaptive-research-team' WHERE app_slug = 'chat-with-pdf';
UPDATE app_tenants SET app_slug = 'ag2-adaptive-research-team' WHERE app_slug = 'chat-with-pdf';
UPDATE agent_executions SET app_slug = 'ag2-adaptive-research-team' WHERE app_slug = 'chat-with-pdf';
UPDATE agent_schedules SET app_slug = 'ag2-adaptive-research-team' WHERE app_slug = 'chat-with-pdf';
UPDATE agent_configurations SET app_slug = 'ag2-adaptive-research-team' WHERE app_slug = 'chat-with-pdf';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'chat-with-pdf' THEN '"ag2-adaptive-research-team"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'chat-with-pdf';


-- Merge 'devpulse-ai' into 'cursor-ai-experiments' (both map to 'personal-ai-memory-assistant')
UPDATE user_app_access SET app_slug = 'cursor-ai-experiments' WHERE app_slug = 'devpulse-ai';
UPDATE ai_app_usage SET app_slug = 'cursor-ai-experiments' WHERE app_slug = 'devpulse-ai';
UPDATE app_usage_analytics SET app_slug = 'cursor-ai-experiments' WHERE app_slug = 'devpulse-ai';
UPDATE app_tenants SET app_slug = 'cursor-ai-experiments' WHERE app_slug = 'devpulse-ai';
UPDATE agent_executions SET app_slug = 'cursor-ai-experiments' WHERE app_slug = 'devpulse-ai';
UPDATE agent_schedules SET app_slug = 'cursor-ai-experiments' WHERE app_slug = 'devpulse-ai';
UPDATE agent_configurations SET app_slug = 'cursor-ai-experiments' WHERE app_slug = 'devpulse-ai';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'devpulse-ai' THEN '"cursor-ai-experiments"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'devpulse-ai';


-- Merge 'chat-with-research-papers' into 'agentic-rag-embedding-gemma' (both map to 'research-paper-assistant')
UPDATE user_app_access SET app_slug = 'agentic-rag-embedding-gemma' WHERE app_slug = 'chat-with-research-papers';
UPDATE ai_app_usage SET app_slug = 'agentic-rag-embedding-gemma' WHERE app_slug = 'chat-with-research-papers';
UPDATE app_usage_analytics SET app_slug = 'agentic-rag-embedding-gemma' WHERE app_slug = 'chat-with-research-papers';
UPDATE app_tenants SET app_slug = 'agentic-rag-embedding-gemma' WHERE app_slug = 'chat-with-research-papers';
UPDATE agent_executions SET app_slug = 'agentic-rag-embedding-gemma' WHERE app_slug = 'chat-with-research-papers';
UPDATE agent_schedules SET app_slug = 'agentic-rag-embedding-gemma' WHERE app_slug = 'chat-with-research-papers';
UPDATE agent_configurations SET app_slug = 'agentic-rag-embedding-gemma' WHERE app_slug = 'chat-with-research-papers';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'chat-with-research-papers' THEN '"agentic-rag-embedding-gemma"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'chat-with-research-papers';


-- Merge 'ai-recipe-meal-planning-agent' into 'ai-reasoning-agent' (both map to 'risk-decision-ai')
UPDATE user_app_access SET app_slug = 'ai-reasoning-agent' WHERE app_slug = 'ai-recipe-meal-planning-agent';
UPDATE ai_app_usage SET app_slug = 'ai-reasoning-agent' WHERE app_slug = 'ai-recipe-meal-planning-agent';
UPDATE app_usage_analytics SET app_slug = 'ai-reasoning-agent' WHERE app_slug = 'ai-recipe-meal-planning-agent';
UPDATE app_tenants SET app_slug = 'ai-reasoning-agent' WHERE app_slug = 'ai-recipe-meal-planning-agent';
UPDATE agent_executions SET app_slug = 'ai-reasoning-agent' WHERE app_slug = 'ai-recipe-meal-planning-agent';
UPDATE agent_schedules SET app_slug = 'ai-reasoning-agent' WHERE app_slug = 'ai-recipe-meal-planning-agent';
UPDATE agent_configurations SET app_slug = 'ai-reasoning-agent' WHERE app_slug = 'ai-recipe-meal-planning-agent';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'ai-recipe-meal-planning-agent' THEN '"ai-reasoning-agent"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'ai-recipe-meal-planning-agent';


-- Merge 'chat-with-youtube-videos' into 'ai-3dpygame-r1' (both map to 'video-knowledge-assistant')
UPDATE user_app_access SET app_slug = 'ai-3dpygame-r1' WHERE app_slug = 'chat-with-youtube-videos';
UPDATE ai_app_usage SET app_slug = 'ai-3dpygame-r1' WHERE app_slug = 'chat-with-youtube-videos';
UPDATE app_usage_analytics SET app_slug = 'ai-3dpygame-r1' WHERE app_slug = 'chat-with-youtube-videos';
UPDATE app_tenants SET app_slug = 'ai-3dpygame-r1' WHERE app_slug = 'chat-with-youtube-videos';
UPDATE agent_executions SET app_slug = 'ai-3dpygame-r1' WHERE app_slug = 'chat-with-youtube-videos';
UPDATE agent_schedules SET app_slug = 'ai-3dpygame-r1' WHERE app_slug = 'chat-with-youtube-videos';
UPDATE agent_configurations SET app_slug = 'ai-3dpygame-r1' WHERE app_slug = 'chat-with-youtube-videos';
-- Update JSONB array elements in products_catalog
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN val #>> '{}' = 'chat-with-youtube-videos' THEN '"ai-3dpygame-r1"'::jsonb
      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';
-- Delete the duplicate app record
DELETE FROM apps WHERE slug = 'chat-with-youtube-videos';


-- =====================================================================
-- STEP 2: Rename slugs in apps table
-- =====================================================================
UPDATE apps AS target
SET slug = src.new_slug
FROM (
  VALUES
    ('1-starter-agent', 'ai-news-content-writer'),
    ('4-running-agents', 'ai-video-script-producer'),
    ('5-1-in-memory-conversation-agent', 'ai-music-jingle-assistant'),
    ('5-2-persistent-conversation-agent', 'ai-film-producer'),
    ('6-1-agent-lifecycle-callbacks', 'podcast-creator-ai'),
    ('6-2-ai-interaction-callbacks', 'news-to-podcast-ai'),
    ('6-3-tool-execution-callbacks', 'ai-voice-support-agent'),
    ('7-plugins', 'talk-to-your-business-ai'),
    ('7-sessions', 'ai-audio-guide-creator'),
    ('9-1-sequential-agent', 'ai-intake-voice-agent'),
    ('9-2-loop-agent', 'ai-dictation-assistant'),
    ('9-3-parallel-agent', 'business-knowledgebase-ai'),
    ('ag2-adaptive-research-team', 'pdf-business-assistant'),
    ('agentic-rag-embedding-gemma', 'research-paper-assistant'),
    ('agentic-rag-gpt5', 'codebase-chat-ai'),
    ('agentic-rag-with-reasoning', 'gmail-intelligence-ai'),
    ('ai-3dpygame-r1', 'video-knowledge-assistant'),
    ('ai-aqi-analysis-agent', 'blog-knowledge-search-ai'),
    ('ai-arxiv-agent-memory', 'research-memory-assistant'),
    ('ai-audio-tour-agent', 'ai-audio-guide-creator'),
    ('ai-blog-search', 'blog-knowledge-search-ai'),
    ('ai-breakup-recovery-agent', 'multimodal-knowledge-ai'),
    ('ai-chess-agent', 'ai-knowledgebase-debugger'),
    ('ai-competitor-intelligence-agent-team', 'competitor-spy-ai'),
    ('ai-customer-support-agent', 'home-renovation-visualizer-ai'),
    ('ai-data-analysis-agent', 'local-business-analytics-ai'),
    ('ai-data-visualisation-agent', 'local-tour-guide-ai'),
    ('ai-deep-research-agent', 'deep-research-pro'),
    ('ai-domain-deep-research-agent', 'local-business-growth-advisor'),
    ('ai-email-gtm-outreach-agent', 'candidate-outreach-ai'),
    ('ai-email-gtm-reachout-agent', 'candidate-outreach-ai'),
    ('ai-financial-coach-agent', 'profit-coach-ai'),
    ('ai-fraud-investigation-agent', 'fraud-investigation-assistant'),
    ('ai-game-design-agent-team', 'interview-summary-ai'),
    ('ai-health-fitness-agent', 'hiring-plan-builder'),
    ('ai-journalist-agent', 'ai-news-content-writer'),
    ('ai-legal-agent-team', 'contract-summary-ai'),
    ('ai-life-insurance-advisor-agent', 'ai-intake-voice-agent'),
    ('ai-medical-imaging-agent', 'investment-research-assistant'),
    ('ai-meeting-agent', 'startup-due-diligence-ai'),
    ('ai-meme-generator-agent-browseruse', 'revenue-data-analyst-ai'),
    ('ai-mental-wellbeing-agent', 'financial-dashboard-ai'),
    ('ai-movie-production-agent', 'ai-video-script-producer'),
    ('ai-music-generator-agent', 'ai-music-jingle-assistant'),
    ('ai-personal-finance-agent', 'policy-compliance-assistant'),
    ('ai-personalizedcontent', 'ai-sales-intelligence-pro'),
    ('ai-product-launch-intelligence-agent', 'launch-campaign-builder-ai'),
    ('ai-proposal', 'competitor-spy-ai'),
    ('ai-real-estate-agent-team', 'real-estate-marketing-ai'),
    ('ai-reasoning-agent', 'risk-decision-ai'),
    ('ai-recipe-meal-planning-agent', 'risk-decision-ai'),
    ('ai-recruitment-agent-team', 'ai-hiring-assistant'),
    ('ai-referral-maximizer', 'ai-strategy-advisor'),
    ('ai-sales', 'ai-sales-email-writer'),
    ('ai-services-agency', 'ai-agency-builder-suite'),
    ('ai-signature', 'ai-content-creator-pro'),
    ('ai-skills-monetizer', 'daily-content-engine-ai'),
    ('ai-startup-insight-fire1-agent', 'ai-code-review-pro'),
    ('ai-startup-trend-analysis-agent', 'ai-bug-fixer'),
    ('ai-system-architect-r1', 'ai-fullstack-builder'),
    ('ai-teaching-agent-team', 'ai-course-creator-assistant'),
    ('ai-template-generator', 'ai-content-editor'),
    ('ai-tic-tac-toe-agent', 'github-repo-assistant'),
    ('ai-travel-agent-memory', 'build-plan-generator'),
    ('ai-travel-planner-mcp-agent-team', 'travel-planner-ai'),
    ('ai-video-image', 'ai-business-growth-consultant'),
    ('app', 'ai-design-studio'),
    ('autonomous-rag', 'landing-page-critic-ai'),
    ('blog-to-podcast-agent', 'dashboard-designer-ai'),
    ('chat-with-github', 'github-repo-assistant'),
    ('chat-with-gmail', 'gmail-intelligence-ai'),
    ('chat-with-pdf', 'pdf-business-assistant'),
    ('chat-with-research-papers', 'research-paper-assistant'),
    ('chat-with-substack', 'newsletter-repurposer-ai'),
    ('chat-with-tarots', 'academic-research-ai'),
    ('chat-with-youtube-videos', 'video-knowledge-assistant'),
    ('contextualai-rag-agent', 'market-research-ai'),
    ('corrective-rag', 'fact-check-ai'),
    ('cursor-ai-experiments', 'personal-ai-memory-assistant'),
    ('customer-support-voice-agent', 'local-business-voice-assistant'),
    ('deepseek-local-rag-agent', 'multi-ai-memory-hub'),
    ('devpulse-ai', 'personal-ai-memory-assistant'),
    ('frontend', 'private-chatgpt-clone'),
    ('funnelcraft-ai', 'launch-campaign-builder-ai'),
    ('github-mcp-agent', 'github-automation-agent'),
    ('hybrid-search-rag', 'smart-search-ai'),
    ('multimodal-coding-agent-team', 'ai-app-builder-assistant'),
    ('multimodal-design-agent-team', 'ai-design-studio'),
    ('openai-research-agent', 'research-assistant-ai'),
    ('personalizer-profile', 'ai-documentation-writer'),
    ('personalizer-recorder', 'blog-to-podcast-ai'),
    ('personalizer-url-video-generation', 'newsletter-repurposer-ai'),
    ('personalizer-video-image-transformer', 'youtube-repurposer-ai'),
    ('rag-as-a-service', 'business-knowledgebase-ai'),
    ('sales-assistant-app', 'ai-agency-builder-suite'),
    ('sales-page-builder', 'sales-call-follow-up-ai'),
    ('smart-crm-closer', 'ai-offer-decision-helper'),
    ('video-ai-editor', 'lead-research-scraper-ai'),
    ('web-scraping-ai-agent', 'lead-research-scraper-ai'),
    ('xai-finance-agent', 'finance-research-ai')
) AS src(old_slug, new_slug)
WHERE target.slug = src.old_slug;

-- =====================================================================
-- STEP 3: Update cross-references in all related tables
-- =====================================================================

-- 3a. user_app_access
UPDATE user_app_access AS target
SET app_slug = src.new_slug
FROM (
  VALUES
    ('1-starter-agent', 'ai-news-content-writer'),
    ('4-running-agents', 'ai-video-script-producer'),
    ('5-1-in-memory-conversation-agent', 'ai-music-jingle-assistant'),
    ('5-2-persistent-conversation-agent', 'ai-film-producer'),
    ('6-1-agent-lifecycle-callbacks', 'podcast-creator-ai'),
    ('6-2-ai-interaction-callbacks', 'news-to-podcast-ai'),
    ('6-3-tool-execution-callbacks', 'ai-voice-support-agent'),
    ('7-plugins', 'talk-to-your-business-ai'),
    ('7-sessions', 'ai-audio-guide-creator'),
    ('9-1-sequential-agent', 'ai-intake-voice-agent'),
    ('9-2-loop-agent', 'ai-dictation-assistant'),
    ('9-3-parallel-agent', 'business-knowledgebase-ai'),
    ('ag2-adaptive-research-team', 'pdf-business-assistant'),
    ('agentic-rag-embedding-gemma', 'research-paper-assistant'),
    ('agentic-rag-gpt5', 'codebase-chat-ai'),
    ('agentic-rag-with-reasoning', 'gmail-intelligence-ai'),
    ('ai-3dpygame-r1', 'video-knowledge-assistant'),
    ('ai-aqi-analysis-agent', 'blog-knowledge-search-ai'),
    ('ai-arxiv-agent-memory', 'research-memory-assistant'),
    ('ai-audio-tour-agent', 'ai-audio-guide-creator'),
    ('ai-blog-search', 'blog-knowledge-search-ai'),
    ('ai-breakup-recovery-agent', 'multimodal-knowledge-ai'),
    ('ai-chess-agent', 'ai-knowledgebase-debugger'),
    ('ai-competitor-intelligence-agent-team', 'competitor-spy-ai'),
    ('ai-customer-support-agent', 'home-renovation-visualizer-ai'),
    ('ai-data-analysis-agent', 'local-business-analytics-ai'),
    ('ai-data-visualisation-agent', 'local-tour-guide-ai'),
    ('ai-deep-research-agent', 'deep-research-pro'),
    ('ai-domain-deep-research-agent', 'local-business-growth-advisor'),
    ('ai-email-gtm-outreach-agent', 'candidate-outreach-ai'),
    ('ai-email-gtm-reachout-agent', 'candidate-outreach-ai'),
    ('ai-financial-coach-agent', 'profit-coach-ai'),
    ('ai-fraud-investigation-agent', 'fraud-investigation-assistant'),
    ('ai-game-design-agent-team', 'interview-summary-ai'),
    ('ai-health-fitness-agent', 'hiring-plan-builder'),
    ('ai-journalist-agent', 'ai-news-content-writer'),
    ('ai-legal-agent-team', 'contract-summary-ai'),
    ('ai-life-insurance-advisor-agent', 'ai-intake-voice-agent'),
    ('ai-medical-imaging-agent', 'investment-research-assistant'),
    ('ai-meeting-agent', 'startup-due-diligence-ai'),
    ('ai-meme-generator-agent-browseruse', 'revenue-data-analyst-ai'),
    ('ai-mental-wellbeing-agent', 'financial-dashboard-ai'),
    ('ai-movie-production-agent', 'ai-video-script-producer'),
    ('ai-music-generator-agent', 'ai-music-jingle-assistant'),
    ('ai-personal-finance-agent', 'policy-compliance-assistant'),
    ('ai-personalizedcontent', 'ai-sales-intelligence-pro'),
    ('ai-product-launch-intelligence-agent', 'launch-campaign-builder-ai'),
    ('ai-proposal', 'competitor-spy-ai'),
    ('ai-real-estate-agent-team', 'real-estate-marketing-ai'),
    ('ai-reasoning-agent', 'risk-decision-ai'),
    ('ai-recipe-meal-planning-agent', 'risk-decision-ai'),
    ('ai-recruitment-agent-team', 'ai-hiring-assistant'),
    ('ai-referral-maximizer', 'ai-strategy-advisor'),
    ('ai-sales', 'ai-sales-email-writer'),
    ('ai-services-agency', 'ai-agency-builder-suite'),
    ('ai-signature', 'ai-content-creator-pro'),
    ('ai-skills-monetizer', 'daily-content-engine-ai'),
    ('ai-startup-insight-fire1-agent', 'ai-code-review-pro'),
    ('ai-startup-trend-analysis-agent', 'ai-bug-fixer'),
    ('ai-system-architect-r1', 'ai-fullstack-builder'),
    ('ai-teaching-agent-team', 'ai-course-creator-assistant'),
    ('ai-template-generator', 'ai-content-editor'),
    ('ai-tic-tac-toe-agent', 'github-repo-assistant'),
    ('ai-travel-agent-memory', 'build-plan-generator'),
    ('ai-travel-planner-mcp-agent-team', 'travel-planner-ai'),
    ('ai-video-image', 'ai-business-growth-consultant'),
    ('app', 'ai-design-studio'),
    ('autonomous-rag', 'landing-page-critic-ai'),
    ('blog-to-podcast-agent', 'dashboard-designer-ai'),
    ('chat-with-github', 'github-repo-assistant'),
    ('chat-with-gmail', 'gmail-intelligence-ai'),
    ('chat-with-pdf', 'pdf-business-assistant'),
    ('chat-with-research-papers', 'research-paper-assistant'),
    ('chat-with-substack', 'newsletter-repurposer-ai'),
    ('chat-with-tarots', 'academic-research-ai'),
    ('chat-with-youtube-videos', 'video-knowledge-assistant'),
    ('contextualai-rag-agent', 'market-research-ai'),
    ('corrective-rag', 'fact-check-ai'),
    ('cursor-ai-experiments', 'personal-ai-memory-assistant'),
    ('customer-support-voice-agent', 'local-business-voice-assistant'),
    ('deepseek-local-rag-agent', 'multi-ai-memory-hub'),
    ('devpulse-ai', 'personal-ai-memory-assistant'),
    ('frontend', 'private-chatgpt-clone'),
    ('funnelcraft-ai', 'launch-campaign-builder-ai'),
    ('github-mcp-agent', 'github-automation-agent'),
    ('hybrid-search-rag', 'smart-search-ai'),
    ('multimodal-coding-agent-team', 'ai-app-builder-assistant'),
    ('multimodal-design-agent-team', 'ai-design-studio'),
    ('openai-research-agent', 'research-assistant-ai'),
    ('personalizer-profile', 'ai-documentation-writer'),
    ('personalizer-recorder', 'blog-to-podcast-ai'),
    ('personalizer-url-video-generation', 'newsletter-repurposer-ai'),
    ('personalizer-video-image-transformer', 'youtube-repurposer-ai'),
    ('rag-as-a-service', 'business-knowledgebase-ai'),
    ('sales-assistant-app', 'ai-agency-builder-suite'),
    ('sales-page-builder', 'sales-call-follow-up-ai'),
    ('smart-crm-closer', 'ai-offer-decision-helper'),
    ('video-ai-editor', 'lead-research-scraper-ai'),
    ('web-scraping-ai-agent', 'lead-research-scraper-ai'),
    ('xai-finance-agent', 'finance-research-ai')
) AS src(old_slug, new_slug)
WHERE target.app_slug = src.old_slug;

-- 3b. ai_app_usage
UPDATE ai_app_usage AS target
SET app_slug = src.new_slug
FROM (
  VALUES
    ('1-starter-agent', 'ai-news-content-writer'),
    ('4-running-agents', 'ai-video-script-producer'),
    ('5-1-in-memory-conversation-agent', 'ai-music-jingle-assistant'),
    ('5-2-persistent-conversation-agent', 'ai-film-producer'),
    ('6-1-agent-lifecycle-callbacks', 'podcast-creator-ai'),
    ('6-2-ai-interaction-callbacks', 'news-to-podcast-ai'),
    ('6-3-tool-execution-callbacks', 'ai-voice-support-agent'),
    ('7-plugins', 'talk-to-your-business-ai'),
    ('7-sessions', 'ai-audio-guide-creator'),
    ('9-1-sequential-agent', 'ai-intake-voice-agent'),
    ('9-2-loop-agent', 'ai-dictation-assistant'),
    ('9-3-parallel-agent', 'business-knowledgebase-ai'),
    ('ag2-adaptive-research-team', 'pdf-business-assistant'),
    ('agentic-rag-embedding-gemma', 'research-paper-assistant'),
    ('agentic-rag-gpt5', 'codebase-chat-ai'),
    ('agentic-rag-with-reasoning', 'gmail-intelligence-ai'),
    ('ai-3dpygame-r1', 'video-knowledge-assistant'),
    ('ai-aqi-analysis-agent', 'blog-knowledge-search-ai'),
    ('ai-arxiv-agent-memory', 'research-memory-assistant'),
    ('ai-audio-tour-agent', 'ai-audio-guide-creator'),
    ('ai-blog-search', 'blog-knowledge-search-ai'),
    ('ai-breakup-recovery-agent', 'multimodal-knowledge-ai'),
    ('ai-chess-agent', 'ai-knowledgebase-debugger'),
    ('ai-competitor-intelligence-agent-team', 'competitor-spy-ai'),
    ('ai-customer-support-agent', 'home-renovation-visualizer-ai'),
    ('ai-data-analysis-agent', 'local-business-analytics-ai'),
    ('ai-data-visualisation-agent', 'local-tour-guide-ai'),
    ('ai-deep-research-agent', 'deep-research-pro'),
    ('ai-domain-deep-research-agent', 'local-business-growth-advisor'),
    ('ai-email-gtm-outreach-agent', 'candidate-outreach-ai'),
    ('ai-email-gtm-reachout-agent', 'candidate-outreach-ai'),
    ('ai-financial-coach-agent', 'profit-coach-ai'),
    ('ai-fraud-investigation-agent', 'fraud-investigation-assistant'),
    ('ai-game-design-agent-team', 'interview-summary-ai'),
    ('ai-health-fitness-agent', 'hiring-plan-builder'),
    ('ai-journalist-agent', 'ai-news-content-writer'),
    ('ai-legal-agent-team', 'contract-summary-ai'),
    ('ai-life-insurance-advisor-agent', 'ai-intake-voice-agent'),
    ('ai-medical-imaging-agent', 'investment-research-assistant'),
    ('ai-meeting-agent', 'startup-due-diligence-ai'),
    ('ai-meme-generator-agent-browseruse', 'revenue-data-analyst-ai'),
    ('ai-mental-wellbeing-agent', 'financial-dashboard-ai'),
    ('ai-movie-production-agent', 'ai-video-script-producer'),
    ('ai-music-generator-agent', 'ai-music-jingle-assistant'),
    ('ai-personal-finance-agent', 'policy-compliance-assistant'),
    ('ai-personalizedcontent', 'ai-sales-intelligence-pro'),
    ('ai-product-launch-intelligence-agent', 'launch-campaign-builder-ai'),
    ('ai-proposal', 'competitor-spy-ai'),
    ('ai-real-estate-agent-team', 'real-estate-marketing-ai'),
    ('ai-reasoning-agent', 'risk-decision-ai'),
    ('ai-recipe-meal-planning-agent', 'risk-decision-ai'),
    ('ai-recruitment-agent-team', 'ai-hiring-assistant'),
    ('ai-referral-maximizer', 'ai-strategy-advisor'),
    ('ai-sales', 'ai-sales-email-writer'),
    ('ai-services-agency', 'ai-agency-builder-suite'),
    ('ai-signature', 'ai-content-creator-pro'),
    ('ai-skills-monetizer', 'daily-content-engine-ai'),
    ('ai-startup-insight-fire1-agent', 'ai-code-review-pro'),
    ('ai-startup-trend-analysis-agent', 'ai-bug-fixer'),
    ('ai-system-architect-r1', 'ai-fullstack-builder'),
    ('ai-teaching-agent-team', 'ai-course-creator-assistant'),
    ('ai-template-generator', 'ai-content-editor'),
    ('ai-tic-tac-toe-agent', 'github-repo-assistant'),
    ('ai-travel-agent-memory', 'build-plan-generator'),
    ('ai-travel-planner-mcp-agent-team', 'travel-planner-ai'),
    ('ai-video-image', 'ai-business-growth-consultant'),
    ('app', 'ai-design-studio'),
    ('autonomous-rag', 'landing-page-critic-ai'),
    ('blog-to-podcast-agent', 'dashboard-designer-ai'),
    ('chat-with-github', 'github-repo-assistant'),
    ('chat-with-gmail', 'gmail-intelligence-ai'),
    ('chat-with-pdf', 'pdf-business-assistant'),
    ('chat-with-research-papers', 'research-paper-assistant'),
    ('chat-with-substack', 'newsletter-repurposer-ai'),
    ('chat-with-tarots', 'academic-research-ai'),
    ('chat-with-youtube-videos', 'video-knowledge-assistant'),
    ('contextualai-rag-agent', 'market-research-ai'),
    ('corrective-rag', 'fact-check-ai'),
    ('cursor-ai-experiments', 'personal-ai-memory-assistant'),
    ('customer-support-voice-agent', 'local-business-voice-assistant'),
    ('deepseek-local-rag-agent', 'multi-ai-memory-hub'),
    ('devpulse-ai', 'personal-ai-memory-assistant'),
    ('frontend', 'private-chatgpt-clone'),
    ('funnelcraft-ai', 'launch-campaign-builder-ai'),
    ('github-mcp-agent', 'github-automation-agent'),
    ('hybrid-search-rag', 'smart-search-ai'),
    ('multimodal-coding-agent-team', 'ai-app-builder-assistant'),
    ('multimodal-design-agent-team', 'ai-design-studio'),
    ('openai-research-agent', 'research-assistant-ai'),
    ('personalizer-profile', 'ai-documentation-writer'),
    ('personalizer-recorder', 'blog-to-podcast-ai'),
    ('personalizer-url-video-generation', 'newsletter-repurposer-ai'),
    ('personalizer-video-image-transformer', 'youtube-repurposer-ai'),
    ('rag-as-a-service', 'business-knowledgebase-ai'),
    ('sales-assistant-app', 'ai-agency-builder-suite'),
    ('sales-page-builder', 'sales-call-follow-up-ai'),
    ('smart-crm-closer', 'ai-offer-decision-helper'),
    ('video-ai-editor', 'lead-research-scraper-ai'),
    ('web-scraping-ai-agent', 'lead-research-scraper-ai'),
    ('xai-finance-agent', 'finance-research-ai')
) AS src(old_slug, new_slug)
WHERE target.app_slug = src.old_slug;

-- 3c. app_usage_analytics
UPDATE app_usage_analytics AS target
SET app_slug = src.new_slug
FROM (
  VALUES
    ('1-starter-agent', 'ai-news-content-writer'),
    ('4-running-agents', 'ai-video-script-producer'),
    ('5-1-in-memory-conversation-agent', 'ai-music-jingle-assistant'),
    ('5-2-persistent-conversation-agent', 'ai-film-producer'),
    ('6-1-agent-lifecycle-callbacks', 'podcast-creator-ai'),
    ('6-2-ai-interaction-callbacks', 'news-to-podcast-ai'),
    ('6-3-tool-execution-callbacks', 'ai-voice-support-agent'),
    ('7-plugins', 'talk-to-your-business-ai'),
    ('7-sessions', 'ai-audio-guide-creator'),
    ('9-1-sequential-agent', 'ai-intake-voice-agent'),
    ('9-2-loop-agent', 'ai-dictation-assistant'),
    ('9-3-parallel-agent', 'business-knowledgebase-ai'),
    ('ag2-adaptive-research-team', 'pdf-business-assistant'),
    ('agentic-rag-embedding-gemma', 'research-paper-assistant'),
    ('agentic-rag-gpt5', 'codebase-chat-ai'),
    ('agentic-rag-with-reasoning', 'gmail-intelligence-ai'),
    ('ai-3dpygame-r1', 'video-knowledge-assistant'),
    ('ai-aqi-analysis-agent', 'blog-knowledge-search-ai'),
    ('ai-arxiv-agent-memory', 'research-memory-assistant'),
    ('ai-audio-tour-agent', 'ai-audio-guide-creator'),
    ('ai-blog-search', 'blog-knowledge-search-ai'),
    ('ai-breakup-recovery-agent', 'multimodal-knowledge-ai'),
    ('ai-chess-agent', 'ai-knowledgebase-debugger'),
    ('ai-competitor-intelligence-agent-team', 'competitor-spy-ai'),
    ('ai-customer-support-agent', 'home-renovation-visualizer-ai'),
    ('ai-data-analysis-agent', 'local-business-analytics-ai'),
    ('ai-data-visualisation-agent', 'local-tour-guide-ai'),
    ('ai-deep-research-agent', 'deep-research-pro'),
    ('ai-domain-deep-research-agent', 'local-business-growth-advisor'),
    ('ai-email-gtm-outreach-agent', 'candidate-outreach-ai'),
    ('ai-email-gtm-reachout-agent', 'candidate-outreach-ai'),
    ('ai-financial-coach-agent', 'profit-coach-ai'),
    ('ai-fraud-investigation-agent', 'fraud-investigation-assistant'),
    ('ai-game-design-agent-team', 'interview-summary-ai'),
    ('ai-health-fitness-agent', 'hiring-plan-builder'),
    ('ai-journalist-agent', 'ai-news-content-writer'),
    ('ai-legal-agent-team', 'contract-summary-ai'),
    ('ai-life-insurance-advisor-agent', 'ai-intake-voice-agent'),
    ('ai-medical-imaging-agent', 'investment-research-assistant'),
    ('ai-meeting-agent', 'startup-due-diligence-ai'),
    ('ai-meme-generator-agent-browseruse', 'revenue-data-analyst-ai'),
    ('ai-mental-wellbeing-agent', 'financial-dashboard-ai'),
    ('ai-movie-production-agent', 'ai-video-script-producer'),
    ('ai-music-generator-agent', 'ai-music-jingle-assistant'),
    ('ai-personal-finance-agent', 'policy-compliance-assistant'),
    ('ai-personalizedcontent', 'ai-sales-intelligence-pro'),
    ('ai-product-launch-intelligence-agent', 'launch-campaign-builder-ai'),
    ('ai-proposal', 'competitor-spy-ai'),
    ('ai-real-estate-agent-team', 'real-estate-marketing-ai'),
    ('ai-reasoning-agent', 'risk-decision-ai'),
    ('ai-recipe-meal-planning-agent', 'risk-decision-ai'),
    ('ai-recruitment-agent-team', 'ai-hiring-assistant'),
    ('ai-referral-maximizer', 'ai-strategy-advisor'),
    ('ai-sales', 'ai-sales-email-writer'),
    ('ai-services-agency', 'ai-agency-builder-suite'),
    ('ai-signature', 'ai-content-creator-pro'),
    ('ai-skills-monetizer', 'daily-content-engine-ai'),
    ('ai-startup-insight-fire1-agent', 'ai-code-review-pro'),
    ('ai-startup-trend-analysis-agent', 'ai-bug-fixer'),
    ('ai-system-architect-r1', 'ai-fullstack-builder'),
    ('ai-teaching-agent-team', 'ai-course-creator-assistant'),
    ('ai-template-generator', 'ai-content-editor'),
    ('ai-tic-tac-toe-agent', 'github-repo-assistant'),
    ('ai-travel-agent-memory', 'build-plan-generator'),
    ('ai-travel-planner-mcp-agent-team', 'travel-planner-ai'),
    ('ai-video-image', 'ai-business-growth-consultant'),
    ('app', 'ai-design-studio'),
    ('autonomous-rag', 'landing-page-critic-ai'),
    ('blog-to-podcast-agent', 'dashboard-designer-ai'),
    ('chat-with-github', 'github-repo-assistant'),
    ('chat-with-gmail', 'gmail-intelligence-ai'),
    ('chat-with-pdf', 'pdf-business-assistant'),
    ('chat-with-research-papers', 'research-paper-assistant'),
    ('chat-with-substack', 'newsletter-repurposer-ai'),
    ('chat-with-tarots', 'academic-research-ai'),
    ('chat-with-youtube-videos', 'video-knowledge-assistant'),
    ('contextualai-rag-agent', 'market-research-ai'),
    ('corrective-rag', 'fact-check-ai'),
    ('cursor-ai-experiments', 'personal-ai-memory-assistant'),
    ('customer-support-voice-agent', 'local-business-voice-assistant'),
    ('deepseek-local-rag-agent', 'multi-ai-memory-hub'),
    ('devpulse-ai', 'personal-ai-memory-assistant'),
    ('frontend', 'private-chatgpt-clone'),
    ('funnelcraft-ai', 'launch-campaign-builder-ai'),
    ('github-mcp-agent', 'github-automation-agent'),
    ('hybrid-search-rag', 'smart-search-ai'),
    ('multimodal-coding-agent-team', 'ai-app-builder-assistant'),
    ('multimodal-design-agent-team', 'ai-design-studio'),
    ('openai-research-agent', 'research-assistant-ai'),
    ('personalizer-profile', 'ai-documentation-writer'),
    ('personalizer-recorder', 'blog-to-podcast-ai'),
    ('personalizer-url-video-generation', 'newsletter-repurposer-ai'),
    ('personalizer-video-image-transformer', 'youtube-repurposer-ai'),
    ('rag-as-a-service', 'business-knowledgebase-ai'),
    ('sales-assistant-app', 'ai-agency-builder-suite'),
    ('sales-page-builder', 'sales-call-follow-up-ai'),
    ('smart-crm-closer', 'ai-offer-decision-helper'),
    ('video-ai-editor', 'lead-research-scraper-ai'),
    ('web-scraping-ai-agent', 'lead-research-scraper-ai'),
    ('xai-finance-agent', 'finance-research-ai')
) AS src(old_slug, new_slug)
WHERE target.app_slug = src.old_slug;

-- 3d. app_tenants
UPDATE app_tenants AS target
SET app_slug = src.new_slug
FROM (
  VALUES
    ('1-starter-agent', 'ai-news-content-writer'),
    ('4-running-agents', 'ai-video-script-producer'),
    ('5-1-in-memory-conversation-agent', 'ai-music-jingle-assistant'),
    ('5-2-persistent-conversation-agent', 'ai-film-producer'),
    ('6-1-agent-lifecycle-callbacks', 'podcast-creator-ai'),
    ('6-2-ai-interaction-callbacks', 'news-to-podcast-ai'),
    ('6-3-tool-execution-callbacks', 'ai-voice-support-agent'),
    ('7-plugins', 'talk-to-your-business-ai'),
    ('7-sessions', 'ai-audio-guide-creator'),
    ('9-1-sequential-agent', 'ai-intake-voice-agent'),
    ('9-2-loop-agent', 'ai-dictation-assistant'),
    ('9-3-parallel-agent', 'business-knowledgebase-ai'),
    ('ag2-adaptive-research-team', 'pdf-business-assistant'),
    ('agentic-rag-embedding-gemma', 'research-paper-assistant'),
    ('agentic-rag-gpt5', 'codebase-chat-ai'),
    ('agentic-rag-with-reasoning', 'gmail-intelligence-ai'),
    ('ai-3dpygame-r1', 'video-knowledge-assistant'),
    ('ai-aqi-analysis-agent', 'blog-knowledge-search-ai'),
    ('ai-arxiv-agent-memory', 'research-memory-assistant'),
    ('ai-audio-tour-agent', 'ai-audio-guide-creator'),
    ('ai-blog-search', 'blog-knowledge-search-ai'),
    ('ai-breakup-recovery-agent', 'multimodal-knowledge-ai'),
    ('ai-chess-agent', 'ai-knowledgebase-debugger'),
    ('ai-competitor-intelligence-agent-team', 'competitor-spy-ai'),
    ('ai-customer-support-agent', 'home-renovation-visualizer-ai'),
    ('ai-data-analysis-agent', 'local-business-analytics-ai'),
    ('ai-data-visualisation-agent', 'local-tour-guide-ai'),
    ('ai-deep-research-agent', 'deep-research-pro'),
    ('ai-domain-deep-research-agent', 'local-business-growth-advisor'),
    ('ai-email-gtm-outreach-agent', 'candidate-outreach-ai'),
    ('ai-email-gtm-reachout-agent', 'candidate-outreach-ai'),
    ('ai-financial-coach-agent', 'profit-coach-ai'),
    ('ai-fraud-investigation-agent', 'fraud-investigation-assistant'),
    ('ai-game-design-agent-team', 'interview-summary-ai'),
    ('ai-health-fitness-agent', 'hiring-plan-builder'),
    ('ai-journalist-agent', 'ai-news-content-writer'),
    ('ai-legal-agent-team', 'contract-summary-ai'),
    ('ai-life-insurance-advisor-agent', 'ai-intake-voice-agent'),
    ('ai-medical-imaging-agent', 'investment-research-assistant'),
    ('ai-meeting-agent', 'startup-due-diligence-ai'),
    ('ai-meme-generator-agent-browseruse', 'revenue-data-analyst-ai'),
    ('ai-mental-wellbeing-agent', 'financial-dashboard-ai'),
    ('ai-movie-production-agent', 'ai-video-script-producer'),
    ('ai-music-generator-agent', 'ai-music-jingle-assistant'),
    ('ai-personal-finance-agent', 'policy-compliance-assistant'),
    ('ai-personalizedcontent', 'ai-sales-intelligence-pro'),
    ('ai-product-launch-intelligence-agent', 'launch-campaign-builder-ai'),
    ('ai-proposal', 'competitor-spy-ai'),
    ('ai-real-estate-agent-team', 'real-estate-marketing-ai'),
    ('ai-reasoning-agent', 'risk-decision-ai'),
    ('ai-recipe-meal-planning-agent', 'risk-decision-ai'),
    ('ai-recruitment-agent-team', 'ai-hiring-assistant'),
    ('ai-referral-maximizer', 'ai-strategy-advisor'),
    ('ai-sales', 'ai-sales-email-writer'),
    ('ai-services-agency', 'ai-agency-builder-suite'),
    ('ai-signature', 'ai-content-creator-pro'),
    ('ai-skills-monetizer', 'daily-content-engine-ai'),
    ('ai-startup-insight-fire1-agent', 'ai-code-review-pro'),
    ('ai-startup-trend-analysis-agent', 'ai-bug-fixer'),
    ('ai-system-architect-r1', 'ai-fullstack-builder'),
    ('ai-teaching-agent-team', 'ai-course-creator-assistant'),
    ('ai-template-generator', 'ai-content-editor'),
    ('ai-tic-tac-toe-agent', 'github-repo-assistant'),
    ('ai-travel-agent-memory', 'build-plan-generator'),
    ('ai-travel-planner-mcp-agent-team', 'travel-planner-ai'),
    ('ai-video-image', 'ai-business-growth-consultant'),
    ('app', 'ai-design-studio'),
    ('autonomous-rag', 'landing-page-critic-ai'),
    ('blog-to-podcast-agent', 'dashboard-designer-ai'),
    ('chat-with-github', 'github-repo-assistant'),
    ('chat-with-gmail', 'gmail-intelligence-ai'),
    ('chat-with-pdf', 'pdf-business-assistant'),
    ('chat-with-research-papers', 'research-paper-assistant'),
    ('chat-with-substack', 'newsletter-repurposer-ai'),
    ('chat-with-tarots', 'academic-research-ai'),
    ('chat-with-youtube-videos', 'video-knowledge-assistant'),
    ('contextualai-rag-agent', 'market-research-ai'),
    ('corrective-rag', 'fact-check-ai'),
    ('cursor-ai-experiments', 'personal-ai-memory-assistant'),
    ('customer-support-voice-agent', 'local-business-voice-assistant'),
    ('deepseek-local-rag-agent', 'multi-ai-memory-hub'),
    ('devpulse-ai', 'personal-ai-memory-assistant'),
    ('frontend', 'private-chatgpt-clone'),
    ('funnelcraft-ai', 'launch-campaign-builder-ai'),
    ('github-mcp-agent', 'github-automation-agent'),
    ('hybrid-search-rag', 'smart-search-ai'),
    ('multimodal-coding-agent-team', 'ai-app-builder-assistant'),
    ('multimodal-design-agent-team', 'ai-design-studio'),
    ('openai-research-agent', 'research-assistant-ai'),
    ('personalizer-profile', 'ai-documentation-writer'),
    ('personalizer-recorder', 'blog-to-podcast-ai'),
    ('personalizer-url-video-generation', 'newsletter-repurposer-ai'),
    ('personalizer-video-image-transformer', 'youtube-repurposer-ai'),
    ('rag-as-a-service', 'business-knowledgebase-ai'),
    ('sales-assistant-app', 'ai-agency-builder-suite'),
    ('sales-page-builder', 'sales-call-follow-up-ai'),
    ('smart-crm-closer', 'ai-offer-decision-helper'),
    ('video-ai-editor', 'lead-research-scraper-ai'),
    ('web-scraping-ai-agent', 'lead-research-scraper-ai'),
    ('xai-finance-agent', 'finance-research-ai')
) AS src(old_slug, new_slug)
WHERE target.app_slug = src.old_slug;

-- 3e. agent_executions
UPDATE agent_executions AS target
SET app_slug = src.new_slug
FROM (
  VALUES
    ('1-starter-agent', 'ai-news-content-writer'),
    ('4-running-agents', 'ai-video-script-producer'),
    ('5-1-in-memory-conversation-agent', 'ai-music-jingle-assistant'),
    ('5-2-persistent-conversation-agent', 'ai-film-producer'),
    ('6-1-agent-lifecycle-callbacks', 'podcast-creator-ai'),
    ('6-2-ai-interaction-callbacks', 'news-to-podcast-ai'),
    ('6-3-tool-execution-callbacks', 'ai-voice-support-agent'),
    ('7-plugins', 'talk-to-your-business-ai'),
    ('7-sessions', 'ai-audio-guide-creator'),
    ('9-1-sequential-agent', 'ai-intake-voice-agent'),
    ('9-2-loop-agent', 'ai-dictation-assistant'),
    ('9-3-parallel-agent', 'business-knowledgebase-ai'),
    ('ag2-adaptive-research-team', 'pdf-business-assistant'),
    ('agentic-rag-embedding-gemma', 'research-paper-assistant'),
    ('agentic-rag-gpt5', 'codebase-chat-ai'),
    ('agentic-rag-with-reasoning', 'gmail-intelligence-ai'),
    ('ai-3dpygame-r1', 'video-knowledge-assistant'),
    ('ai-aqi-analysis-agent', 'blog-knowledge-search-ai'),
    ('ai-arxiv-agent-memory', 'research-memory-assistant'),
    ('ai-audio-tour-agent', 'ai-audio-guide-creator'),
    ('ai-blog-search', 'blog-knowledge-search-ai'),
    ('ai-breakup-recovery-agent', 'multimodal-knowledge-ai'),
    ('ai-chess-agent', 'ai-knowledgebase-debugger'),
    ('ai-competitor-intelligence-agent-team', 'competitor-spy-ai'),
    ('ai-customer-support-agent', 'home-renovation-visualizer-ai'),
    ('ai-data-analysis-agent', 'local-business-analytics-ai'),
    ('ai-data-visualisation-agent', 'local-tour-guide-ai'),
    ('ai-deep-research-agent', 'deep-research-pro'),
    ('ai-domain-deep-research-agent', 'local-business-growth-advisor'),
    ('ai-email-gtm-outreach-agent', 'candidate-outreach-ai'),
    ('ai-email-gtm-reachout-agent', 'candidate-outreach-ai'),
    ('ai-financial-coach-agent', 'profit-coach-ai'),
    ('ai-fraud-investigation-agent', 'fraud-investigation-assistant'),
    ('ai-game-design-agent-team', 'interview-summary-ai'),
    ('ai-health-fitness-agent', 'hiring-plan-builder'),
    ('ai-journalist-agent', 'ai-news-content-writer'),
    ('ai-legal-agent-team', 'contract-summary-ai'),
    ('ai-life-insurance-advisor-agent', 'ai-intake-voice-agent'),
    ('ai-medical-imaging-agent', 'investment-research-assistant'),
    ('ai-meeting-agent', 'startup-due-diligence-ai'),
    ('ai-meme-generator-agent-browseruse', 'revenue-data-analyst-ai'),
    ('ai-mental-wellbeing-agent', 'financial-dashboard-ai'),
    ('ai-movie-production-agent', 'ai-video-script-producer'),
    ('ai-music-generator-agent', 'ai-music-jingle-assistant'),
    ('ai-personal-finance-agent', 'policy-compliance-assistant'),
    ('ai-personalizedcontent', 'ai-sales-intelligence-pro'),
    ('ai-product-launch-intelligence-agent', 'launch-campaign-builder-ai'),
    ('ai-proposal', 'competitor-spy-ai'),
    ('ai-real-estate-agent-team', 'real-estate-marketing-ai'),
    ('ai-reasoning-agent', 'risk-decision-ai'),
    ('ai-recipe-meal-planning-agent', 'risk-decision-ai'),
    ('ai-recruitment-agent-team', 'ai-hiring-assistant'),
    ('ai-referral-maximizer', 'ai-strategy-advisor'),
    ('ai-sales', 'ai-sales-email-writer'),
    ('ai-services-agency', 'ai-agency-builder-suite'),
    ('ai-signature', 'ai-content-creator-pro'),
    ('ai-skills-monetizer', 'daily-content-engine-ai'),
    ('ai-startup-insight-fire1-agent', 'ai-code-review-pro'),
    ('ai-startup-trend-analysis-agent', 'ai-bug-fixer'),
    ('ai-system-architect-r1', 'ai-fullstack-builder'),
    ('ai-teaching-agent-team', 'ai-course-creator-assistant'),
    ('ai-template-generator', 'ai-content-editor'),
    ('ai-tic-tac-toe-agent', 'github-repo-assistant'),
    ('ai-travel-agent-memory', 'build-plan-generator'),
    ('ai-travel-planner-mcp-agent-team', 'travel-planner-ai'),
    ('ai-video-image', 'ai-business-growth-consultant'),
    ('app', 'ai-design-studio'),
    ('autonomous-rag', 'landing-page-critic-ai'),
    ('blog-to-podcast-agent', 'dashboard-designer-ai'),
    ('chat-with-github', 'github-repo-assistant'),
    ('chat-with-gmail', 'gmail-intelligence-ai'),
    ('chat-with-pdf', 'pdf-business-assistant'),
    ('chat-with-research-papers', 'research-paper-assistant'),
    ('chat-with-substack', 'newsletter-repurposer-ai'),
    ('chat-with-tarots', 'academic-research-ai'),
    ('chat-with-youtube-videos', 'video-knowledge-assistant'),
    ('contextualai-rag-agent', 'market-research-ai'),
    ('corrective-rag', 'fact-check-ai'),
    ('cursor-ai-experiments', 'personal-ai-memory-assistant'),
    ('customer-support-voice-agent', 'local-business-voice-assistant'),
    ('deepseek-local-rag-agent', 'multi-ai-memory-hub'),
    ('devpulse-ai', 'personal-ai-memory-assistant'),
    ('frontend', 'private-chatgpt-clone'),
    ('funnelcraft-ai', 'launch-campaign-builder-ai'),
    ('github-mcp-agent', 'github-automation-agent'),
    ('hybrid-search-rag', 'smart-search-ai'),
    ('multimodal-coding-agent-team', 'ai-app-builder-assistant'),
    ('multimodal-design-agent-team', 'ai-design-studio'),
    ('openai-research-agent', 'research-assistant-ai'),
    ('personalizer-profile', 'ai-documentation-writer'),
    ('personalizer-recorder', 'blog-to-podcast-ai'),
    ('personalizer-url-video-generation', 'newsletter-repurposer-ai'),
    ('personalizer-video-image-transformer', 'youtube-repurposer-ai'),
    ('rag-as-a-service', 'business-knowledgebase-ai'),
    ('sales-assistant-app', 'ai-agency-builder-suite'),
    ('sales-page-builder', 'sales-call-follow-up-ai'),
    ('smart-crm-closer', 'ai-offer-decision-helper'),
    ('video-ai-editor', 'lead-research-scraper-ai'),
    ('web-scraping-ai-agent', 'lead-research-scraper-ai'),
    ('xai-finance-agent', 'finance-research-ai')
) AS src(old_slug, new_slug)
WHERE target.app_slug = src.old_slug;

-- 3f. agent_schedules
UPDATE agent_schedules AS target
SET app_slug = src.new_slug
FROM (
  VALUES
    ('1-starter-agent', 'ai-news-content-writer'),
    ('4-running-agents', 'ai-video-script-producer'),
    ('5-1-in-memory-conversation-agent', 'ai-music-jingle-assistant'),
    ('5-2-persistent-conversation-agent', 'ai-film-producer'),
    ('6-1-agent-lifecycle-callbacks', 'podcast-creator-ai'),
    ('6-2-ai-interaction-callbacks', 'news-to-podcast-ai'),
    ('6-3-tool-execution-callbacks', 'ai-voice-support-agent'),
    ('7-plugins', 'talk-to-your-business-ai'),
    ('7-sessions', 'ai-audio-guide-creator'),
    ('9-1-sequential-agent', 'ai-intake-voice-agent'),
    ('9-2-loop-agent', 'ai-dictation-assistant'),
    ('9-3-parallel-agent', 'business-knowledgebase-ai'),
    ('ag2-adaptive-research-team', 'pdf-business-assistant'),
    ('agentic-rag-embedding-gemma', 'research-paper-assistant'),
    ('agentic-rag-gpt5', 'codebase-chat-ai'),
    ('agentic-rag-with-reasoning', 'gmail-intelligence-ai'),
    ('ai-3dpygame-r1', 'video-knowledge-assistant'),
    ('ai-aqi-analysis-agent', 'blog-knowledge-search-ai'),
    ('ai-arxiv-agent-memory', 'research-memory-assistant'),
    ('ai-audio-tour-agent', 'ai-audio-guide-creator'),
    ('ai-blog-search', 'blog-knowledge-search-ai'),
    ('ai-breakup-recovery-agent', 'multimodal-knowledge-ai'),
    ('ai-chess-agent', 'ai-knowledgebase-debugger'),
    ('ai-competitor-intelligence-agent-team', 'competitor-spy-ai'),
    ('ai-customer-support-agent', 'home-renovation-visualizer-ai'),
    ('ai-data-analysis-agent', 'local-business-analytics-ai'),
    ('ai-data-visualisation-agent', 'local-tour-guide-ai'),
    ('ai-deep-research-agent', 'deep-research-pro'),
    ('ai-domain-deep-research-agent', 'local-business-growth-advisor'),
    ('ai-email-gtm-outreach-agent', 'candidate-outreach-ai'),
    ('ai-email-gtm-reachout-agent', 'candidate-outreach-ai'),
    ('ai-financial-coach-agent', 'profit-coach-ai'),
    ('ai-fraud-investigation-agent', 'fraud-investigation-assistant'),
    ('ai-game-design-agent-team', 'interview-summary-ai'),
    ('ai-health-fitness-agent', 'hiring-plan-builder'),
    ('ai-journalist-agent', 'ai-news-content-writer'),
    ('ai-legal-agent-team', 'contract-summary-ai'),
    ('ai-life-insurance-advisor-agent', 'ai-intake-voice-agent'),
    ('ai-medical-imaging-agent', 'investment-research-assistant'),
    ('ai-meeting-agent', 'startup-due-diligence-ai'),
    ('ai-meme-generator-agent-browseruse', 'revenue-data-analyst-ai'),
    ('ai-mental-wellbeing-agent', 'financial-dashboard-ai'),
    ('ai-movie-production-agent', 'ai-video-script-producer'),
    ('ai-music-generator-agent', 'ai-music-jingle-assistant'),
    ('ai-personal-finance-agent', 'policy-compliance-assistant'),
    ('ai-personalizedcontent', 'ai-sales-intelligence-pro'),
    ('ai-product-launch-intelligence-agent', 'launch-campaign-builder-ai'),
    ('ai-proposal', 'competitor-spy-ai'),
    ('ai-real-estate-agent-team', 'real-estate-marketing-ai'),
    ('ai-reasoning-agent', 'risk-decision-ai'),
    ('ai-recipe-meal-planning-agent', 'risk-decision-ai'),
    ('ai-recruitment-agent-team', 'ai-hiring-assistant'),
    ('ai-referral-maximizer', 'ai-strategy-advisor'),
    ('ai-sales', 'ai-sales-email-writer'),
    ('ai-services-agency', 'ai-agency-builder-suite'),
    ('ai-signature', 'ai-content-creator-pro'),
    ('ai-skills-monetizer', 'daily-content-engine-ai'),
    ('ai-startup-insight-fire1-agent', 'ai-code-review-pro'),
    ('ai-startup-trend-analysis-agent', 'ai-bug-fixer'),
    ('ai-system-architect-r1', 'ai-fullstack-builder'),
    ('ai-teaching-agent-team', 'ai-course-creator-assistant'),
    ('ai-template-generator', 'ai-content-editor'),
    ('ai-tic-tac-toe-agent', 'github-repo-assistant'),
    ('ai-travel-agent-memory', 'build-plan-generator'),
    ('ai-travel-planner-mcp-agent-team', 'travel-planner-ai'),
    ('ai-video-image', 'ai-business-growth-consultant'),
    ('app', 'ai-design-studio'),
    ('autonomous-rag', 'landing-page-critic-ai'),
    ('blog-to-podcast-agent', 'dashboard-designer-ai'),
    ('chat-with-github', 'github-repo-assistant'),
    ('chat-with-gmail', 'gmail-intelligence-ai'),
    ('chat-with-pdf', 'pdf-business-assistant'),
    ('chat-with-research-papers', 'research-paper-assistant'),
    ('chat-with-substack', 'newsletter-repurposer-ai'),
    ('chat-with-tarots', 'academic-research-ai'),
    ('chat-with-youtube-videos', 'video-knowledge-assistant'),
    ('contextualai-rag-agent', 'market-research-ai'),
    ('corrective-rag', 'fact-check-ai'),
    ('cursor-ai-experiments', 'personal-ai-memory-assistant'),
    ('customer-support-voice-agent', 'local-business-voice-assistant'),
    ('deepseek-local-rag-agent', 'multi-ai-memory-hub'),
    ('devpulse-ai', 'personal-ai-memory-assistant'),
    ('frontend', 'private-chatgpt-clone'),
    ('funnelcraft-ai', 'launch-campaign-builder-ai'),
    ('github-mcp-agent', 'github-automation-agent'),
    ('hybrid-search-rag', 'smart-search-ai'),
    ('multimodal-coding-agent-team', 'ai-app-builder-assistant'),
    ('multimodal-design-agent-team', 'ai-design-studio'),
    ('openai-research-agent', 'research-assistant-ai'),
    ('personalizer-profile', 'ai-documentation-writer'),
    ('personalizer-recorder', 'blog-to-podcast-ai'),
    ('personalizer-url-video-generation', 'newsletter-repurposer-ai'),
    ('personalizer-video-image-transformer', 'youtube-repurposer-ai'),
    ('rag-as-a-service', 'business-knowledgebase-ai'),
    ('sales-assistant-app', 'ai-agency-builder-suite'),
    ('sales-page-builder', 'sales-call-follow-up-ai'),
    ('smart-crm-closer', 'ai-offer-decision-helper'),
    ('video-ai-editor', 'lead-research-scraper-ai'),
    ('web-scraping-ai-agent', 'lead-research-scraper-ai'),
    ('xai-finance-agent', 'finance-research-ai')
) AS src(old_slug, new_slug)
WHERE target.app_slug = src.old_slug;

-- 3g. agent_configurations
UPDATE agent_configurations AS target
SET app_slug = src.new_slug
FROM (
  VALUES
    ('1-starter-agent', 'ai-news-content-writer'),
    ('4-running-agents', 'ai-video-script-producer'),
    ('5-1-in-memory-conversation-agent', 'ai-music-jingle-assistant'),
    ('5-2-persistent-conversation-agent', 'ai-film-producer'),
    ('6-1-agent-lifecycle-callbacks', 'podcast-creator-ai'),
    ('6-2-ai-interaction-callbacks', 'news-to-podcast-ai'),
    ('6-3-tool-execution-callbacks', 'ai-voice-support-agent'),
    ('7-plugins', 'talk-to-your-business-ai'),
    ('7-sessions', 'ai-audio-guide-creator'),
    ('9-1-sequential-agent', 'ai-intake-voice-agent'),
    ('9-2-loop-agent', 'ai-dictation-assistant'),
    ('9-3-parallel-agent', 'business-knowledgebase-ai'),
    ('ag2-adaptive-research-team', 'pdf-business-assistant'),
    ('agentic-rag-embedding-gemma', 'research-paper-assistant'),
    ('agentic-rag-gpt5', 'codebase-chat-ai'),
    ('agentic-rag-with-reasoning', 'gmail-intelligence-ai'),
    ('ai-3dpygame-r1', 'video-knowledge-assistant'),
    ('ai-aqi-analysis-agent', 'blog-knowledge-search-ai'),
    ('ai-arxiv-agent-memory', 'research-memory-assistant'),
    ('ai-audio-tour-agent', 'ai-audio-guide-creator'),
    ('ai-blog-search', 'blog-knowledge-search-ai'),
    ('ai-breakup-recovery-agent', 'multimodal-knowledge-ai'),
    ('ai-chess-agent', 'ai-knowledgebase-debugger'),
    ('ai-competitor-intelligence-agent-team', 'competitor-spy-ai'),
    ('ai-customer-support-agent', 'home-renovation-visualizer-ai'),
    ('ai-data-analysis-agent', 'local-business-analytics-ai'),
    ('ai-data-visualisation-agent', 'local-tour-guide-ai'),
    ('ai-deep-research-agent', 'deep-research-pro'),
    ('ai-domain-deep-research-agent', 'local-business-growth-advisor'),
    ('ai-email-gtm-outreach-agent', 'candidate-outreach-ai'),
    ('ai-email-gtm-reachout-agent', 'candidate-outreach-ai'),
    ('ai-financial-coach-agent', 'profit-coach-ai'),
    ('ai-fraud-investigation-agent', 'fraud-investigation-assistant'),
    ('ai-game-design-agent-team', 'interview-summary-ai'),
    ('ai-health-fitness-agent', 'hiring-plan-builder'),
    ('ai-journalist-agent', 'ai-news-content-writer'),
    ('ai-legal-agent-team', 'contract-summary-ai'),
    ('ai-life-insurance-advisor-agent', 'ai-intake-voice-agent'),
    ('ai-medical-imaging-agent', 'investment-research-assistant'),
    ('ai-meeting-agent', 'startup-due-diligence-ai'),
    ('ai-meme-generator-agent-browseruse', 'revenue-data-analyst-ai'),
    ('ai-mental-wellbeing-agent', 'financial-dashboard-ai'),
    ('ai-movie-production-agent', 'ai-video-script-producer'),
    ('ai-music-generator-agent', 'ai-music-jingle-assistant'),
    ('ai-personal-finance-agent', 'policy-compliance-assistant'),
    ('ai-personalizedcontent', 'ai-sales-intelligence-pro'),
    ('ai-product-launch-intelligence-agent', 'launch-campaign-builder-ai'),
    ('ai-proposal', 'competitor-spy-ai'),
    ('ai-real-estate-agent-team', 'real-estate-marketing-ai'),
    ('ai-reasoning-agent', 'risk-decision-ai'),
    ('ai-recipe-meal-planning-agent', 'risk-decision-ai'),
    ('ai-recruitment-agent-team', 'ai-hiring-assistant'),
    ('ai-referral-maximizer', 'ai-strategy-advisor'),
    ('ai-sales', 'ai-sales-email-writer'),
    ('ai-services-agency', 'ai-agency-builder-suite'),
    ('ai-signature', 'ai-content-creator-pro'),
    ('ai-skills-monetizer', 'daily-content-engine-ai'),
    ('ai-startup-insight-fire1-agent', 'ai-code-review-pro'),
    ('ai-startup-trend-analysis-agent', 'ai-bug-fixer'),
    ('ai-system-architect-r1', 'ai-fullstack-builder'),
    ('ai-teaching-agent-team', 'ai-course-creator-assistant'),
    ('ai-template-generator', 'ai-content-editor'),
    ('ai-tic-tac-toe-agent', 'github-repo-assistant'),
    ('ai-travel-agent-memory', 'build-plan-generator'),
    ('ai-travel-planner-mcp-agent-team', 'travel-planner-ai'),
    ('ai-video-image', 'ai-business-growth-consultant'),
    ('app', 'ai-design-studio'),
    ('autonomous-rag', 'landing-page-critic-ai'),
    ('blog-to-podcast-agent', 'dashboard-designer-ai'),
    ('chat-with-github', 'github-repo-assistant'),
    ('chat-with-gmail', 'gmail-intelligence-ai'),
    ('chat-with-pdf', 'pdf-business-assistant'),
    ('chat-with-research-papers', 'research-paper-assistant'),
    ('chat-with-substack', 'newsletter-repurposer-ai'),
    ('chat-with-tarots', 'academic-research-ai'),
    ('chat-with-youtube-videos', 'video-knowledge-assistant'),
    ('contextualai-rag-agent', 'market-research-ai'),
    ('corrective-rag', 'fact-check-ai'),
    ('cursor-ai-experiments', 'personal-ai-memory-assistant'),
    ('customer-support-voice-agent', 'local-business-voice-assistant'),
    ('deepseek-local-rag-agent', 'multi-ai-memory-hub'),
    ('devpulse-ai', 'personal-ai-memory-assistant'),
    ('frontend', 'private-chatgpt-clone'),
    ('funnelcraft-ai', 'launch-campaign-builder-ai'),
    ('github-mcp-agent', 'github-automation-agent'),
    ('hybrid-search-rag', 'smart-search-ai'),
    ('multimodal-coding-agent-team', 'ai-app-builder-assistant'),
    ('multimodal-design-agent-team', 'ai-design-studio'),
    ('openai-research-agent', 'research-assistant-ai'),
    ('personalizer-profile', 'ai-documentation-writer'),
    ('personalizer-recorder', 'blog-to-podcast-ai'),
    ('personalizer-url-video-generation', 'newsletter-repurposer-ai'),
    ('personalizer-video-image-transformer', 'youtube-repurposer-ai'),
    ('rag-as-a-service', 'business-knowledgebase-ai'),
    ('sales-assistant-app', 'ai-agency-builder-suite'),
    ('sales-page-builder', 'sales-call-follow-up-ai'),
    ('smart-crm-closer', 'ai-offer-decision-helper'),
    ('video-ai-editor', 'lead-research-scraper-ai'),
    ('web-scraping-ai-agent', 'lead-research-scraper-ai'),
    ('xai-finance-agent', 'finance-research-ai')
) AS src(old_slug, new_slug)
WHERE target.app_slug = src.old_slug;

-- 3h. products_catalog.apps_granted (JSONB array)
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(
    CASE

      WHEN val #>> '{}' = '1-starter-agent' THEN '"ai-news-content-writer"'::jsonb

      WHEN val #>> '{}' = '4-running-agents' THEN '"ai-video-script-producer"'::jsonb

      WHEN val #>> '{}' = '5-1-in-memory-conversation-agent' THEN '"ai-music-jingle-assistant"'::jsonb

      WHEN val #>> '{}' = '5-2-persistent-conversation-agent' THEN '"ai-film-producer"'::jsonb

      WHEN val #>> '{}' = '6-1-agent-lifecycle-callbacks' THEN '"podcast-creator-ai"'::jsonb

      WHEN val #>> '{}' = '6-2-ai-interaction-callbacks' THEN '"news-to-podcast-ai"'::jsonb

      WHEN val #>> '{}' = '6-3-tool-execution-callbacks' THEN '"ai-voice-support-agent"'::jsonb

      WHEN val #>> '{}' = '7-plugins' THEN '"talk-to-your-business-ai"'::jsonb

      WHEN val #>> '{}' = '7-sessions' THEN '"ai-audio-guide-creator"'::jsonb

      WHEN val #>> '{}' = '9-1-sequential-agent' THEN '"ai-intake-voice-agent"'::jsonb

      WHEN val #>> '{}' = '9-2-loop-agent' THEN '"ai-dictation-assistant"'::jsonb

      WHEN val #>> '{}' = '9-3-parallel-agent' THEN '"business-knowledgebase-ai"'::jsonb

      WHEN val #>> '{}' = 'ag2-adaptive-research-team' THEN '"pdf-business-assistant"'::jsonb

      WHEN val #>> '{}' = 'agentic-rag-embedding-gemma' THEN '"research-paper-assistant"'::jsonb

      WHEN val #>> '{}' = 'agentic-rag-gpt5' THEN '"codebase-chat-ai"'::jsonb

      WHEN val #>> '{}' = 'agentic-rag-with-reasoning' THEN '"gmail-intelligence-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-3dpygame-r1' THEN '"video-knowledge-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-aqi-analysis-agent' THEN '"blog-knowledge-search-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-arxiv-agent-memory' THEN '"research-memory-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-audio-tour-agent' THEN '"ai-audio-guide-creator"'::jsonb

      WHEN val #>> '{}' = 'ai-blog-search' THEN '"blog-knowledge-search-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-breakup-recovery-agent' THEN '"multimodal-knowledge-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-chess-agent' THEN '"ai-knowledgebase-debugger"'::jsonb

      WHEN val #>> '{}' = 'ai-competitor-intelligence-agent-team' THEN '"competitor-spy-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-customer-support-agent' THEN '"home-renovation-visualizer-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-data-analysis-agent' THEN '"local-business-analytics-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-data-visualisation-agent' THEN '"local-tour-guide-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-deep-research-agent' THEN '"deep-research-pro"'::jsonb

      WHEN val #>> '{}' = 'ai-domain-deep-research-agent' THEN '"local-business-growth-advisor"'::jsonb

      WHEN val #>> '{}' = 'ai-email-gtm-outreach-agent' THEN '"candidate-outreach-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-email-gtm-reachout-agent' THEN '"candidate-outreach-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-financial-coach-agent' THEN '"profit-coach-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-fraud-investigation-agent' THEN '"fraud-investigation-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-game-design-agent-team' THEN '"interview-summary-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-health-fitness-agent' THEN '"hiring-plan-builder"'::jsonb

      WHEN val #>> '{}' = 'ai-journalist-agent' THEN '"ai-news-content-writer"'::jsonb

      WHEN val #>> '{}' = 'ai-legal-agent-team' THEN '"contract-summary-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-life-insurance-advisor-agent' THEN '"ai-intake-voice-agent"'::jsonb

      WHEN val #>> '{}' = 'ai-medical-imaging-agent' THEN '"investment-research-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-meeting-agent' THEN '"startup-due-diligence-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-meme-generator-agent-browseruse' THEN '"revenue-data-analyst-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-mental-wellbeing-agent' THEN '"financial-dashboard-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-movie-production-agent' THEN '"ai-video-script-producer"'::jsonb

      WHEN val #>> '{}' = 'ai-music-generator-agent' THEN '"ai-music-jingle-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-personal-finance-agent' THEN '"policy-compliance-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-personalizedcontent' THEN '"ai-sales-intelligence-pro"'::jsonb

      WHEN val #>> '{}' = 'ai-product-launch-intelligence-agent' THEN '"launch-campaign-builder-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-proposal' THEN '"competitor-spy-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-real-estate-agent-team' THEN '"real-estate-marketing-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-reasoning-agent' THEN '"risk-decision-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-recipe-meal-planning-agent' THEN '"risk-decision-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-recruitment-agent-team' THEN '"ai-hiring-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-referral-maximizer' THEN '"ai-strategy-advisor"'::jsonb

      WHEN val #>> '{}' = 'ai-sales' THEN '"ai-sales-email-writer"'::jsonb

      WHEN val #>> '{}' = 'ai-services-agency' THEN '"ai-agency-builder-suite"'::jsonb

      WHEN val #>> '{}' = 'ai-signature' THEN '"ai-content-creator-pro"'::jsonb

      WHEN val #>> '{}' = 'ai-skills-monetizer' THEN '"daily-content-engine-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-startup-insight-fire1-agent' THEN '"ai-code-review-pro"'::jsonb

      WHEN val #>> '{}' = 'ai-startup-trend-analysis-agent' THEN '"ai-bug-fixer"'::jsonb

      WHEN val #>> '{}' = 'ai-system-architect-r1' THEN '"ai-fullstack-builder"'::jsonb

      WHEN val #>> '{}' = 'ai-teaching-agent-team' THEN '"ai-course-creator-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-template-generator' THEN '"ai-content-editor"'::jsonb

      WHEN val #>> '{}' = 'ai-tic-tac-toe-agent' THEN '"github-repo-assistant"'::jsonb

      WHEN val #>> '{}' = 'ai-travel-agent-memory' THEN '"build-plan-generator"'::jsonb

      WHEN val #>> '{}' = 'ai-travel-planner-mcp-agent-team' THEN '"travel-planner-ai"'::jsonb

      WHEN val #>> '{}' = 'ai-video-image' THEN '"ai-business-growth-consultant"'::jsonb

      WHEN val #>> '{}' = 'app' THEN '"ai-design-studio"'::jsonb

      WHEN val #>> '{}' = 'autonomous-rag' THEN '"landing-page-critic-ai"'::jsonb

      WHEN val #>> '{}' = 'blog-to-podcast-agent' THEN '"dashboard-designer-ai"'::jsonb

      WHEN val #>> '{}' = 'chat-with-github' THEN '"github-repo-assistant"'::jsonb

      WHEN val #>> '{}' = 'chat-with-gmail' THEN '"gmail-intelligence-ai"'::jsonb

      WHEN val #>> '{}' = 'chat-with-pdf' THEN '"pdf-business-assistant"'::jsonb

      WHEN val #>> '{}' = 'chat-with-research-papers' THEN '"research-paper-assistant"'::jsonb

      WHEN val #>> '{}' = 'chat-with-substack' THEN '"newsletter-repurposer-ai"'::jsonb

      WHEN val #>> '{}' = 'chat-with-tarots' THEN '"academic-research-ai"'::jsonb

      WHEN val #>> '{}' = 'chat-with-youtube-videos' THEN '"video-knowledge-assistant"'::jsonb

      WHEN val #>> '{}' = 'contextualai-rag-agent' THEN '"market-research-ai"'::jsonb

      WHEN val #>> '{}' = 'corrective-rag' THEN '"fact-check-ai"'::jsonb

      WHEN val #>> '{}' = 'cursor-ai-experiments' THEN '"personal-ai-memory-assistant"'::jsonb

      WHEN val #>> '{}' = 'customer-support-voice-agent' THEN '"local-business-voice-assistant"'::jsonb

      WHEN val #>> '{}' = 'deepseek-local-rag-agent' THEN '"multi-ai-memory-hub"'::jsonb

      WHEN val #>> '{}' = 'devpulse-ai' THEN '"personal-ai-memory-assistant"'::jsonb

      WHEN val #>> '{}' = 'frontend' THEN '"private-chatgpt-clone"'::jsonb

      WHEN val #>> '{}' = 'funnelcraft-ai' THEN '"launch-campaign-builder-ai"'::jsonb

      WHEN val #>> '{}' = 'github-mcp-agent' THEN '"github-automation-agent"'::jsonb

      WHEN val #>> '{}' = 'hybrid-search-rag' THEN '"smart-search-ai"'::jsonb

      WHEN val #>> '{}' = 'multimodal-coding-agent-team' THEN '"ai-app-builder-assistant"'::jsonb

      WHEN val #>> '{}' = 'multimodal-design-agent-team' THEN '"ai-design-studio"'::jsonb

      WHEN val #>> '{}' = 'openai-research-agent' THEN '"research-assistant-ai"'::jsonb

      WHEN val #>> '{}' = 'personalizer-profile' THEN '"ai-documentation-writer"'::jsonb

      WHEN val #>> '{}' = 'personalizer-recorder' THEN '"blog-to-podcast-ai"'::jsonb

      WHEN val #>> '{}' = 'personalizer-url-video-generation' THEN '"newsletter-repurposer-ai"'::jsonb

      WHEN val #>> '{}' = 'personalizer-video-image-transformer' THEN '"youtube-repurposer-ai"'::jsonb

      WHEN val #>> '{}' = 'rag-as-a-service' THEN '"business-knowledgebase-ai"'::jsonb

      WHEN val #>> '{}' = 'sales-assistant-app' THEN '"ai-agency-builder-suite"'::jsonb

      WHEN val #>> '{}' = 'sales-page-builder' THEN '"sales-call-follow-up-ai"'::jsonb

      WHEN val #>> '{}' = 'smart-crm-closer' THEN '"ai-offer-decision-helper"'::jsonb

      WHEN val #>> '{}' = 'video-ai-editor' THEN '"lead-research-scraper-ai"'::jsonb

      WHEN val #>> '{}' = 'web-scraping-ai-agent' THEN '"lead-research-scraper-ai"'::jsonb

      WHEN val #>> '{}' = 'xai-finance-agent' THEN '"finance-research-ai"'::jsonb

      ELSE val
    END
  ), '[]'::jsonb)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(apps_granted) = 'array' THEN apps_granted ELSE '[]'::jsonb END
  ) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';

-- 3i. Remove duplicate entries from apps_granted arrays
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(DISTINCT val), '[]'::jsonb)
  FROM jsonb_array_elements_text(apps_granted) AS val
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';


-- =====================================================================
-- STEP 4: Remove overflow and extra apps (not in 95-app catalog)
-- =====================================================================

-- Delete references first
DELETE FROM user_app_access WHERE app_slug IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro');
DELETE FROM ai_app_usage WHERE app_slug IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro');
DELETE FROM app_usage_analytics WHERE app_slug IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro');
DELETE FROM app_tenants WHERE app_slug IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro');
DELETE FROM agent_executions WHERE app_slug IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro');
DELETE FROM agent_schedules WHERE app_slug IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro');
DELETE FROM agent_configurations WHERE app_slug IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro');

-- Clean up products_catalog.apps_granted arrays
UPDATE products_catalog
SET apps_granted = (
  SELECT COALESCE(jsonb_agg(val), '[]'::jsonb)
  FROM jsonb_array_elements_text(apps_granted) AS val
  WHERE val NOT IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro')
)
WHERE apps_granted IS NOT NULL AND jsonb_typeof(apps_granted) = 'array';

-- Finally, remove the app records themselves
DELETE FROM apps WHERE slug IN ('ai-personalized-content', 'ai-proposal-generator', 'ai-referral-maximizer-pro', 'ai-sales-maximizer', 'ai-screen-recorder', 'ai-signature-pro', 'ai-skills-monetizer-pro', 'ai-tool-router', 'ai-travel-agent', 'ai-video-image-pro', 'browser-task-agent', 'email-memory-assistant', 'gemini-agentic-rag', 'gpt-oss-critique-improvement-loop', 'local-ai-reasoning-agent-py', 'multi-ai-memory', 'multi-mcp-agent-router', 'multimodal-ai-agent', 'music-generator-agent-py', 'notion-workspace-ai', 'personalizer-profile-generator', 'personalizer-transformer', 'personalizer-url-templates', 'product-launch-intelligence-agent', 'qwen-local-rag', 'rag-database-routing', 'research-agent-gemini-interaction-api', 'resume-job-matcher', 'sales-assistant-platform', 'sales-page-builder-pro', 'smart-crm-closer-pro', 'startup-trends-agent', 'toonify-token-optimization', 'travel-concierge-ai', 'trust-gated-agent-team', 'video-ai-editor-pro');


-- =====================================================================
-- STEP 5: Add new apps that were missing from the database
-- =====================================================================


INSERT INTO apps (slug, name, description, category, is_active, is_featured, is_public, sort_order)
VALUES
  ('visual-document-ai', 'Visual Document AI', 'Analyze and extract insights from visual documents with AI.', 'rag-knowledgebase', true, false, true, 0),
  ('citation-knowledgebase-ai', 'Citation Knowledgebase AI', 'Build knowledge bases with proper citations and source tracking.', 'rag-knowledgebase', true, false, true, 0),
  ('private-company-ai-assistant', 'Private Company AI Assistant', 'Private AI assistant for your company''s internal data.', 'rag-knowledgebase', true, false, true, 0),
  ('resume-analyzer-ai', 'Resume Analyzer AI', 'Analyze and optimize resumes with AI-powered insights.', 'hr-recruiting', true, false, true, 0),
  ('candidate-decision-ai', 'Candidate Decision AI', 'Make better hiring decisions with AI-powered candidate analysis.', 'hr-recruiting', true, false, true, 0),
  ('business-finance-ai-team', 'Business Finance AI Team', 'Comprehensive AI team for business financial analysis.', 'finance-business', true, false, true, 0),
  ('legal-pdf-explainer', 'Legal PDF Explainer', 'Explain and analyze legal PDF documents with AI.', 'legal-compliance', true, false, true, 0),
  ('claim-checker-ai', 'Claim Checker AI', 'Verify and check claims with AI-powered fact analysis.', 'legal-compliance', true, false, true, 0),
  ('ai-saas-architect', 'AI SaaS Architect', 'Architect and design SaaS applications with AI.', 'coding-developer', true, false, true, 0),
  ('python-fixer-ai', 'Python Fixer AI', 'Fix and debug Python code with AI-powered analysis.', 'coding-developer', true, false, true, 0),
  ('sprint-planner-ai', 'Sprint Planner AI', 'Plan and manage sprints with AI-powered project management.', 'coding-developer', true, false, true, 0),
  ('ai-ux-designer', 'AI UX Designer', 'Design exceptional user experiences with AI.', 'design-uiux', true, false, true, 0),
  ('landing-page-copy-ai', 'Landing Page Copy AI', 'Create high-converting landing page copy with AI.', 'content-creation', true, false, true, 0),
  ('conversion-copy-editor', 'Conversion Copy Editor', 'Edit and optimize copy for maximum conversion rates.', 'content-creation', true, false, true, 0),
  ('research-planner-ai', 'Research Planner AI', 'Plan and execute comprehensive research projects with AI.', 'research-education', true, false, true, 0),
  ('private-ai-chat-with-memory', 'Private AI Chat With Memory', 'Private AI chat with persistent memory capabilities.', 'productivity-personal', true, false, true, 0)
ON CONFLICT (slug) DO NOTHING;


-- =====================================================================
-- STEP 6: Set sort_order based on the 95-app catalog order
-- =====================================================================


UPDATE apps AS target
SET sort_order = src.new_order
FROM (
  VALUES
  ('ai-sales-intelligence-pro', 0),
  ('lead-research-scraper-ai', 1),
  ('ai-business-growth-consultant', 2),
  ('ai-strategy-advisor', 3),
  ('ai-sales-email-writer', 4),
  ('ai-offer-decision-helper', 5),
  ('launch-campaign-builder-ai', 6),
  ('competitor-spy-ai', 7),
  ('ai-agency-builder-suite', 8),
  ('sales-call-follow-up-ai', 9),
  ('blog-to-podcast-ai', 10),
  ('daily-content-engine-ai', 11),
  ('ai-content-creator-pro', 12),
  ('ai-content-editor', 13),
  ('ai-documentation-writer', 14),
  ('youtube-repurposer-ai', 15),
  ('newsletter-repurposer-ai', 16),
  ('ai-news-content-writer', 17),
  ('ai-video-script-producer', 18),
  ('ai-music-jingle-assistant', 19),
  ('ai-film-producer', 20),
  ('podcast-creator-ai', 21),
  ('news-to-podcast-ai', 22),
  ('ai-voice-support-agent', 23),
  ('talk-to-your-business-ai', 24),
  ('ai-audio-guide-creator', 25),
  ('ai-intake-voice-agent', 26),
  ('ai-dictation-assistant', 27),
  ('business-knowledgebase-ai', 28),
  ('pdf-business-assistant', 29),
  ('research-paper-assistant', 30),
  ('codebase-chat-ai', 31),
  ('gmail-intelligence-ai', 32),
  ('video-knowledge-assistant', 33),
  ('blog-knowledge-search-ai', 34),
  ('visual-document-ai', 35),
  ('citation-knowledgebase-ai', 36),
  ('smart-search-ai', 37),
  ('private-company-ai-assistant', 38),
  ('multimodal-knowledge-ai', 39),
  ('ai-knowledgebase-debugger', 40),
  ('real-estate-marketing-ai', 41),
  ('home-renovation-visualizer-ai', 42),
  ('travel-planner-ai', 43),
  ('local-tour-guide-ai', 44),
  ('local-business-voice-assistant', 45),
  ('local-business-growth-advisor', 46),
  ('local-business-analytics-ai', 47),
  ('ai-hiring-assistant', 48),
  ('resume-analyzer-ai', 49),
  ('candidate-decision-ai', 50),
  ('candidate-outreach-ai', 51),
  ('interview-summary-ai', 52),
  ('hiring-plan-builder', 53),
  ('finance-research-ai', 54),
  ('business-finance-ai-team', 55),
  ('profit-coach-ai', 56),
  ('investment-research-assistant', 57),
  ('startup-due-diligence-ai', 58),
  ('revenue-data-analyst-ai', 59),
  ('financial-dashboard-ai', 60),
  ('contract-summary-ai', 61),
  ('legal-pdf-explainer', 62),
  ('policy-compliance-assistant', 63),
  ('claim-checker-ai', 64),
  ('fraud-investigation-assistant', 65),
  ('risk-decision-ai', 66),
  ('ai-app-builder-assistant', 67),
  ('ai-saas-architect', 68),
  ('ai-code-review-pro', 69),
  ('ai-bug-fixer', 70),
  ('ai-fullstack-builder', 71),
  ('python-fixer-ai', 72),
  ('github-repo-assistant', 73),
  ('github-automation-agent', 74),
  ('build-plan-generator', 75),
  ('sprint-planner-ai', 76),
  ('ai-design-studio', 77),
  ('landing-page-critic-ai', 78),
  ('ai-ux-designer', 79),
  ('dashboard-designer-ai', 80),
  ('landing-page-copy-ai', 81),
  ('conversion-copy-editor', 82),
  ('research-assistant-ai', 83),
  ('deep-research-pro', 84),
  ('research-planner-ai', 85),
  ('ai-course-creator-assistant', 86),
  ('academic-research-ai', 87),
  ('market-research-ai', 88),
  ('fact-check-ai', 89),
  ('research-memory-assistant', 90),
  ('personal-ai-memory-assistant', 91),
  ('multi-ai-memory-hub', 92),
  ('private-ai-chat-with-memory', 93),
  ('private-chatgpt-clone', 94)
) AS src(slug, new_order)
WHERE target.slug = src.slug;


-- =====================================================================
-- STEP 7: Sync app display names with the VideoRemix catalog
-- =====================================================================


UPDATE apps AS target
SET name = src.name
FROM (
  VALUES
  ('ai-sales-intelligence-pro', 'AI Sales Intelligence Pro'),
  ('lead-research-scraper-ai', 'Lead Research Scraper AI'),
  ('ai-business-growth-consultant', 'AI Business Growth Consultant'),
  ('ai-strategy-advisor', 'AI Strategy Advisor'),
  ('ai-sales-email-writer', 'AI Sales Email Writer'),
  ('ai-offer-decision-helper', 'AI Offer Decision Helper'),
  ('launch-campaign-builder-ai', 'Launch Campaign Builder AI'),
  ('competitor-spy-ai', 'Competitor Spy AI'),
  ('ai-agency-builder-suite', 'AI Agency Builder Suite'),
  ('sales-call-follow-up-ai', 'Sales Call Follow-Up AI'),
  ('blog-to-podcast-ai', 'Blog To Podcast AI'),
  ('daily-content-engine-ai', 'Daily Content Engine AI'),
  ('ai-content-creator-pro', 'AI Content Creator Pro'),
  ('ai-content-editor', 'AI Content Editor'),
  ('ai-documentation-writer', 'AI Documentation Writer'),
  ('youtube-repurposer-ai', 'YouTube Repurposer AI'),
  ('newsletter-repurposer-ai', 'Newsletter Repurposer AI'),
  ('ai-news-content-writer', 'AI News Content Writer'),
  ('ai-video-script-producer', 'AI Video Script Producer'),
  ('ai-music-jingle-assistant', 'AI Music & Jingle Assistant'),
  ('ai-film-producer', 'AI Film Producer'),
  ('podcast-creator-ai', 'Podcast Creator AI'),
  ('news-to-podcast-ai', 'News-To-Podcast AI'),
  ('ai-voice-support-agent', 'AI Voice Support Agent'),
  ('talk-to-your-business-ai', 'Talk To Your Business AI'),
  ('ai-audio-guide-creator', 'AI Audio Guide Creator'),
  ('ai-intake-voice-agent', 'AI Intake Voice Agent'),
  ('ai-dictation-assistant', 'AI Dictation Assistant'),
  ('business-knowledgebase-ai', 'Business Knowledgebase AI'),
  ('pdf-business-assistant', 'PDF Business Assistant'),
  ('research-paper-assistant', 'Research Paper Assistant'),
  ('codebase-chat-ai', 'Codebase Chat AI'),
  ('gmail-intelligence-ai', 'Gmail Intelligence AI'),
  ('video-knowledge-assistant', 'Video Knowledge Assistant'),
  ('blog-knowledge-search-ai', 'Blog Knowledge Search AI'),
  ('visual-document-ai', 'Visual Document AI'),
  ('citation-knowledgebase-ai', 'Citation Knowledgebase AI'),
  ('smart-search-ai', 'Smart Search AI'),
  ('private-company-ai-assistant', 'Private Company AI Assistant'),
  ('multimodal-knowledge-ai', 'Multimodal Knowledge AI'),
  ('ai-knowledgebase-debugger', 'AI Knowledgebase Debugger'),
  ('real-estate-marketing-ai', 'Real Estate Marketing AI'),
  ('home-renovation-visualizer-ai', 'Home Renovation Visualizer AI'),
  ('travel-planner-ai', 'Travel Planner AI'),
  ('local-tour-guide-ai', 'Local Tour Guide AI'),
  ('local-business-voice-assistant', 'Local Business Voice Assistant'),
  ('local-business-growth-advisor', 'Local Business Growth Advisor'),
  ('local-business-analytics-ai', 'Local Business Analytics AI'),
  ('ai-hiring-assistant', 'AI Hiring Assistant'),
  ('resume-analyzer-ai', 'Resume Analyzer AI'),
  ('candidate-decision-ai', 'Candidate Decision AI'),
  ('candidate-outreach-ai', 'Candidate Outreach AI'),
  ('interview-summary-ai', 'Interview Summary AI'),
  ('hiring-plan-builder', 'Hiring Plan Builder'),
  ('finance-research-ai', 'Finance Research AI'),
  ('business-finance-ai-team', 'Business Finance AI Team'),
  ('profit-coach-ai', 'Profit Coach AI'),
  ('investment-research-assistant', 'Investment Research Assistant'),
  ('startup-due-diligence-ai', 'Startup Due Diligence AI'),
  ('revenue-data-analyst-ai', 'Revenue Data Analyst AI'),
  ('financial-dashboard-ai', 'Financial Dashboard AI'),
  ('contract-summary-ai', 'Contract Summary AI'),
  ('legal-pdf-explainer', 'Legal PDF Explainer'),
  ('policy-compliance-assistant', 'Policy & Compliance Assistant'),
  ('claim-checker-ai', 'Claim Checker AI'),
  ('fraud-investigation-assistant', 'Fraud Investigation Assistant'),
  ('risk-decision-ai', 'Risk Decision AI'),
  ('ai-app-builder-assistant', 'AI App Builder Assistant'),
  ('ai-saas-architect', 'AI SaaS Architect'),
  ('ai-code-review-pro', 'AI Code Review Pro'),
  ('ai-bug-fixer', 'AI Bug Fixer'),
  ('ai-fullstack-builder', 'AI Fullstack Builder'),
  ('python-fixer-ai', 'Python Fixer AI'),
  ('github-repo-assistant', 'GitHub Repo Assistant'),
  ('github-automation-agent', 'GitHub Automation Agent'),
  ('build-plan-generator', 'Build Plan Generator'),
  ('sprint-planner-ai', 'Sprint Planner AI'),
  ('ai-design-studio', 'AI Design Studio'),
  ('landing-page-critic-ai', 'Landing Page Critic AI'),
  ('ai-ux-designer', 'AI UX Designer'),
  ('dashboard-designer-ai', 'Dashboard Designer AI'),
  ('landing-page-copy-ai', 'Landing Page Copy AI'),
  ('conversion-copy-editor', 'Conversion Copy Editor'),
  ('research-assistant-ai', 'Research Assistant AI'),
  ('deep-research-pro', 'Deep Research Pro'),
  ('research-planner-ai', 'Research Planner AI'),
  ('ai-course-creator-assistant', 'AI Course Creator Assistant'),
  ('academic-research-ai', 'Academic Research AI'),
  ('market-research-ai', 'Market Research AI'),
  ('fact-check-ai', 'Fact Check AI'),
  ('research-memory-assistant', 'Research Memory Assistant'),
  ('personal-ai-memory-assistant', 'Personal AI Memory Assistant'),
  ('multi-ai-memory-hub', 'Multi-AI Memory Hub'),
  ('private-ai-chat-with-memory', 'Private AI Chat With Memory'),
  ('private-chatgpt-clone', 'Private ChatGPT Clone')
) AS src(slug, name)
WHERE target.slug = src.slug;


-- =====================================================================
-- VERIFICATION
-- =====================================================================

DO $$
DECLARE
  app_count integer;
  expected_count integer := 95;
  orphan_access integer;
  overflow_remaining integer;
BEGIN
  -- Count apps
  SELECT COUNT(*) INTO app_count FROM apps;
  RAISE NOTICE 'Total apps in table: % (expected: %)', app_count, expected_count;

  -- Check for orphaned user_app_access records
  SELECT COUNT(*) INTO orphan_access
  FROM user_app_access uaa
  WHERE NOT EXISTS (SELECT 1 FROM apps WHERE apps.slug = uaa.app_slug);
  IF orphan_access > 0 THEN
    RAISE WARNING 'Found % orphaned user_app_access records!', orphan_access;
  ELSE
    RAISE NOTICE 'No orphaned user_app_access records.';
  END IF;

  -- Check for remaining overflow apps
  SELECT COUNT(*) INTO overflow_remaining
  FROM apps
  WHERE slug IN ('travel-concierge-ai', 'browser-task-agent', 'ai-tool-router',
                 'ai-personalized-content', 'ai-referral-maximizer-pro');
  IF overflow_remaining > 0 THEN
    RAISE WARNING 'Found % overflow apps still in table!', overflow_remaining;
  ELSE
    RAISE NOTICE 'All overflow apps removed.';
  END IF;

  RAISE NOTICE 'Migration complete!';
END $$;

COMMIT;

-- =====================================================================
-- POST-MIGRATION: Clean up backup tables (run manually after verifying)
-- =====================================================================
-- DROP TABLE IF EXISTS _migration_backup_apps_20260603;
-- DROP TABLE IF EXISTS _migration_backup_user_app_access_20260603;
-- DROP TABLE IF EXISTS _migration_backup_ai_app_usage_20260603;
-- DROP TABLE IF EXISTS _migration_backup_app_tenants_20260603;
