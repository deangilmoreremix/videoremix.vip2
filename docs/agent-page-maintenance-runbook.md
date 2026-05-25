# Agent Page Maintenance Runbook

**Purpose:** Guide for maintaining, upgrading, and adding new agent pages following the Complete UI/UX Standards.

---

## Auditing an Existing Agent Page

### Step 1: Run the Audit Script

```bash
npx tsx scripts/audit-agent-pages.ts
```

Review `docs/audits/audit-report.md` for the page's score and failing criteria.

### Step 2: Manual Review Checklist

| Element | Required | Points |
|---------|----------|--------|
| Descriptive placeholder (>15 chars with examples) | Required | 5 pts |
| Helper text explaining purpose/format | Required | 5 pts |
| Label with `htmlFor` matching input `id` | Required | 3 pts |
| `aria-required` for mandatory fields | Required | 2 pts |
| ResultCard/ResultGrid instead of `<pre>JSON.stringify` | Required | 8 pts |
| EmptyState component | Required | 5 pts |
| LoadingIndicator during async | Required | 5 pts |
| ErrorMessage with retry | Required | 5 pts |
| localStorage persistence | Recommended | 5 pts |
| Responsive grid classes | Required | 5 pts |
| ARIA labels on interactive elements | Required | 3 pts |
| Framer Motion animations | Recommended | 2 pts |

### Step 3: Target Scores

| Current Score | Target | Typical Fixes | Effort |
|---------------|--------|--------------|--------|
| 30-40 | 60+ | Add helper text, empty states | 2h |
| 41-55 | 70+ | Replace JSON with ResultCards | 3h |
| 56-70 | 80+ | Add ExamplePrompts, polish | 4h |
| 71-80 | 90+ | A11y audit, contrast fixes | 2h |

---

## Upgrading a Page (Step by Step)

### 1. Add Component Imports

```tsx
import {
  SmartInput,
  SmartTextarea,
  ResultCard,
  ResultGrid,
  LoadingIndicator,
  ErrorMessage,
  EmptyState,
  ActionButton,
  ExamplePrompt,
  FormSection,
  ApiKeyInput,
  FileUploadZone,
} from '@/components/agent-ui';
```

### 2. Replace Input Components

**Before:**
```tsx
<Input 
  placeholder=""
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```

**After:**
```tsx
<SmartInput
  label="Your Question"
  name="question"
  value={query}
  onChange={setQuery}
  placeholder="Ask anything... e.g., 'What are market trends for AI in 2026?'"
  helperText="Be specific for better results. Include context."
  required
/>
```

### 3. Replace Raw JSON Output

**Before:**
```tsx
<pre>{JSON.stringify(result, null, 2)}</pre>
```

**After:**
```tsx
{result && (
  <ResultGrid columns={2}>
    <ResultCard
      icon={<CheckCircle2 />}
      title="Summary"
      value={result.summary?.slice(0, 100) + '...'}
    />
    <ResultCard
      icon={<TrendingUp />}
      title="Confidence"
      value={`${(result.confidence * 100).toFixed(0)}%`}
      variant={result.confidence > 0.8 ? 'success' : 'warning'}
    />
  </ResultGrid>
)}
```

### 4. Add Empty State

```tsx
if (!result && !loading) {
  return (
    <EmptyState
      icon={<Sparkles />}
      title="Ready to analyze"
      description="Enter your query above to get AI-powered insights"
      tips={[
        "Be specific with your question",
        "Include relevant context or data",
        "Ask about trends, analysis, or summaries",
      ]}
    />
  );
}
```

### 5. Add LocalStorage Persistence

```tsx
// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('agent-query');
  if (saved) setQuery(saved);
}, []);

// Save on change
useEffect(() => {
  localStorage.setItem('agent-query', query);
}, [query]);

// Clear on successful submission
const handleSubmit = async () => {
  const result = await apiCall(query);
  localStorage.removeItem('agent-query'); // Clear on success
  setResult(result);
};
```

### 6. Add Loading/Error States

```tsx
{loading && (
  <LoadingIndicator
    message="Analyzing your query..."
    subtext="This usually takes 5-10 seconds"
  />
)}

{error && (
  <ErrorMessage
    title="Analysis failed"
    message={error}
    onRetry={handleSubmit}
  />
)}
```

### 7. Add Example Prompts (for AI input fields)

