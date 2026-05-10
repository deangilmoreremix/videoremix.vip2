# Courses Page Design Spec

> **Date:** 2026-05-10
> **Status:** Approved

## Goal
Create a Courses page that displays 4 courses (2 crash courses + 2 fine-tuning tutorials) using a static data file, with card grid layout matching the existing app design. External links to Unwind AI with proper attribution.

## Architecture
Use static data file (`coursesData.ts`) with hardcoded course array. Create `CoursesPage.tsx` component with card grid using framer-motion animations. Add `/courses` route in `App.tsx` with lazy loading. Attribution: "Original course by Unwind AI" displayed on each card.

**Tech Stack:** React, TypeScript, Framer Motion, Lucide React, React Router

---

## Design Sections

### 1. Data Layer
**File:** `src/data/coursesData.ts`

```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;  // Lucide icon
  url: string;          // External link to Unwind AI
  category: string;       // "crash-course" | "fine-tuning"
}

const coursesData: Course[] = [
  {
    id: "google-adk-crash-course",
    title: "Google ADK Crash Course",
    description: "...",
    icon: React.createElement(BookOpen),
    url: "https://www.theunwindai.com/p/google-s-open-source-sdk-for-building-production-ai-apps",
    category: "crash-course"
  },
  // ... 3 more courses
];
```

### 2. Component Layer
**File:** `src/pages/CoursesPage.tsx`

- **Layout:** `max-w-6xl mx-auto px-4 py-16` container
- **Header:** `motion.div` with `BookOpen` icon (h-8 w-8 mr-3 text-primary-400") + title "AI Agent Courses"
- **Subtitle:** Attribution text with link to `theunwindai.com`
- **Grid:** `grid grid-cols-1 md:grid-cols-2 gap-6`

### 3. Course Card Structure
Each card uses `motion.a` (anchor tag) for external linking:

```
<motion.a
  href={course.url}
  target="_blank"
  rel="noopener noreferrer"
  className="group block bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50"
>
  <div className="flex items-start mb-4">
    <div className="p-3 bg-gray-700 rounded-lg mr-4">
      {course.icon}
    </div>
    <div>
      <h3>{course.title}</h3>
      <span className="badge">{course.category}</span>
    </div>
  </div>
  <p className="text-gray-400 mb-4">{course.description}</p>
  <div className="flex items-center text-primary-400">
    <span>View on Unwind AI</span>
    <ExternalLink className="h-4 w-4 ml-2" />
  </div>
  <div className="mt-4 pt-4 border-t border-gray-700">
    <p className="text-xs text-gray-500">Original course by Unwind AI</p>
  </div>
</motion.a>
```

### 4. Animation
- Cards use `initial={{ opacity: 0, y: 20 }}` and `animate={{ opacity: 1, y: 0 }}`
- Staggered delay: `transition={{ delay: index * 0.1 }}`

### 5. Route Configuration
**File:** `src/App.tsx`

```typescript
const CoursesPage = lazy(() => import("./pages/CoursesPage"));

<Route
  path="/courses"
  element={
    <ErrorBoundary onError={handleError}>
      <SparkleBackground>
        <Suspense fallback={<SectionLoader />}>
          <CoursesPage />
          <SpecialFooter />
        </Suspense>
      </SparkleBackground>
    </ErrorBoundary>
  }
/>
```

### 6. Courses Data (4 items)

| ID | Title | Category | URL |
|----|-------|----------|-----|
| google-adk-crash-course | Google ADK Crash Course | crash-course | theunwindai.com/p/google-s-open-source-sdk-for-building-production-ai-apps |
| openai-agents-sdk-crash-course | OpenAI Agents SDK Crash Course | crash-course | theunwindai.com/p/google-s-open-source-sdk-for-building-production-ai-apps |
| gemini-3-fine-tuning | Gemini 3 Fine-tuning Tutorial | fine-tuning | github.com/Shubhamsaboo/awesome-llm-apps/tree/main/.../gemini3_finetuning |
| llama-3-2-fine-tuning | Llama 3.2 Fine-tuning Tutorial | fine-tuning | github.com/Shubhamsaboo/awesome-llm-apps/tree/main/.../llama3.2_finetuning |

## Success Criteria

- [ ] `/courses` route displays 4 course cards
- [ ] Cards show title, description, icon, category badge
- [ ] Clicking card opens external link in new tab
- [ ] "View on Unwind AI" link with ExternalLink icon
- [ ] "Original course by Unwind AI" attribution footer
- [ ] Cards animate in with staggered delay
- [ ] Hover effect: border-primary-500/50
- [ ] Responsive: 1 column mobile, 2 columns desktop
- [ ] TypeScript compiles without errors

## Out of Scope

- Copying tutorial content (Option B: Link + Attribution only)
- Video embeds or iframes
- User authentication or enrollment tracking
- Search or filter functionality
- CMS or database integration