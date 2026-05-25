# Design: Complete Unfinished Commit Work

**Date**: 2026-05-08  
**Commits Addressed**: f4e9cb3, 5897026, fe3f3e7  
**Status**: Draft

## Problem Statement

Three recent commits were left incomplete/partially complete:

1. **f4e9cb3** (fix: resolve Supabase local dev and dashboard errors)
   - Uses production Supabase keys instead of local
   - Missing `BusinessAIAppLibrarySection.tsx` component (causes build failure)
   - Devcontainer `portsAttributes` still references port 3000

2. **5897026** (chore: Improve bundle chunking and document remaining optimizations)
   - Lucide React bundle still 587KB (needs individual icon imports)
   - Build fails due to missing component
   - Tests failing (ESM/CJS issues with vitest + Node 18)

3. **fe3f3e7** (chore: Update dependencies to latest minor/patch versions)
   - Vite downgraded from 7→5 (to support Node 18)
   - Devcontainer specifies Node 20, but runtime uses Node 18
   - Package.json shows `vite: "^5.4.21"` instead of `^7.x`

## Decision: Node 20 + Vite 7

**Rationale**: The devcontainer already specifies Node 20. The downgrade to Vite 5 was a workaround, not a solution. We will:
- Use Node 20 (already in devcontainer config)
- Restore Vite 7 + @vitejs/plugin-react@5
- Fix the test ESM issues by upgrading to Node 20

## Design

### 1. Fix Missing Component (f4e9cb3)

**Issue**: `BusinessAIAppLibrarySection.tsx` was imported in `LandingPage.tsx` (commit f4e9cb3) but the file doesn't exist.

**Solution**: Create the missing component as a lazy-loaded section in LandingPage.

**Implementation**:
- Create `src/components/BusinessAIAppLibrarySection.tsx`
- Simple section component with heading and placeholder content
- Import via `React.lazy()` in LandingPage (already set up in commit)

### 2. Fix Lucide Imports (5897026)

**Issue**: Full lucide-react library import (~587KB) instead of individual icons.

**Current imports pattern**:
```typescript
import { X, Star, CheckCircle } from 'lucide-react';
```

**Solution**: Replace with individual icon imports from `lucide-react/dist/esm/icons/`

**Files to update** (identified via grep):
- `src/components/ProductDetailModal.tsx`
- `src/components/premium/InteractiveComparisonTable.tsx`
- `src/components/premium/ROICalculator.tsx`
- `src/components/premium/AnimatedTestimonialCard.tsx`
- `src/components/premium/LiveActivityFeed.tsx`
- `src/components/premium/PersonalizationSimulator.tsx`
- `src/components/premium/ExitIntentPopup.tsx`
- `src/components/premium/BackToTop.tsx`
- `src/components/premium/StickyWidget.tsx`
- `src/components/AnalyticsDashboard.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/LandingPage.tsx`
- (any other files importing from 'lucide-react')

**Example transformation**:
```typescript
// Before:
import { X, Star, CheckCircle } from 'lucide-react';

// After:
import X from 'lucide-react/dist/esm/icons/x.js';
import Star from 'lucide-react/dist/esm/icons/star.js';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle.js';
```

### 3. Upgrade Node 20 + Vite 7 (fe3f3e7)

**Issue**: Vite was downgraded to 5 to support Node 18, but devcontainer specifies Node 20.

**Solution**:
- Restore `vite: "^7.1.12"` in package.json
- Restore `@vitejs/plugin-react: "^5.1.0"` in package.json
- Ensure devcontainer Node 20 is active (may need rebuild)
- Update vitest to compatible version

**Commands**:
```bash
npm install vite@^7 @vitejs/plugin-react@^5 --save-dev
```

### 4. Fix Devcontainer Config (f4e9cb3)

**Issue**: `portsAttributes` still references port 3000 (old Vite port).

**Solution**: Update `.devcontainer/devcontainer.json` to reference port 8080.

**Current**:
```json
"3000": {
  "label": "Vite Dev Server",
  "visibility": "public"
}
```

**Fixed**:
```json
"8080": {
  "label": "Vite Dev Server",
  "visibility": "public"
}
```

### 5. Fix Test Failures (5897026)

**Issue**: Tests failing with `ERR_REQUIRE_ESM` errors (Node 18 + vitest + ESM modules).

**Root cause**: Some dependencies require ESM support that Node 18 handles differently.

**Solution**: Upgrading to Node 20 should resolve most ESM issues. If tests still fail:
- Check vitest config for ESM compatibility settings
- May need to update vitest to latest version

### 6. Environment Strategy (f4e9cb3)

**Decision**: Keep production Supabase keys in `.env` for now.

**Rationale**:
- Local Supabase instance is not running
- Production keys allow login to work
- For local development, user can run `supabase start` and use `setup-env.sh`

**Future**: When local Supabase is needed, run:
```bash
supabase start
./setup-env.sh
```

## Success Criteria

1. ✅ Build succeeds (`npm run build` completes without errors)
2. ✅ Dev server starts on port 8080 (`npm run dev`)
3. ✅ Lucide bundle size reduced (check with `npm run build -- --analyze`)
4. ✅ Tests pass (`npm test`)
5. ✅ BusinessAIAppLibrarySection renders on LandingPage
6. ✅ Vite 7+ running (check `npm list vite`)
7. ✅ Node 20 active (check `node --version`)

## Out of Scope

- Configuring Sentry DSN (mentioned in PRODUCTION_READINESS.md but separate concern)
- Adding Playwright E2E tests (separate initiative)
- Image optimization (separate initiative)
- Accessibility audit (separate initiative)

## Files Modified

1. `src/components/BusinessAIAppLibrarySection.tsx` (NEW)
2. `src/pages/LandingPage.tsx` (verify lazy import)
3. All files importing from 'lucide-react' (update imports)
4. `package.json` (Vite 7, plugin-react 5)
5. `.devcontainer/devcontainer.json` (port 8080 in portsAttributes)
6. `vite.config.ts` (verify Vite 7 compatibility)

## Verification

After implementation:
```bash
npm run validate-env  # Check environment
npm run dev          # Start dev server (should work on 8080)
npm run build        # Verify build succeeds
npm test            # Verify tests pass
```
