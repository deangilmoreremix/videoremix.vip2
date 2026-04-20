# Thumbnail Sales Dropdowns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clickable expandable dropdowns to each of the 27 AI-generated app thumbnails that reveal structured sales copy explaining app functionality and monetization strategies for local businesses.

**Architecture:** Extend the existing DashboardToolsSection component with expandable card functionality. Pre-generate sales copy using GTM Skills tonalities matched to app categories. Use Framer Motion for smooth animations and maintain existing thumbnail loading infrastructure.

**Tech Stack:** React, TypeScript, Framer Motion, existing dashboard components, GTM Skills tonalities, Supabase for data storage.

---

## File Structure

**Modified Files:**
- `src/data/appsData.ts` - Add sales copy data structure and content
- `src/components/dashboard/DashboardToolsSection.tsx` - Add expandable card functionality
- `src/components/dashboard/AppCard.tsx` (if exists) or inline expansion logic

**New Files:**
- `src/data/appSalesCopy.ts` - Generated sales copy for all 27 apps
- `src/components/ui/SalesDropdown.tsx` - Reusable dropdown component
- `src/components/ui/SalesDropdownErrorBoundary.tsx` - Error boundary for dropdown failures

**Test Files:**
- `src/components/dashboard/__tests__/DashboardToolsSection.test.tsx` - Component tests
- `src/data/__tests__/appSalesCopy.test.ts` - Data validation tests

---

### Task 1: Generate Sales Copy Data Structure

**Files:**
- Create: `src/data/appSalesCopy.ts`
- Modify: `src/data/appsData.ts` (add sales copy import and interface)

- [ ] **Step 1: Create sales copy interface**

```typescript
// src/data/appSalesCopy.ts
export interface SalesCopy {
  tonality: string;
  whatItDoes: string;
  howItMakesMoney: string;
  whyBusinessesNeedIt: string;
}

export interface AppSalesData {
  [appId: string]: SalesCopy;
}
```

- [ ] **Step 2: Add interface to appsData.ts**

```typescript
// src/data/appsData.ts
import { SalesCopy } from '../data/appSalesCopy';

// Add to App interface
interface App {
  // ... existing fields
  salesCopy?: SalesCopy;
}
```

- [ ] **Step 3: Create placeholder data structure**

```typescript
// src/data/appSalesCopy.ts
export const appSalesCopy: AppSalesData = {
  // Will be populated with generated content
};

export const validateSalesCopy = (copy: SalesCopy): boolean => {
  return !!(copy.tonality && copy.whatItDoes && copy.howItMakesMoney && copy.whyBusinessesNeedIt);
};
```

- [ ] **Step 4: Commit initial data structure**

```bash
git add src/data/appSalesCopy.ts src/data/appsData.ts
git commit -m "feat: add sales copy data structure for thumbnail dropdowns"
```

---

### Task 2: Generate Sales Copy Content

**Files:**
- Modify: `src/data/appSalesCopy.ts`

- [ ] **Step 1: Assign tonalities to app categories**

Based on GTM Skills tonalities matched to app categories:
- Video: Steve Jobs, Hemingway
- Lead-gen: Challenger Sale, Value-Based
- Creative: Seth Godin, Cormac McCarthy
- Branding: Jeff Bezos, Trusted Advisor
- Personalizer: Chris Voss, Pain Point Research

- [ ] **Step 2: Create sales copy generation script**

```typescript
// scripts/generate-sales-copy.ts
const generateSalesCopy = async (app: App, tonality: string) => {
  const prompt = `Write sales copy for ${app.name} using ${tonality} tonality. Structure as:
  - What it does: [clear functionality description]
  - How it makes money: [specific local business monetization strategies]
  - Why businesses need it: [compelling value proposition in ${tonality} style]

  App details: ${JSON.stringify(app)}`;

  // Use AI service to generate content
  return await generateWithAI(prompt);
};
```

- [ ] **Step 3: Generate sales copy for all 27 apps**

Create content for apps using assigned tonalities, ensuring each covers the required sections.

- [ ] **Step 3: Add content to appSalesCopy object**

```typescript
export const appSalesCopy: AppSalesData = {
  'video-creator': {
    tonality: 'Steve Jobs',
    whatItDoes: 'Creates professional videos from text prompts and keywords...',
    howItMakesMoney: 'Local businesses can charge premium rates for custom video content...',
    whyBusinessesNeedIt: 'In a visual economy, your competitors are already using video...'
  },
  // ... continue for all apps
};
```

- [ ] **Step 4: Validate content completeness**

Ensure all 27 apps have sales copy with proper tonality adherence.

- [ ] **Step 5: Commit sales copy content**

```bash
git add src/data/appSalesCopy.ts
git commit -m "feat: add sales copy content for all 27 apps using GTM Skills tonalities"
```

