# Design Spec: 12-Group App Categorization with GTM Content

**Date:** 2026-05-08  
**Status:** Draft - Awaiting User Review

## 1. Overview

Transform the VideoRemix dashboard and navigation to organize apps into 12 strategic business categories. Each category uses exclusively NEW VideoRemix product names and includes comprehensive Go-To-Market (GTM) content generated via superpowers skills.

## 2. Architecture

### 2.1 Data Layer

**New file: `src/data/appGroups.ts`** (Created)
- Defines 12 group objects with fields:
  - `id`: string (e.g., "sales-lead-gen")
  - `label`: string (e.g., "Sales & Lead Gen")
  - `icon`: React.ReactNode (lucide-react icon)
  - `offerAngle`: string (short value proposition)
  - `description`: string (target audience)
  - `gtmContent`: string (long-form GTM content generated via superpowers)

**Interface updates:**

`src/data/appsData.ts` - Extend `App` interface:
```typescript
interface App {
  // ... existing fields
  group: string;           // 12-group category ID
  skillSlug: string;        // superpowers skill reference
  productName: string;      // VideoRemix product name
  targetAudience: string;   // "Who Would Buy It"
}
```

`src/utils/appTransformers.ts` - Extend `ComponentApp` and `DatabaseApp`:
```typescript
export interface ComponentApp {
  // ... existing fields
  group: string;
}

export interface DatabaseApp {
  // ... existing fields
  group?: string;
}
```

### 2.2 GTM Content Generation

Using superpowers `brainstorming` skill to generate for each group:
- Detailed target audience analysis
- Value proposition narrative
- Use case scenarios (3-5 per group)
- Competitive differentiation
- Pricing strategy rationale
- Integration touchpoints with existing VideoRemix products
- Recommended marketing channels

Content stored in: `src/data/gtmContent.ts`

## 3. Dashboard Updates

### 3.1 File: `src/components/dashboard/DashboardToolsSection.tsx`

**Changes:**
1. Import `appGroups` from `src/data/appGroups.ts`
2. Replace `toolCategories` (lines 32-58) with imported groups
3. Update `handleCategoryChange` function (line 503) - filter by `app.group`
4. Update filtering logic (line 449) - change `app.category === selectedCategory` to `app.group === selectedGroup`
5. Optional: Display group GTM content in expandable section

**Preserved:**
- Existing app card components
- Search functionality
- Animations (framer-motion)
- Featured apps logic

## 4. Navigation Header Updates

### 4.1 File: `src/components/SpecialHeader.tsx`

**Changes:**
1. Import `appGroups` from `src/data/appGroups.ts`
2. Replace flat `featuredTools` array (lines 49-158) with grouped structure:
```typescript
const groupedTools = appGroups.map(group => ({
  ...group,
  tools: apps.filter(app => app.group === group.id)
}));
```
3. Update dropdown rendering (lines 240-260) to show:
   - Group section headers with icon
   - Tools nested under each group
   - Maintain 2-col grid per group section
4. Keep existing UI: dark theme, backdrop blur, "Browse All Tools" link

## 5. App Data Mapping

### 5.1 VideoRemix Product Names (Already in appsData.ts)

Apps already have NEW names from your specification. Verify each of the 12 groups has appropriate apps mapped.

### 5.2 Group Assignment

Each app in `appsData.ts` and Supabase `apps` table receives a `group` field matching one of:
- sales-lead-gen
- content-creation
- video-audio-voice
- rag-knowledgebase
- realestate-local
- hr-recruiting
- finance-business
- legal-compliance
- coding-developer
- design-uiux
- research-education
- productivity-personal

## 6. Superpowers Integration

### 6.1 Skills Used

1. **brainstorming** - Generate GTM content for each group
2. **writing-plans** - Create implementation plan (next step after spec approval)
3. **using-superpowers** - Follow skill invocation protocol

### 6.2 Skill Mapping

Each app's `skillSlug` maps to corresponding superpowers skill:
- Example: `sales-lead-gen` group apps map to `brainstorming`, `requesting-code-review`, etc.
- Skills referenced via superpowers framework
- No direct code changes - mapping is data-layer only

## 7. Implementation Order

1. ✅ Create `appGroups.ts` with 12 groups (Done)
2. Generate GTM content via brainstorming skill → `gtmContent.ts`
3. Update interfaces in `appsData.ts` and `appTransformers.ts`
4. Update dashboard filtering logic
5. Update nav header dropdown rendering
6. Run typecheck and lint
7. Test all changes

## 8. Success Criteria

- [ ] 12 groups display correctly in dashboard filter tabs
- [ ] Apps filter correctly by group selection
- [ ] Nav dropdown shows grouped tools with headers
- [ ] GTM content available for each group
- [ ] All VideoRemix product names used (no repo names)
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] No regressions to existing functionality

## 9. Scope

**In Scope:**
- 12-group categorization
- GTM content generation
- Dashboard filter updates
- Nav dropdown updates
- Interface extensions

**Out of Scope:**
- Changing app URLs or routing
- Modifying purchase flow
- Adding new apps (using existing ones)
- Major UI redesign
