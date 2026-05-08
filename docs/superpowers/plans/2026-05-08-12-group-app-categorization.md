# 12-Group App Categorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Organize VideoRemix apps into 12 strategic business categories with GTM content integration.

**Architecture:** Replace existing category filtering with group-based filtering using `appGroups.ts` data structure. Update interfaces to support group field, modify dashboard and navigation components to use new grouping system.

**Tech Stack:** React, TypeScript, framer-motion, lucide-react, React Router

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/data/appGroups.ts` | Defines 12 group objects (✅ Done) |
| `src/data/gtmContent.ts` | GTM content per group (✅ Done) |
| `src/data/appsData.ts` | App definitions with group assignments (Modify) |
| `src/utils/appTransformers.ts` | Data transformation interfaces (Modify) |
| `src/components/dashboard/DashboardToolsSection.tsx` | Dashboard filtering UI (Modify) |
| `src/components/SpecialHeader.tsx` | Navigation header dropdown (Modify) |

---

### Task 1: Update App Interface in appsData.ts

**Files:**
- Modify: `src/data/appsData.ts:63-103`

- [ ] **Step 1: Add group fields to App interface**

Add `group`, `skillSlug`, `productName`, and `targetAudience` to the App interface:

```typescript
// App data structure
interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  image: string;
  popular?: boolean;
  new?: boolean;
  comingSoon?: boolean;
  price?: number;
  longDescription?: string;
  demoImage?: string;
  benefits?: string[];
  features?: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  }[];
  steps?: {
    title: string;
    description: string;
  }[];
  useCases?: {
    title: string;
    description: string;
    points: string[];
  }[];
  testimonials?: {
    quote: string;
    name: string;
    role: string;
    avatar: string;
  }[];
  faqs?: {
    question: string;
    answer: string;
  }[];
  tags?: string[];
  salesCopy?: SalesCopy;
  // New fields for 12-group categorization
  group: string;
  skillSlug?: string;
  productName?: string;
  targetAudience?: string;
}
```

- [ ] **Step 2: Verify the interface compiles**

Run: `cd /workspaces/videoremix.vip2 && npx tsc --noEmit --skipLibCheck`
Expected: No errors for appsData.ts (may have errors elsewhere)

---

### Task 2: Add Group Assignments to All Apps

**Files:**
- Modify: `src/data/appsData.ts:106-1374`

- [ ] **Step 1: Add group field to each app**

Map each app to one of the 12 groups. Here's the mapping for the first 20 apps (continue pattern for all):

```typescript
const rawAppsData: App[] = [
  // Sales & Lead Gen group
  {
    id: "ai-personalizedcontent",
    name: "AI Sales Intelligence Pro",
    description: "Create highly personalized content that speaks directly to your audience",
    category: "video",
    icon: React.createElement(Video),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-personalized-content-thumbnail.png",
    popular: true,
    group: "sales-lead-gen",
    skillSlug: "brainstorming",
    salesCopy: appSalesCopy['ai-personalizedcontent'] || appSalesCopy['ai-personalized-content'],
  },
  {
    id: "video-ai-editor",
    name: "Lead Research Scraper AI",
    description: "Professional video editing powered by artificial intelligence",
    category: "video",
    icon: React.createElement(Video),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/video-ai-editor-thumbnail.png",
    popular: true,
    group: "sales-lead-gen",
    skillSlug: "web-search",
    salesCopy: appSalesCopy['video-ai-editor'],
  },
  {
    id: "ai-video-image",
    name: "AI Business Growth Consultant",
    description: "Transform videos and images with advanced AI processing",
    category: "ai-image",
    icon: React.createElement(ImageIcon),
    image: "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/ai-video-image-thumbnail.png",
    new: true,
    group: "business-finance",
    skillSlug: "brainstorming",
    salesCopy: appSalesCopy['ai-video-image'],
  },
  // Continue for ALL apps in the file...
  // Group mappings:
  // "sales-lead-gen" - sales, crm, lead gen apps
  // "content-creation" - content marketing, social media apps
  // "video-audio-voice" - video editing, audio, voice apps
  // "rag-knowledgebase" - document chat, RAG apps
  // "realestate-local" - real estate, local business apps
  // "hr-recruiting" - HR, recruiting apps
  // "finance-business" - finance, business planning apps
  // "legal-compliance" - legal, compliance apps
  // "coding-developer" - coding, development apps
  // "design-uiux" - design, UI/UX apps
  // "research-education" - research, education apps
  // "productivity-personal" - productivity, personal assistant apps
];
```

**IMPORTANT:** Every app must have a `group` field assigned. Use search/replace to add `group: "group-id",` after each `category` field.

- [ ] **Step 2: Verify all apps have group field**

Run: `grep -c "group:" src/data/appsData.ts`
Expected: Count should equal number of apps (approximately 30-40)

- [ ] **Step 3: Run typecheck**

Run: `cd /workspaces/videoremix.vip2 && npx tsc --noEmit --skipLibCheck`
Expected: Apps with missing group field will show error

---

### Task 3: Update appTransformers.ts Interfaces

**Files:**
- Modify: `src/utils/appTransformers.ts:3-38`

- [ ] **Step 1: Add group field to DatabaseApp interface**

```typescript
export interface DatabaseApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  image?: string;
  icon?: string;
  netlify_url?: string;
  custom_domain?: string;
  is_active: boolean;
  is_featured: boolean;
  is_public: boolean;
  popular?: boolean;
  new?: boolean;
  coming_soon?: boolean;
  price?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // New field
  group?: string;
}
```

- [ ] **Step 2: Add group field to ComponentApp interface**

```typescript
export interface ComponentApp {
  id: string;
  name: string;
  description: string;
  category: string;
  iconName: string;
  image: string;
  isActive: boolean;
  isPublic: boolean;
  popular?: boolean;
  new?: boolean;
  comingSoon?: boolean;
  url?: string;
  // New field
  group: string;
}
```

- [ ] **Step 3: Update transformApp function to pass group field**

```typescript
return {
  id: dbApp.slug,
  name: dbApp.name,
  description: dbApp.description || "",
  category: dbApp.category,
  iconName: getIconNameForApp(dbApp),
  image: imageUrl,
  isActive: dbApp.is_active,
  isPublic: dbApp.is_public,
  popular: dbApp.popular || dbApp.is_featured,
  new: dbApp.new || false,
  comingSoon: dbApp.coming_soon || false,
  url: appUrl,
  group: dbApp.group || "uncategorized",
};
```

- [ ] **Step 4: Run typecheck**

Run: `cd /workspaces/videoremix.vip2 && npx tsc --noEmit --skipLibCheck`
Expected: PASS - no errors in appTransformers.ts

---

### Task 4: Update DashboardToolsSection.tsx

**Files:**
- Modify: `src/components/dashboard/DashboardToolsSection.tsx:1-100, 408-550`

- [ ] **Step 1: Import appGroups**

Add import at top of file (after line 29):

```typescript
import { appGroups } from "../../data/appGroups";
```

- [ ] **Step 2: Replace toolCategories with appGroups**

Remove lines 32-58 (toolCategories array) and replace with:

```typescript
// Import appGroups from data file - using groups for filtering
```

Then update the category filter UI to use appGroups. Find the category filter section (around line 547-570) and update:

```typescript
{/* Category filters */}
<div className="relative mb-12">
  <div className="flex justify-center overflow-x-auto hide-scrollbar pb-2">
    <div className="flex space-x-3">
      <button
        key="all"
        onClick={() => handleCategoryChange("all")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
          selectedCategory === "all"
            ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
            : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
        }`}
      >
        All Tools
      </button>
      {appGroups.map((group) => (
        <button
          key={group.id}
          onClick={() => handleCategoryChange(group.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center space-x-2 ${
            selectedCategory === group.id
              ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
              : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50"
          }`}
        >
          <span className="w-4 h-4">{group.icon}</span>
          <span>{group.label}</span>
        </button>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 3: Update filtering logic**

