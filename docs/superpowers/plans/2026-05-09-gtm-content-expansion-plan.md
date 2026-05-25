# GTM Content Expansion on App Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline expansion to app cards in the Personalization Tools section that reveals full GTM content when clicked. Multiple cards can be expanded simultaneously.

**Architecture:** Add `expandedApps` state to track expanded card IDs. Wrap card content with click handler to toggle expansion. Conditionally render GTM content below existing card content when expanded.

**Tech Stack:** React, TypeScript, framer-motion, Tailwind CSS

---

## File Structure

| File | Change |
|------|--------|
| `src/components/AppGallerySection.tsx` | Add expansion state, click handlers, GTM content rendering |

---

## Implementation Tasks

### Task 1: Add State for Expanded Apps

**Files:**
- Modify: `src/components/AppGallerySection.tsx` (add import and state)

- [ ] **Step 1: Add import for Set type and gtmContent**

Find line 1 (import React) and add `useState` to it (it should already be there). Then add gtmContent import after line 30 (other imports):

```typescript
import { gtmContent } from "../data/gtmContent";
```

- [ ] **Step 2: Find state declarations and add expandedApps state**

Around line 140-160, find where `useState` is used. Add the new state after existing state declarations:

```typescript
const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
```

- [ ] **Step 3: Add toggle function for expanded apps**

After the state declarations, add this function:

```typescript
const toggleAppExpansion = (appId: string) => {
  setExpandedApps((prev) => {
    const next = new Set(prev);
    if (next.has(appId)) {
      next.delete(appId);
    } else {
      next.add(appId);
    }
    return next;
  });
};
```

- [ ] **Step 4: Run typecheck**

Run: `cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af && npx -p typescript tsc --noEmit --skipLibCheck src/components/AppGallerySection.tsx 2>&1 | head -20`
Expected: No errors related to the new state or import

---

### Task 2: Make Card Clickable and Toggle Expansion

**Files:**
- Modify: `src/components/AppGallerySection.tsx` (around lines 942-952)

The grid card starts at line 942 with `<motion.div`. We need to:
1. Make the outer div clickable (not just the link inside)
2. Call `toggleAppExpansion` when clicked

- [ ] **Step 1: Add onClick to outer motion.div**

Find the motion.div at line 942 (starts with `variants={itemVariants}`) and add onClick handler:

Change:
```typescript
<motion.div
  key={app.id}
  variants={itemVariants}
  className={`relative ${
    viewMode === "grid"
      ? "group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors shadow-lg"
      : "flex bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors shadow-lg"
  }`}
  onMouseEnter={() => Analytics.trackCardHover(app.id, hasAccessToApp(app.id))}
  onClick={() => Analytics.trackCardClick(app.id, hasAccessToApp(app.id))}
>
```

To:
```typescript
<motion.div
  key={app.id}
  variants={itemVariants}
  className={`relative cursor-pointer ${
    viewMode === "grid"
      ? "group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors shadow-lg"
      : "flex bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors shadow-lg"
  } ${expandedApps.has(app.id) ? "border-primary-500" : ""}`}
  onMouseEnter={() => Analytics.trackCardHover(app.id, hasAccessToApp(app.id))}
  onClick={() => {
    Analytics.trackCardClick(app.id, hasAccessToApp(app.id));
    toggleAppExpansion(app.id);
  }}
>
```

- [ ] **Step 2: Verify the change looks correct**

Read lines 940-960 to confirm the edit was applied correctly.

---

### Task 3: Render GTM Content When Expanded

**Files:**
- Modify: `src/components/AppGallerySection.tsx` (after line 1105 where the card content ends)

Find where the card closes (around line 1106 `</motion.div>` for the grid card). We need to add expanded content before the closing tag.

- [ ] **Step 1: Find the closing tag of the card content**

Read lines 1100-1115 to find where the card's content div ends and the motion.div closes.

- [ ] **Step 2: Add expanded GTM content rendering**

Before line 1106 (the closing `</motion.div>`), add this block:

```tsx
{/* GTM Content Expansion */}
{expandedApps.has(app.id) && gtmContent[app.group] && (
  <div className="px-4 pb-4 border-t border-gray-700 mt-2 pt-3">
    <div className="text-xs text-gray-400 mb-2 flex items-center">
      <Sparkles className="h-3 w-3 mr-1 text-primary-400" />
      Go-to-Market Information
    </div>
    
    {/* Target Audience */}
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Target Audience</div>
      <div className="text-sm text-gray-200">{gtmContent[app.group].targetAudience}</div>
    </div>
    
    {/* Value Proposition */}
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Value Proposition</div>
      <div className="text-sm text-gray-200">{gtmContent[app.group].valueProposition}</div>
    </div>
    
    {/* Use Cases */}
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Use Cases</div>
      <ul className="text-sm text-gray-200 space-y-1">
        {gtmContent[app.group].useCases.map((useCase, idx) => (
          <li key={idx} className="flex items-start">
            <span className="text-primary-400 mr-2">•</span>
            {useCase}
          </li>
        ))}
      </ul>
    </div>
    
    {/* Competitive Differentiation */}
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Competitive Difference</div>
      <div className="text-sm text-gray-200">{gtmContent[app.group].competitiveDiff}</div>
    </div>
    
    {/* Pricing Rationale */}
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Pricing</div>
      <div className="text-sm text-gray-200">{gtmContent[app.group].pricingRationale}</div>
    </div>
    
    {/* Integration Points */}
    <div className="mb-3">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Integrations</div>
      <div className="text-sm text-gray-200">{gtmContent[app.group].integrationPoints.join(", ")}</div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Verify the GTM import is present**

Check line 31 or wherever imports end to confirm `gtmContent` import exists.

- [ ] **Step 4: Run typecheck**

Run: `cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af && npx -p typescript tsc --noEmit --skipLibCheck src/components/AppGallerySection.tsx 2>&1 | head -30`
Expected: No new errors

---

### Task 4: Run Lint and Typecheck

**Files:**
- All modified files

- [ ] **Step 1: Run typecheck**

Run: `cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af && npm run typecheck 2>&1 | head -30`
Expected: PASS or only pre-existing errors

- [ ] **Step 2: Run lint**

Run: `cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af && npm run lint 2>&1 | head -30`
Expected: PASS or auto-fixable issues

---

### Task 5: Commit Changes

- [ ] **Step 1: Stage changes**

```bash
cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af
git add src/components/AppGallerySection.tsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add GTM content expansion on app card click

- Add expandedApps state to track expanded card IDs
- Make card clickable to toggle expansion
- Render full GTM content when card is expanded
- Multiple cards can be expanded simultaneously
- Add visual indicator (border highlight) for expanded cards"
```

---

## Success Criteria

- [ ] Clicking a card toggles expansion showing GTM content
- [ ] Multiple cards can be expanded at once
- [ ] GTM content displays all fields: targetAudience, valueProposition, useCases, competitiveDiff, pricingRationale, integrationPoints
- [ ] Expanded cards have visual indicator (border color change)
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] No regressions to existing functionality