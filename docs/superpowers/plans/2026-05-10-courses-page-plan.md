# Courses Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Courses page displaying 4 courses (2 crash courses + 2 fine-tuning tutorials) with card grid layout and external links to Unwind AI.

**Architecture:** Static data file (`coursesData.ts`) with hardcoded course array. `CoursesPage.tsx` component with card grid using framer-motion animations. Add `/courses` route in `App.tsx` with lazy loading. Attribution: "Original course by Unwind AI" displayed on each card.

**Tech Stack:** React & TypeScript, Framer Motion, Lucide React, React Router

---

## File Structure

| File | Responsibility |
|------|--------------|
| `src/data/coursesData.ts` | Static array of 4 Course objects with id, title, description, icon, url, category |
| `src/pages/CoursesPage.tsx` | Page component rendering card grid with animations |
| `src/App.tsx` | Add lazy import and `/courses` route |

---

## Implementation Tasks

### Task 1: Create Course Data File

**Files:**
- Create: `src/data/coursesData.ts`

- [ ] **Step 1: Create the courses data file**

```typescript
import React from "react";
import { BookOpen, Settings } from "lucide-react";

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  category: string;
}

export const coursesData: Course[] = [
  {
    id: "google-adk-crash-course",
    title: "Google ADK Crash Course",
    description: "Deep-dive tutorial on Google's Agent Development Kit. Covers starter agent, model-agnostic development, structured outputs with Pydantic, tools integration (built-in, function, third-party, MCP), memory management, callbacks, plugins, and multi-agent patterns.",
    icon: React.createElement(BookOpen),
    url: "https://www.theunwindai.com/p/google-s-open-source-sdk-for-building-production-ai-apps",
    category: "crash-course"
  },
  {
    id: "openai-agents-sdk-crash-course",
    title: "OpenAI Agents SDK Crash Course",
    description: "Comprehensive tutorial on OpenAI Agents SDK. Learn starter agent, function calling, structured outputs, tools integration, memory, callbacks, evaluation, multi-agent patterns, agent handoffs, Swarm orchestration, and routing logic.",
    icon: React.createElement(BookOpen),
    url: "https://www.theunwindai.com/p/google-s-open-source-sdk-for-building-production-ai-apps",
    category: "crash-course"
  },
  {
    id: "gemini-3-fine-tuning",
    title: "Gemini 3 Fine-tuning Tutorial",
    description: "End-to-end fine-tuning recipe for Gemini 3 model. Learn how to adapt pre-trained models for specific tasks with custom datasets.",
    icon: React.createElement(Settings),
    url: "https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_llm_apps/llm_finetuning_tutorials/gemma3_finetuning",
    category: "fine-tuning"
  },
  {
    id: "llama-3-2-fine-tuning",
    title: "Llama 3.2 Fine-tuning Tutorial",
    description: "Complete fine-tuning guide for Llama 3.2 model. Step-by-step instructions for parameter-efficient fine-tuning and deployment.",
    icon: React.createElement(Settings),
    url: "https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main/advanced_llm_apps/llm_finetuning_tutorials/llama3.2_finetuning",
    category: "fine-tuning"
  }
];
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la src/data/coursesData.ts`
Expected: File exists with correct content

---

### Task 2: Create CoursesPage Component

**Files:**
- Create: `src/pages/CoursesPage.tsx`

- [ ] **Step 1: Create the CoursesPage component**

```tsx
import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { BookOpen, Settings, ExternalLink } from "lucide-react";
import { coursesData, Course } from "../data/coursesData";

const CoursesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Helmet>
        <title>Courses | VideoRemix.vip</title>
        <meta name="description" content="Learn AI agent development with crash courses and tutorials." />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-4 flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-primary-400" />
            AI Agent Courses
          </h1>
          <p className="text-gray-400 mb-12 text-lg">
            Free crash courses and tutorials to master AI agent frameworks. Original content by {" "}
            <a 
              href="https://www.theunwindai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300"
            >
              Unwind AI
            </a>.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coursesData.map((course: Course, index: number) => (
            <motion.a
              key={course.id}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-start mb-4">
                <div className="p-3 bg-gray-700 rounded-lg mr-4 group-hover:bg-primary-600/20 transition-colors">
                  {course.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors mb-2">
                    {course.title}
                  </h3>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary-600/30 text-primary-300">
                    {course.category === "crash-course" ? "Crash Course" : "Tutorial"}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-400 mb-4 line-clamp-3">
                {course.description}
              </p>
              
              <div className="flex items-center text-primary-400 text-sm font-medium">
                <span>View on Unwind AI</span>
                <ExternalLink className="h-4 w-4 ml-2" />
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500">
                  Original course by Unwind AI
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
```

- [ ] **Step 2: Verify component compiles**

Run: `cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af && npx -p typescript tsc --noEmit --skipLibCheck src/pages/CoursesPage.tsx 2>&1 | head -20`
Expected: No errors related to the new component

---

### Task 3: Add Route to App.tsx

**Files:**
- Modify: `src/App.tsx` (add import and route)

- [ ] **Step 1: Add lazy import for CoursesPage**

Find the generic pages section (around line 24) and add:

```typescript
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
```

- [ ] **Step 2: Add /courses route**

Find the closing `</Routes>` tag and add before it:

```tsx
          {/* Courses Page */}
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

- [ ] **Step 3: Verify App.tsx compiles**

Run: `cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af && npx -p typescript tsc --noEmit --skipLibCheck src/App.tsx 2>&1 | head -20`
Expected: No new errors

---

### Task 4: Run Lint and TypeScript Check

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

Run: `cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af && npm run build 2>&1 | tail -30`
Expected: Build succeeds OR only pre-existing errors

- [ ] **Step 2: Run lint**

Run: `cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af && npm run lint 2>&1 | head -30`
Expected: PASS or auto-fixable issues

---

### Task 5: Commit Changes

- [ ] **Step 1: Stage changes**

```bash
cd /workspace/0c85e0dc-1244-40ab-8f84-e11668f857da/sessions/agent_0fa13a13-32c9-4596-9dcc-b1bb6a0ed9af
git add src/data/coursesData.ts src/pages/CoursesPage.tsx src/App.tsx
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: add Courses page with links to Unwind AI tutorials

- Create coursesData.ts with 4 courses (2 crash courses, 2 fine-tuning tutorials)
- Create CoursesPage.tsx with card grid layout and external links
- Add route /courses in App.tsx with lazy loading
- Attribution: Original courses by Unwind AI
- Courses page uses Option B: Link + Attribution"
```

---

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
- [ ] Lint passes

---

## Self-Review Checklist

**1. Spec coverage:** 
- ✅ 4 courses displayed
- ✅ Card grid layout
- ✅ External links to Unwind AI
- ✅ Attribution "Original course by Unwind AI"
- ✅ Animations with framer-motion

**2. Placeholder scan:** No "TBD", "TODO", or incomplete sections found.

**3. Type consistency:** All types (Course, coursesData) defined in Task 1, used consistently in Task 2.

**4. No placeholders found in plan.**