```tsx
<ExamplePrompt
  examples={[
    "What are the latest AI trends?",
    "Analyze this quarterly data...",
    "Summarize this research paper...",
  ]}
  onSelect={setQuery}
/>
```

### 8. Commit Changes

```bash
git add src/pages/agents/<PageName>.tsx
git commit -m "feat(agent): enhance UI/UX for <PageName>"
```

---

## Creating a New Agent Page

### 1. Copy Template Structure

Use this template as a starting point:

```tsx
import { useState, useEffect } from 'react';
import {
  SmartInput,
  SmartTextarea,
  ResultCard,
  ResultGrid,
  LoadingIndicator,
  ErrorMessage,
  EmptyState,
  ActionButton,
  ExamplePrompt,
  FormSection,
} from '@/components/agent-ui';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface PageProps {
  // Add props if needed
}

export default function NewAgentPage() {
  // State management
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LocalStorage persistence
  useEffect(() => {
    const saved = localStorage.getItem('new-agent-input');
    if (saved) setInput(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('new-agent-input', input);
  }, [input]);

  // API call handler
  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Please enter a value');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      setResult(data);
      localStorage.removeItem('new-agent-input'); // Clear on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Empty state
  if (!result && !loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-3">New Agent</h1>
          <p className="text-gray-400">Description of what this agent does</p>
        </div>

        <SmartInput
          label="Your Input"
          name="input"
          value={input}
          onChange={setInput}
          placeholder="Enter your input... e.g., example value"
          helperText="Explain what this field does and any format requirements"
          required
        />

        <ExamplePrompt
          examples={["Example 1", "Example 2", "Example 3"]}
          onSelect={setInput}
        />

        <ActionButton
          onClick={handleSubmit}
          loading={loading}
          disabled={!input.trim()}
          size="lg"
          className="w-full"
        >
          <Sparkles className="h-4 w-4" />
          Submit
        </ActionButton>

        {error && (
          <ErrorMessage
            title="Submission failed"
            message={error}
            onRetry={handleSubmit}
          />
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <LoadingIndicator
        message="Processing your request..."
        subtext="This usually takes 10-20 seconds"
      />
    );
  }

  // Result state
  return (
    <div className="space-y-6">
      <ResultGrid columns={2}>
        <ResultCard
          icon={<CheckCircle2 />}
          title="Result"
          value={result.value}
          description={result.description}
          variant="success"
        />
      </ResultGrid>

      <ActionButton onClick={() => { setResult(null); setInput(''); }}>
        Start Over
      </ActionButton>
    </div>
  );
}
```

### 2. Follow File Naming Convention

- Page file: `src/pages/agents/<PascalCaseName>Page.tsx`
- Example: `MyNewAgentPage.tsx`

### 3. Register in Router

Add the route in `src/App.tsx`:

```tsx
<Route path="/agent/my-new-agent" element={<MyNewAgentPage />} />
```

### 4. Add to App Catalog

Add entry in `src/data/appsData.ts`:

```tsx
{
  id: 'my-new-agent',
  name: 'My New Agent',
  description: 'Description of what this agent does',
  category: 'ai-agents',
  icon: <Sparkles className="h-5 w-5" />,
  image: '/path/to/thumbnail.png',
}
```

### 5. Test the Page

- [ ] Load page, verify no console errors
- [ ] Enter input, verify placeholder text shows
- [ ] Submit, verify loading state shows
- [ ] Verify result displays in ResultCard (not raw JSON)
- [ ] Test empty state (refresh page without result)
- [ ] Test error state (mock failed API call)
- [ ] Test localStorage persistence (refresh page, verify state restored)
- [ ] Test keyboard navigation (Tab through inputs)
- [ ] Verify mobile responsiveness (375px viewport)

---

## Troubleshooting Common Issues

### Raw JSON Still Visible

**Problem:** After replacing `<pre>JSON.stringify`, raw JSON still appears in the UI.

**Cause:** There's another `JSON.stringify` somewhere in the component tree.

**Fix:** Search for `JSON.stringify` in the file and replace all instances.

### Helper Text Not Showing

**Problem:** Added `helperText` prop but no helper text appears.

**Cause:** The component isn't rendering the helper text properly.

