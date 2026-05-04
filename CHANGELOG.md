# Changelog

## [Unreleased]

### Added
- **OpenAI Migration Documentation Updates** — Comprehensive documentation updates to reflect Phase 3 OpenAI migration completion (2026-05-03):
  - Updated main READMEs (awesome-llm-apps, awesome-llm-apps-repo) to reflect OpenAI-first architecture (95%+ apps migrated)
  - Updated backend function inventory with AI provider mappings and migration status
  - Updated superpowers specification documents (ConsultPro AI, LaunchRocket AI, SalesForce AI) to reflect OpenAI GPT-4o migration
  - Updated environment configuration examples (.env.example) to prioritize OPENAI_API_KEY
  - Added migration notes to remaining specialized provider integrations (Gemini Vision, xAI, local LLMs)
- Comprehensive testing scripts for authentication, superpowers verification, and production validation
  - `browser-user-testing.mjs`: Browser-based user flow testing for authentication pages
  - `count-supabase-users.mjs`: Script to count and verify user registrations in Supabase
  - `count_roles.js`: Role counting utility
  - `debug-failures.mjs`: Debugging script for test failures
  - `final-production-validation.mjs`: Production environment validation
  - `final-superpowers-verification.mjs`: Verification of superpowers features
  - `final-user-email-verification.mjs`: Email verification testing
  - `get-test-users.mjs`: Test user data retrieval
  - `multi-phase-production-testing.mjs`: Multi-phase production testing suite
  - `playwright-user-testing.mjs`: Playwright-based user interface testing
  - `superpowers-auth-testing.mjs`: Authentication testing for superpowers
  - `verify-user-connections.mjs`: User connection verification

### Fixed
- Lint error in `generate-new.ts`: Changed `let timestamp` to `const timestamp`