Change line 449 from:
```typescript
result = result.filter((app) => app.category === selectedCategory);
```
To:
```typescript
result = result.filter((app) => app.group === selectedCategory);
```

- [ ] **Step 4: Update selectedCategory state type**

Change line 410 from:
```typescript
const [selectedCategory, setSelectedCategory] = useState("all");
```
To:
```typescript
const [selectedGroup, setSelectedGroup] = useState("all");
```

Then update all references to `selectedCategory` to `selectedGroup`, and `handleCategoryChange` to `handleGroupChange`.

- [ ] **Step 5: Run typecheck**

Run: `cd /workspaces/videoremix.vip2 && npx tsc --noEmit --skipLibCheck`
Expected: PASS or only pre-existing errors

---

### Task 5: Update SpecialHeader.tsx

**Files:**
- Modify: `src/components/SpecialHeader.tsx:1-300`

- [ ] **Step 1: Import appGroups and appsData**

Add imports after line 14:

```typescript
import { appGroups } from "../../data/appGroups";
import { rawAppsData } from "../../data/appsData";
```

- [ ] **Step 2: Replace featuredTools with grouped structure**

Remove lines 49-158 (featuredTools array) and replace with:

```typescript
// Grouped tools for the dropdown
const getGroupedTools = () => {
  return appGroups.map(group => ({
    ...group,
    tools: rawAppsData.filter(app => app.group === group.id).slice(0, 6) // Show 6 per group
  })).filter(group => group.tools.length > 0);
};
```

