# Changelog

## [Unreleased]

### Added
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