**Fix:** Check that you're using the prop correctly:
```tsx
// SmartInput with helperText
<SmartInput
  label="My Field"
  helperText="This is helper text"  // This will show below the input
  ...
/>

// Raw input with manual helper text
<div className="space-y-2">
  <Label htmlFor="my-field">My Field</Label>
  <Input id="my-field" ... />
  <p className="text-xs text-gray-400">Manual helper text</p>  // Add this manually
</div>
```

### Component Not Found Errors

**Problem:** `Cannot find module '@/components/agent-ui/SmartInput'`

**Cause:** The import path is wrong or the component doesn't exist.

**Fix:** Verify the component exists at `src/components/agent-ui/SmartInput.tsx` and the import path is correct:
```tsx
// Correct import
import { SmartInput } from '@/components/agent-ui';

// Verify component exists at src/components/agent-ui/
```

### localStorage Not Working

**Problem:** State not persisting across page reloads.

**Cause:** Key mismatch or JSON parse error.

**Fix:** 
```tsx
// Use try-catch when parsing
try {
  const saved = localStorage.getItem('my-key');
  if (saved) setState(JSON.parse(saved));
} catch (e) {
  console.warn('Failed to parse saved state');
  localStorage.removeItem('my-key');
}
```

### Loading State Not Triggering

**Problem:** Loading spinner not showing during API call.

**Cause:** `loading` state not being set correctly.

**Fix:**
```tsx
const handleSubmit = async () => {
  setLoading(true);  // Must be BEFORE await
  try {
    const result = await apiCall();
    setResult(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);  // Must be in finally, not just in success path
  }
};
```

---

## Design System Reference

### Color Palette

```css
--color-bg-primary: #1a1a2e;      /* Deep indigo */
--color-bg-secondary: #16162a;     /* Darker */
--color-bg-tertiary: #252540;      /* Cards */
--color-violet: #7c3aed;          /* Primary accent */
--color-coral: #f97316;           /* Human warmth */
--color-cyan: #06b6d4;            /* Clarity */
--color-green: #10b981;           /* Success */
--color-red: #ef4444;             /* Error */
```

### Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 36px | 700 | 1.2 |
| H2 | 28px | 600 | 1.3 |
| H3 | 22px | 600 | 1.4 |
| Body | 16px | 400 | 1.6 |
| Small | 14px | 400 | 1.5 |
| Caption | 12px | 400 | 1.4 |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Related elements |
| md | 16px | Section padding |
| lg | 24px | Card padding |
| xl | 32px | Section gaps |

### Border Radius

| Element | Radius |
|---------|--------|
| Buttons | 8px |
| Cards | 12px |
| Inputs | 8px |
| Badges | 4px |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    STANDARD UPGRADE CHECKLIST                │
├─────────────────────────────────────────────────────────────┤
│ Input Fields                                                │
│ ☐ Replace <Input> → <SmartInput>                           │
│ ☐ Add descriptive placeholder (>15 chars, with example)   │
│ ☐ Add helperText prop                                      │
│ ☐ Ensure <Label htmlFor> matches <Input id>               │
│                                                              │
│ Result Display                                              │
│ ☐ Replace <pre>JSON.stringify → <ResultCard>/<ResultGrid> │
│ ☐ Format numbers, dates, currency                           │
│ ☐ Use variant prop (success/warning/error/info)            │
│                                                              │
│ States                                                      │
│ ☐ Add <EmptyState> for no-data conditions                 │
│ ☐ Add <LoadingIndicator> for async operations              │
│ ☐ Add <ErrorMessage> with retry button                     │
│                                                              │
│ Persistence                                                 │
│ ☐ Add localStorage save on change                          │
│ ☐ Add localStorage restore on mount                        │
│ ☐ Clear localStorage on successful submission              │
│                                                              │
│ Accessibility                                               │
│ ☐ ARIA labels on all interactive elements                  │
│ ☐ aria-required on mandatory fields                        │
│ ☐ aria-invalid on error state fields                       │
│ ☐ aria-describedby linking to helper/error text           │
│                                                              │
│ Visual Polish                                               │
│ ☐ Add <FormSection> for grouping fields                   │
│ ☐ Add <ExamplePrompt> for AI input fields                  │
│ ☐ Add <ActionButton> with loading/disabled states           │
│ ☐ Use gradient icon headers                                │
└─────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-08  
**Applies To:** All files in `src/pages/agents/*.tsx`