- [ ] **Step 3: Update dropdown rendering**

Replace the dropdown content (lines 240-260) with grouped display:

```typescript
<div className="p-4">
  <h3 className="text-primary-400 font-medium text-sm mb-3 flex items-center">
    <Sparkles className="h-4 w-4 mr-1" /> Our AI Tools
  </h3>

  <div className="max-h-[400px] overflow-y-auto">
    {getGroupedTools().map((group) => (
      <div key={group.id} className="mb-4 last:mb-0">
        <div className="flex items-center mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span className="mr-2 w-3 h-3">{group.icon}</span>
          {group.label}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {group.tools.map((tool: any) => (
            <a
              key={tool.id}
              href={`https://${tool.id}.videoremix.vip`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 hover:bg-gray-800 rounded text-white transition-colors group"
            >
              <div className="flex items-center mb-1">
                <span className="font-medium group-hover:text-primary-400 transition-colors text-sm">
                  {tool.name}
                </span>
              </div>
              <p className="text-gray-400 text-xs line-clamp-1">
                {tool.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    ))}
  </div>

  <Link
    to="/tools"
    className="block text-center bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors mt-3"
  >
    <span className="flex items-center justify-center">
      Browse All Tools
      <ArrowRight className="ml-2 h-4 w-4" />
    </span>
  </Link>
</div>
```

- [ ] **Step 4: Run typecheck**

Run: `cd /workspaces/videoremix.vip2 && npx tsc --noEmit --skipLibCheck`
Expected: PASS or only pre-existing errors

---

### Task 6: Run Lint and Typecheck

**Files:**
- All modified files

- [ ] **Step 1: Run typecheck**

Run: `cd /workspaces/videoremix.vip2 && npm run typecheck`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `cd /workspaces/videoremix.vip2 && npm run lint`
Expected: PASS (fix any auto-fixable issues)

- [ ] **Step 3: Build test**

Run: `cd /workspaces/videoremix.vip2 && npm run build`
Expected: Successful build

---

### Task 7: Commit Changes

- [ ] **Step 1: Stage changes**

```bash
cd /workspaces/videoremix.vip2
git add src/data/appsData.ts src/utils/appTransformers.ts src/components/dashboard/DashboardToolsSection.tsx src/components/SpecialHeader.tsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: implement 12-group app categorization with GTM content

- Add group field to App, ComponentApp, and DatabaseApp interfaces
- Map all apps to 12 strategic business categories
- Update dashboard filtering to use groups instead of categories
- Update navigation header dropdown to show grouped tools
- Integrate GTM content from gtmContent.ts"
```

---

## Success Criteria

- [ ] 12 groups display correctly in dashboard filter tabs
- [ ] Apps filter correctly by group selection
- [ ] Nav dropdown shows grouped tools with headers
- [ ] GTM content available for each group (✅ Done in gtmContent.ts)
- [ ] All VideoRemix product names used (✅ Done in appsData.ts)
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] No regressions to existing functionality
