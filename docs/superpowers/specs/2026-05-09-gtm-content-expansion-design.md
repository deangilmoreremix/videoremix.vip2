# GTM Content Expansion on App Cards Design Spec

> **Date:** 2026-05-09
> **Status:** Approved

## Goal
Add inline expansion to app cards in the Personalization Tools section that reveals full GTM content when clicked. Multiple cards can be expanded simultaneously.

## Changes

### 1. Component Changes (`src/components/AppGallerySection.tsx`)

**State Management:**
- Add `expandedApps: Set<string>` state to track expanded app IDs
- Toggle app ID in set when card is clicked

**Card Interaction:**
- Make entire card wrapper div clickable (toggle expansion)
- Show visual indicator that card is expandable (cursor pointer, subtle border change on hover)

**Expanded Content Rendering:**
- Conditionally render GTM content below existing card content when expanded
- Smooth height animation (300ms ease-out)

### 2. GTM Content Integration

**Import:**
```typescript
import { gtmContent } from "../../data/gtmContent";
```

**Lookup:**
- Look up content by `app.group` field
- Guard against missing GTM content (show nothing if group not found)

### 3. UI Layout for Expanded State

```
┌─────────────────────────────────────┐
│ [Collapsed App Card - existing]     │
├─────────────────────────────────────┤
│ EXPANDED CONTENT                    │
│                                     │
│ Target Audience:                    │
│ [badge with audience description]   │
│                                     │
│ Value Proposition:                  │
│ [text]                              │
│                                     │
│ Use Cases:                          │
│ • [bullet 1]                        │
│ • [bullet 2]                        │
│ • [bullet 3]                        │
│ • [bullet 4]                        │
│                                     │
│ Competitive Difference:             │
│ [text]                              │
│                                     │
│ Pricing Rationale:                  │
│ [text]                              │
│                                     │
│ Integration Points:                 │
│ [text]                              │
└─────────────────────────────────────┘
```

### 4. Styling

- Expanded section uses `bg-gray-800` background with slight transparency
- Border highlight on expanded cards (e.g., `border-primary-500`)
- Smooth CSS transition for expand/collapse
- Typography: smaller text for GTM content (text-sm)
- Section headers in muted gray (`text-gray-400`)
- Content text in light gray (`text-gray-200`)

### 5. Implementation Details

**File:** `src/components/AppGallerySection.tsx`

**Steps:**
1. Add `useState` import if not present
2. Add `expandedApps` state after existing state declarations
3. Add click handler to card wrapper that toggles app ID in `expandedApps`
4. Import `gtmContent` from data file
5. Add conditional rendering block for expanded content after existing card content
6. Add CSS classes for expanded state styling

### 6. Files Modified

| File | Change |
|------|--------|
| `src/components/AppGallerySection.tsx` | Add expansion state, click handler, GTM content rendering |

### 7. Dependencies

- Existing: `gtmContent.ts` (already has all group data)
- Existing: `app.group` field on each app (already populated)

## Out of Scope

- Stripe/pricing tabbed interface (separate feature)
- Navigation to detail pages
- Modal-based expansion