---

### Task 3: Integrate Sales Copy with App Data

**Files:**
- Modify: `src/data/appsData.ts`

- [ ] **Step 1: Import sales copy data**

```typescript
import { appSalesCopy } from './appSalesCopy';
```

- [ ] **Step 2: Update raw apps data to include sales copy**

```typescript
const rawAppsData: App[] = [
  {
    id: "video-creator",
    // ... existing fields
    salesCopy: appSalesCopy['video-creator']
  },
  // ... update all apps
];
```

- [ ] **Step 3: Verify data integration**

Check that all apps have sales copy attached and thumbnailMapper handles it correctly.

- [ ] **Step 4: Commit data integration**

```bash
git add src/data/appsData.ts
git commit -m "feat: integrate sales copy data with app data structure"
```

---

### Task 4: Create Sales Dropdown Component

**Files:**
- Create: `src/components/ui/SalesDropdown.tsx`

- [ ] **Step 1: Create dropdown component interface**

```typescript
interface SalesDropdownProps {
  salesCopy: SalesCopy;
  isExpanded: boolean;
  onToggle: () => void;
}
```

- [ ] **Step 2: Implement expandable content structure**

```typescript
const SalesDropdown: React.FC<SalesDropdownProps> = ({
  salesCopy,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="sales-dropdown">
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="expand-toggle"
      >
        Learn More <ChevronDown className={isExpanded ? 'rotated' : ''} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sales-content"
          >
            <div className="content-section">
              <h4>What It Does</h4>
              <p>{salesCopy.whatItDoes}</p>
            </div>
            <div className="content-section">
              <h4>How It Makes Money</h4>
              <p>{salesCopy.howItMakesMoney}</p>
            </div>
            <div className="content-section">
              <h4>Why Businesses Need It</h4>
              <p>{salesCopy.whyBusinessesNeedIt}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

- [ ] **Step 3: Add responsive styling**

```css
.sales-dropdown {
  margin-top: 1rem;
}

.expand-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
}

.sales-content {
  margin-top: 1rem;
  overflow: hidden;
}

.content-section {
  margin-bottom: 1.5rem;
}

.content-section h4 {
  color: #1f2937;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.content-section p {
  color: #4b5563;
  line-height: 1.6;
}
```

- [ ] **Step 4: Commit dropdown component**

```bash
git add src/components/ui/SalesDropdown.tsx
git commit -m "feat: create reusable SalesDropdown component with animations"
```

---

### Task 5: Integrate Dropdown into Dashboard

**Files:**
- Modify: `src/components/dashboard/DashboardToolsSection.tsx`

- [ ] **Step 1: Import SalesDropdown component**

```typescript
import SalesDropdown from '../ui/SalesDropdown';
```

- [ ] **Step 2: Add expansion state management**

```typescript
const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

const toggleCardExpansion = (appId: string) => {
  setExpandedCards(prev => ({
    ...prev,
    [appId]: !prev[appId]
  }));
};
```

- [ ] **Step 3: Update card rendering to include dropdown**

Find the app card rendering section and add:

```typescript
{/* Add after existing app content */}
<SalesDropdown
  salesCopy={app.salesCopy}
  isExpanded={expandedCards[app.id] || false}
  onToggle={() => toggleCardExpansion(app.id)}
/>
```

- [ ] **Step 4: Add accordion behavior (optional single expansion)**

```typescript
const toggleCardExpansion = (appId: string) => {
  setExpandedCards(prev => {
    const newState = { ...prev };
    // Close all other cards (accordion behavior)
    Object.keys(newState).forEach(key => {
      if (key !== appId) newState[key] = false;
    });
    newState[appId] = !prev[appId];
    return newState;
  });
};
```

- [ ] **Step 5: Test component integration**

Run development server and verify dropdowns appear and function correctly.

- [ ] **Step 6: Commit dashboard integration**

```bash
git add src/components/dashboard/DashboardToolsSection.tsx
git commit -m "feat: integrate SalesDropdown component into dashboard with expansion state"
```

---

### Task 6: Add Accessibility and Error Handling

**Files:**
- Modify: `src/components/ui/SalesDropdown.tsx`
- Modify: `src/components/dashboard/DashboardToolsSection.tsx`

- [ ] **Step 1: Add ARIA attributes and keyboard support**

```typescript
// In SalesDropdown
<button
  onClick={onToggle}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  }}
  aria-expanded={isExpanded}
  aria-controls={`sales-content-${appId}`}
  role="button"
  tabIndex={0}
>
```

- [ ] **Step 2: Add error boundary for missing sales copy**

```typescript
// In SalesDropdown
if (!salesCopy) {
  return (
    <div className="sales-error">
      Sales information not available
    </div>
  );
}
```

- [ ] **Step 3: Add animation fallbacks for older browsers**

```typescript
// Use CSS transitions as fallback
const contentStyle = isExpanded ? { maxHeight: '1000px' } : { maxHeight: '0' };
```

- [ ] **Step 4: Create error boundary component**

```typescript
// src/components/ui/SalesDropdownErrorBoundary.tsx
class SalesDropdownErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SalesDropdown Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="sales-error">
          Unable to load sales information
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 5: Commit accessibility improvements**

```bash
git add src/components/ui/SalesDropdown.tsx src/components/ui/SalesDropdownErrorBoundary.tsx src/components/dashboard/DashboardToolsSection.tsx
git commit -m "feat: add accessibility features, error boundary, and error handling to dropdown component"
```

---

### Task 7: Testing and Validation

**Files:**
- Create: `src/components/dashboard/__tests__/DashboardToolsSection.test.tsx`
- Create: `src/data/__tests__/appSalesCopy.test.ts`

- [ ] **Step 1: Create unit tests for SalesDropdown**

```typescript
describe('SalesDropdown', () => {
  it('renders expand button', () => {
    // Test expand button presence
  });

  it('toggles content on click', () => {
    // Test expansion state changes
  });

  it('displays sales copy when expanded', () => {
    // Test content visibility
  });

  it('handles missing sales copy gracefully', () => {
    // Test error state
  });
});
```

- [ ] **Step 2: Create data validation tests**

```typescript
describe('appSalesCopy', () => {
  it('has sales copy for all 27 apps', () => {
    expect(Object.keys(appSalesCopy)).toHaveLength(27);
  });

  it('each app has required fields', () => {
    Object.values(appSalesCopy).forEach(copy => {
      expect(copy.tonality).toBeDefined();
      expect(copy.whatItDoes).toBeDefined();
      expect(copy.howItMakesMoney).toBeDefined();
      expect(copy.whyBusinessesNeedIt).toBeDefined();
    });
  });
});
```

- [ ] **Step 3: Run tests and verify functionality**

```bash
npm test -- --testPathPattern="SalesDropdown|appSalesCopy"
```

- [ ] **Step 4: Test accessibility with screen reader**

Verify keyboard navigation and ARIA announcements work correctly.

- [ ] **Step 5: Commit tests**

```bash
git add src/components/dashboard/__tests__/DashboardToolsSection.test.tsx src/data/__tests__/appSalesCopy.test.ts
git commit -m "feat: add comprehensive tests for sales dropdown functionality and data validation"
```

---

### Task 8: Performance Optimization and Final Polish

**Files:**
- Modify: `src/components/ui/SalesDropdown.tsx`
- Modify: `src/components/dashboard/DashboardToolsSection.tsx`

- [ ] **Step 1: Optimize animations for low-end devices**

```typescript
// Add reduced motion support
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const animationConfig = prefersReducedMotion
  ? { duration: 0.1 }
  : { duration: 0.3, ease: 'easeInOut' };
```

- [ ] **Step 2: Add lazy loading for expanded content**

```typescript
// Use React.lazy and Suspense for code splitting
const SalesContent = lazy(() => import('./SalesContent'));

// In SalesDropdown component
{isExpanded && (
  <Suspense fallback={<div className="skeleton">Loading...</div>}>
    <SalesContent salesCopy={salesCopy} />
  </Suspense>
)}
```

- [ ] **Step 3: Add loading states for dynamic content**

```typescript
// Add skeleton loading for content
const [isLoading, setIsLoading] = useState(false);
```

- [ ] **Step 4: Final visual polish and responsive design**

Ensure dropdowns work perfectly on mobile with touch interactions.

- [ ] **Step 5: Commit final optimizations**

```bash
git add src/components/ui/SalesDropdown.tsx src/components/dashboard/DashboardToolsSection.tsx
git commit -m "feat: add performance optimizations and final polish to sales dropdowns"
```

---

## Success Criteria

- ✅ All 27 apps have functional dropdowns with unique sales copy
- ✅ Different GTM Skills tonality used for each app category
- ✅ Smooth Framer Motion animations on expand/collapse
- ✅ Mobile-responsive touch interactions
- ✅ Keyboard accessibility with proper ARIA attributes
- ✅ Error handling for missing content
- ✅ Comprehensive test coverage
- ✅ Performance optimized for all devices

## Testing Checklist

- [ ] Visual regression tests pass
- [ ] Accessibility audit passes (WCAG AA)
- [ ] Mobile touch interactions work
- [ ] All 27 apps display sales copy correctly
- [ ] Content follows assigned tonality guidelines
- [ ] Animations perform smoothly on low-end devices
- [ ] Error states display appropriately
- [ ] Keyboard navigation works end-to-end