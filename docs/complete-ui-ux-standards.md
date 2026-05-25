# Complete UI/UX Standards for Agent Pages

> **Purpose:** This document defines the minimum acceptable standards for all agent pages (pages in `src/pages/agents/`). All pages must meet or exceed these criteria to be considered "complete." These standards embody the **Neural Precision** and **Functional Elegance** design philosophies that define the VideoRemix VIP platform.

---

## Table of Contents

1. [Philosophy & Principles](#philosophy--principles)
2. [Input Field Standards](#input-field-standards)
3. [Button Standards](#button-standards)
4. [File Upload Standards](#file-upload-standards)
5. [Result Display Standards](#result-display-standards)
6. [Loading State Standards](#loading-state-standards)
7. [Error Handling Standards](#error-handling-standards)
8. [Empty State Standards](#empty-state-standards)
9. [Form Validation Standards](#form-validation-standards)
10. [State Persistence Standards](#state-persistence-standards)
11. [Responsive Layout Standards](#responsive-layout-standards)
12. [Accessibility Standards](#accessibility-standards)
13. [Animation Standards](#animation-standards)
14. [Visual Design System](#visual-design-system)
15. [Complete Page Checklist](#complete-page-checklist)

---

## Philosophy & Principles

### Neural Precision

Every UI element must feel like it was crafted by the convergence of artificial intelligence and human marketing intuition. The aesthetic speaks through **crystalline geometric frameworks** punctuated by **organic flow**. Balance **rigid grid structures** with **flowing elements**.

**Key expressions:**
- Deep indigo void (#1a1a2e) as the background
- Electric violet (#7c3aed) as neural pathways
- Vibrant coral (#f97316) as human warmth
- Cyan luminescence (#06b6d4) as clarity and insight
- Subtle grain texture suggesting tactile craftsmanship

### Functional Elegance

Each interface element serves a purpose while delivering aesthetic refinement. No decoration without function. "Space becomes the canvas for functional storytelling."

**Core tenets:**
- Purposeful design over decorative excess
- Generous white space frames key elements
- Forms emerge organically from functional requirements
- Colors serve function first, beauty second

### AI Slop Test

If someone could look at this interface and say "AI made that" without doubt, **it has failed**. Cross this checklist:

- [ ] **Not category-reflex:** Avoid "observability → dark blue" clichés. Healthcare shouldn't default to white + teal unless the scene demands it.
- [ ] **Not template-stale:** No hero-metric big number/small label clichés. No identical card grids. No side-stripe borders.
- [ ] **Not generically modern:** No gradient text. No glassmorphism as default. No modal-first thinking.
- [ ] **Copy has voice:** Every word earns its place. No restated headings. No em dashes.

**Write the scene sentence first:**
> "A business owner glances at this dashboard while sipping morning coffee in a softly lit home office, seeking quick insights to guide their day's decisions."

Then design for that specific human in that specific moment.

---

## Input Field Standards

### DO

✅ **Use descriptive labels with required indicators**
```tsx
<div className="space-y-2">
  <Label htmlFor="stock-symbol" className="text-sm font-medium text-gray-200">
    Stock Symbol <span className="text-red-500">*</span>
  </Label>
  <Input
    id="stock-symbol"
    type="text"
    value={symbol}
    onChange={(e) => setSymbol(e.target.value)}
    placeholder="Enter symbol (e.g., AAPL, GOOGL, TSLA)"
    className="bg-gray-900/50 border-gray-600 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
    aria-describedby="stock-symbol-help"
    required
    autoComplete="off"
  />
  <p id="stock-symbol-help" className="text-xs text-gray-400 mt-1">
    Enter a valid stock ticker symbol. Examples: AAPL (Apple), GOOGL (Google), TSLA (Tesla)
  </p>
</div>
```

✅ **Group related fields with visual separation**
```tsx
<FormSection title="API Configuration" description="Enter your OpenAI API key to enable AI features">
  <SmartInput
    label="OpenAI API Key"
    name="apiKey"
    value={apiKey}
    onChange={setApiKey}
    type="password"
    placeholder="sk-..."
    helperText="Your key is stored locally and never sent to our servers"
    required
  />
</FormSection>
```

✅ **Show input validation in real-time**
```tsx
<SmartInput
  label="Email Address"
  name="email"
  type="email"
  value={email}
  onChange={setEmail}
  error={email && !isValidEmail(email) ? "Please enter a valid email address" : ""}
/>
```

✅ **Provide example formats**
```tsx
<SmartTextarea
  label="CSV Data"
  name="csvData"
  value={csvData}
  onChange={setCsvData}
  placeholder="date,description,category,amount,type&#10;2024-01-15,Salary,Income,5000,income"
  helperText="Upload your transaction data. Required columns: date, description, category, amount, type"
  example={date,description,category,amount,type\n2024-01-15,Salary,Income,5000,income}
/>
```

### DON'T

❌ **Empty or generic placeholders**
```tsx
// BAD
<Input placeholder="" />
<Input placeholder="Enter input" />
<Input placeholder="Auto-detected input" />
```

❌ **Backend field names as UI labels**
```tsx
// BAD
<Label htmlFor="bulb_enter_your_query_about_the_pharmaceutical_industry">
  :bulb: Enter your query about the Pharmaceutical Industry
</Label>
```

❌ **No visual hierarchy**
```tsx
// BAD - all inputs same size, no grouping
<div>
  <Input /><Input /><Input /><Input />
</div>
```

---

## Button Standards

### Variants

**Primary (CTA):**
```tsx
<ActionButton
  variant="primary"
  onClick={handleSubmit}
  loading={isSubmitting}
  disabled={!isValid}
>
  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
  Search
</ActionButton>
```
- Gradient: `from-green-600 to-emerald-600`
- White text, rounded-lg, px-4 py-2
- Hover: brightness 110%
- Disabled: opacity 50%, cursor not-allowed

**Secondary:**
```tsx
<ActionButton variant="secondary" onClick={handleCancel}>
  Cancel
</ActionButton>
```
- Gray: `bg-gray-700 hover:bg-gray-600`
- White text, same size

**Ghost:**
```tsx
<ActionButton variant="ghost" onClick={handleClear}>
  Clear
</ActionButton>
```
- Transparent, hover `bg-gray-800`
- For low-emphasis actions

**Destructive:**
```tsx
<ActionButton variant="destructive" onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
  Delete
</ActionButton>
```
- Red: `bg-red-600 hover:bg-red-700`

### States

| State | Visual Treatment |
|-------|-----------------|
| Default | Standard styling per variant |
| Hover | Brightness 110%, slight scale 1.02 |
| Active | Scale 0.98, shadow inset |
| Focus | Ring 2px with brand color (e.g., `ring-green-500/50`) |
| Disabled | Opacity 0.5, cursor not-allowed |
| Loading | Spinner icon + "Processing..." text, disabled |

### Sizing

- **Small:** `h-8 px-3 text-sm` - icon buttons, compact UIs
- **Medium (default):** `h-10 px-4` - standard forms
- **Large:** `h-12 px-6 text-lg` - hero actions, primary CTAs

---

## File Upload Standards

### DO

✅ **Drag-and-drop zone with clear affordances**
```tsx
<FileUploadZone
  accept=".pdf,.txt,.docx"
  maxSize={10 * 1024 * 1024} // 10MB
  onFileSelect={handleFileSelect}
  selectedFile={file}
>
  <div className="text-center">
    <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
    <p className="text-sm font-medium">Drop your file here, or click to browse</p>
    <p className="text-xs text-gray-500 mt-1">PDF, TXT, DOCX up to 10MB</p>
  </div>
</FileUploadZone>
```

✅ **Show file preview and metadata**
```tsx
{selectedFile && (
  <div className="mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-between">
    <div className="flex items-center gap-3">
      <FileText className="h-8 w-8 text-blue-400" />
      <div>
        <p className="text-sm font-medium">{selectedFile.name}</p>
        <p className="text-xs text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </div>
    <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-white">
      <XCircle className="h-5 w-5" />
    </button>
  </div>
)}
```

✅ **Validate and show clear error messages**
```tsx
{error && (
  <ErrorMessage>
    {error}
  </ErrorMessage>
)}
```

### DON'T

❌ **Plain `<input type="file">` without styling**
❌ **No file size or type validation**
❌ **No feedback after selection**

---

## Result Display Standards

### NEVER Display Raw JSON

❌ **ALWAYS BAD:**
```tsx
<pre className="whitespace-pre-wrap">
  {JSON.stringify(result, null, 2)}
</pre>
```

### DO Use Formatted Component Cards

✅ **Single result as a card:**
```tsx
<ResultCard
  icon={<TrendingUp className="h-5 w-5" />}
  title="Stock Price"
  value="$173.45"
  subtext="+2.34% today"
  variant="success" // success | warning | error | neutral
/>
```

✅ **Multiple results in a grid:**
```tsx
<ResultGrid columns={2}>
  <ResultCard
    icon={<DollarSign className="h-5 w-5" />}
    title="Price"
    value={stockData.price.toFixed(2)}
    subtext="Last updated: just now"
  />
  <ResultCard
    icon={<Percent className="h-5 w-5" />}
    title="Change"
    value={`${stockData.changePercent.toFixed(2)}%`}
    subtext={stockData.change >= 0 ? "Gain" : "Loss"}
    variant={stockData.change >= 0 ? "success" : "error"}
  />
  <ResultCard
    icon={<BarChart3 className="h-5 w-5" />}
    title="Volume"
    value={formatNumber(stockData.volume)}
    subtext="Shares traded"
  />
  <ResultCard
    icon={<Clock className="h-5 w-5" />}
    title="Market Cap"
    value={formatMarketCap(stockData.marketCap)}
    subtext="Company valuation"
  />
</ResultGrid>
```

✅ **Tabular data in styled tables:**
```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-700">
        <th className="text-left py-3 px-4 font-medium text-gray-300">Date</th>
        <th className="text-left py-3 px-4 font-medium text-gray-300">Type</th>
        <th className="text-right py-3 px-4 font-medium text-gray-300">Amount</th>
      </tr>
    </thead>
    <tbody>
      {transactions.map((tx) => (
        <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-900/30">
          <td className="py-3 px-4">{formatDate(tx.date)}</td>
          <td className="py-3 px-4">
            <span className={`px-2 py-1 rounded text-xs ${tx.type === 'income' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {tx.type}
            </span>
          </td>
          <td className={`py-3 px-4 text-right font-medium ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

✅ **Lists with proper styling:**
```tsx
<div className="space-y-2">
  {items.map((item) => (
    <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium">{item.title}</p>
        <p className="text-sm text-gray-400">{item.description}</p>
      </div>
    </div>
  ))}
</div>
```

---

## Loading State Standards

### Button-Embedded Loading

```tsx
<button
  onClick={handleSearch}
  disabled={isLoading || !query.trim()}
  className="..."
>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      Searching...
    </>
  ) : (
    <>
      <Search className="h-4 w-4" />
      Search
    </>
  )}
</button>
```

### Full-Page Loading Indicator

```tsx
{isLoading && (
  <LoadingIndicator
    message="Analyzing your portfolio with AI..."
    progress={progress} // optional 0-100
  />
)}
```

**Component API:**
```tsx
interface LoadingIndicatorProps {
  message: string;
  progress?: number; // undefined = indeterminate spinner
  subtext?: string;
}
```

**Renders:**
```tsx
<div className="flex flex-col items-center justify-center py-12">
  <Loader2 className="h-12 w-12 animate-spin text-green-500 mb-4" />
  <p className="text-lg font-medium text-white">{message}</p>
  {subtext && <p className="text-sm text-gray-400 mt-2">{subtext}</p>}
  {progress !== undefined && (
    <div className="mt-4 w-full max-w-md">
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-600 to-emerald-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">{progress}% complete</p>
    </div>
  )}
</div>
```

---

## Error Handling Standards

### Styled Error Box with Retry

```tsx
{error && (
  <ErrorMessage
    title="Failed to fetch stock data"
    message={error.message || "An unexpected error occurred. Please try again."}
    onRetry={fetchStockData}
    retryLoading={retryLoading}
  />
)}
```

**Component API:**
```tsx
interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLoading?: boolean;
  className?: string;
}
```

**Renders:**
```tsx
<div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    {title && <p className="font-medium text-red-300">{title}</p>}
    <p className="text-sm text-red-200">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        disabled={retryLoading}
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-200 underline"
      >
        {retryLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        Try again
      </button>
    )}
  </div>
</div>
```

### API Error Handling Pattern

```tsx
const [error, setError] = useState<Error | null>(null);

try {
  const response = await fetch(...);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || `Request failed (${response.status})`);
  }
  const result = await response.json();
  setResult(result);
  setError(null);
} catch (err) {
  setError(err instanceof Error ? err : new Error('Unknown error'));
}
```

---

## Empty State Standards

### Purpose

Empty states are not "blank screens." They are **opportunities for guidance**. Every empty state must explain:
1. **Why** it's empty (no data yet, search yielded nothing, error cleared)
2. **What** the user can do next
3. **How** to get started (examples, suggestions)

### Pattern

```tsx
{!data || data.length === 0 ? (
  <EmptyState
    icon={<BarChart2 className="h-16 w-16 text-gray-600" />}
    title="No portfolio data yet"
    description="Add your first stock holding to start tracking your investments and get AI-powered insights."
    action={
      <Button onClick={() => setShowAddModal(true)}>
        <Plus className="h-4 w-4" />
        Add Your First Holding
      </Button>
    }
    tips={[
      "Enter a stock symbol like AAPL or GOOGL",
      "Add the number of shares you own",
      "Set your purchase price for gain/loss tracking"
    ]}
  />
) : (
  // Render actual data
)}
```

**Component API:**
```tsx
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode; // Button or CTA
  tips?: string[]; // Optional numbered tips
  image?: string; // Optional illustration image URL
}
```

**Renders:**
```tsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="mb-4 opacity-50">{icon}</div>
  <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
  <p className="text-gray-400 max-w-md mb-6">{description}</p>
  {action && <div className="mb-6">{action}</div>}
  {tips && tips.length > 0 && (
    <div className="w-full max-w-md">
      <p className="text-sm font-medium text-gray-300 mb-3">Quick tips:</p>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">
              {i + 1}
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )}
</div>
```

---

## Form Validation Standards

### Real-time Validation with Clear Feedback

```tsx
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState('');

const validateEmail = (value: string) => {
  if (!value) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Please enter a valid email address';
  }
  return '';
};

useEffect(() => {
  setEmailError(validateEmail(email));
}, [email]);

return (
  <div className="space-y-2">
    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
    <Input
      id="email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className={emailError ? 'border-red-500 focus:border-red-500' : ''}
    />
    {emailError && (
      <p className="text-sm text-red-400 flex items-center gap-1">
        <AlertCircle className="h-4 w-4" />
        {emailError}
      </p>
    )}
  </div>
);
```

### Submission Prevention

```tsx
const handleSubmit = async () => {
  // Validate all fields
  const errors = [emailError, apiKeyError].filter(Boolean);
  if (errors.length > 0) {
    setSubmitError('Please fix the errors above before submitting');
    return;
  }

  // Proceed
};
```

---

## State Persistence Standards

### When to Persist

✅ **Persist:**
- User preferences (theme, layout)
- Draft form data (unsaved inputs)
- Session state (chat history, recent searches)
- Portfolio data (FinanceAgent example)
- API keys (stored securely, encrypted if possible)

❌ **Don't Persist:**
- Sensitive credentials (unless encrypted)
- Temporary loading/error states
- One-time use data

### Pattern

```tsx
// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('agent-session-data');
  if (saved) {
    try {
      setFormData(JSON.parse(saved));
    } catch (e) {
      console.warn('Failed to parse saved data');
    }
  }
}, []);

// Save on change
useEffect(() => {
  localStorage.setItem('agent-session-data', JSON.stringify(formData));
}, [formData]);

// Clear on successful submission
const handleSubmit = async () => {
  const result = await apiCall(formData);
  localStorage.removeItem('agent-session-data');
  setResult(result);
};
```

---

## Responsive Layout Standards

### Mobile-First Breakpoints

- **Base (mobile):** Single column, full-width inputs
- **sm (640px):** Slight padding adjustments
- **md (768px):** Two-column grids for related fields
- **lg (1024px):** Multi-column layouts (3-4 columns)
- **xl (1280px):** Expansive dashboards with sidebars

### Forms

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <SmartInput label="First Name" name="firstName" ... />
  <SmartInput label="Last Name" name="lastName" ... />
</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content, wider on large screens */}
  </div>
  <div className="lg:col-span-1">
    {/* Sidebar */}
  </div>
</div>
```

### Tables

```tsx
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>
```

---

## Accessibility Standards

### ARIA Attributes Every Input Needs

```tsx
<Input
  id="unique-id"
  aria-label="Descriptive label if visible label not present"
  aria-describedby="help-text-id error-message-id"
  aria-invalid={!!error}
  aria-required="true"
/>
```

**Always:**
- `id` on input matches `htmlFor` on `<Label>`
- `aria-describedby` references helper text and error message IDs
- `aria-invalid="true"` when field has error
- `aria-required="true"` for required fields

### Keyboard Navigation

```tsx
// Tabs for multi-section layouts
<div role="tablist" aria-label="Agent sections">
  <button
    role="tab"
    aria-selected={activeTab === 'config'}
    tabIndex={activeTab === 'config' ? 0 : -1}
    onClick={() => setActiveTab('config')}
  >
    Configuration
  </button>
</div>

// Modal trap focus
useEffect(() => {
  const handleTab = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      // Trap within modal
    }
  };
  window.addEventListener('keydown', handleTab);
  return () => window.removeEventListener('keydown', handleTab);
}, [isOpen]);
```

### Focus Management

```tsx
// Clear visible focus
<button className="focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900">
  Click me
</button>
```

### Screen Reader Only Text

```tsx
<span className="sr-only">
  Required field
</span>
```

### Color Contrast

- **Normal text:** AA = 4.5:1, AAA = 7:1
- **Large text (18pt+):** AA = 3:1, AAA = 4.5:1
- **UI components:** AA = 3:1

Use browser DevTools or axe-core to verify.

### Reduced Motion

```tsx
const prefersReducedMotion = useReducedMotion();

< motion.div
  initial={prefersReducedMotion ? false : { opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Animation Standards

### Principles

- **Purposeful:** Animations communicate state changes, not decoration
- **Subtle:** 300ms duration standard, ease-out-quint
- **Performant:** Animate `opacity` and `transform` only (no layout)
- **Respectful:** Honor `prefers-reduced-motion`

### Common Patterns

**Fade In:**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
/>
```

**Slide Up:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
/>
```

**Staggered List Entrance:**
```tsx
<AnimatePresence>
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    />
  ))}
</AnimatePresence>
```

### Easing Curves

Use `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out-quint) for all animations. No bounce, no elastic, no ease-in.

---

## Visual Design System

### Color Palette

**Neutral Base (Dark):**
```css
--color-bg-primary: #1a1a2e;      /* Deep indigo void */
--color-bg-secondary: #16162a;    /* Slightly darker */
--color-bg-tertiary: #252540;     /* Cards, elevated surfaces */
--color-bg-input: #0f0f1a;        /* Input backgrounds */
```

**Brand Accents:**
```css
--color-violet: #7c3aed;         /* Electric violet - neural pathways */
--color-coral: #f97316;          /* Vibrant coral - human warmth */
--color-cyan: #06b6d4;           /* Cyan luminescence - clarity */
--color-green: #10b981;          /* Success, growth */
--color-red: #ef4444;            /* Errors, destructive */
```

**Text Hierarchy:**
```css
--color-text-primary: #f3f4f6;   /* Main content */
--color-text-secondary: #9ca3af; /* Labels, metadata */
--color-text-muted: #6b7280;    /* Disabled, hints */
```

### Typography

- **Font Family:** Inter (system default fallback)
- **Body:** 16px / 1.6 line-height
- **H1:** 36px / 1.2 (page title)
- **H2:** 28px / 1.3 (section header)
- **H3:** 22px / 1.4 (card title)
- **Small:** 14px (helper text, labels)
- **Tiny:** 12px (metadata, captions)

### Spacing Scale (4px base)

- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px

Use multiples for rhythm. No arbitrary spacing.

### Borders & Radius

- **Border radius:** 8px (primary), 4px (secondary)
- **Border width:** 1px standard, 2px for focus states
- **Cards:** `bg-gray-900/50 border border-gray-700`
- **Inputs:** `bg-gray-900/50 border border-gray-600`

### Shadows

- **Level 1 (card):** `box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);`
- **Level 2 (floating):** `0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2);`
- **Level 3 (modal):** `0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.2);`

Use Tailwind classes: `shadow-lg`, `shadow-xl`.

---

## Complete Page Checklist

Use this to verify an agent page is "complete" (score ≥85/100):

**Inputs & Controls (30 pts)**
- [ ] All inputs have `<Label>` with `htmlFor` matching input `id`
- [ ] All inputs have descriptive `placeholder` text with examples (>15 chars)
- [ ] Required fields marked with `*` and `aria-required="true"`
- [ ] Input error messages displayed with appropriate styling
- [ ] File upload components use styled zones, not raw `<input type="file">`

**Helper Text & Guidance (10 pts)**
- [ ] Each input has helper text or description (via `aria-describedby`)
- [ ] Helper text explains format, constraints, or purpose
- [ ] Example values or formats shown when helpful
- [ ] Example prompts provided for free-text AI inputs

**Result Display (15 pts)**
- [ ] Results displayed using `<ResultCard>`, `<ResultGrid>`, or styled tables
- [ ] Zero raw JSON or `JSON.stringify` in final UI
- [ ] Data formatted with appropriate formatting (currency, dates, numbers)
- [ ] Visual hierarchy in results (primary values emphasized, secondary subdued)
- [ ] Empty results trigger `<EmptyState>` component

**Loading States (10 pts)**
- [ ] All async operations show `<LoadingIndicator>` or button spinner
- [ ] Loading state includes descriptive message ("Fetching data...", "Processing...")
- [ ] Progress bar used for multi-step operations
- [ ] Buttons disabled during submission
- [ ] Loading state provides time estimate when possible

**Error Handling (10 pts)**
- [ ] All fetch calls wrapped in try/catch with error state
- [ ] Errors displayed in `<ErrorMessage>` component with clear language
- [ ] Error messages explain what went wrong (not just "Error 500")
- [ ] Retry button included where appropriate
- [ ] Network failures have helpful suggestions

**Empty States (10 pts)**
- [ ] All "no data" conditions render `<EmptyState>` component
- [ ] Empty states include icon, title, description
- [ ] Empty states suggest next action with CTA button
- [ ] Empty states include numbered tips or examples

**State Persistence (5 pts)**
- [ ] User-input data persisted to localStorage (when appropriate)
- [ ] Data restored on page reload
- [ ] Persistence cleared on successful submission

**Responsive Design (5 pts)**
- [ ] Uses responsive grid classes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- [ ] Tables scroll horizontally on mobile (`overflow-x-auto`)
- [ ] Touch targets ≥44×44px on mobile
- [ ] Single column layout on screens <768px

**Accessibility (10 pts)**
- [ ] All interactive elements have `aria-label` or visible label
- [ ] Form inputs use `<Label>` with `htmlFor`
- [ ] `aria-describedby` links inputs to helper/error text
- [ ] `aria-invalid="true"` on fields with errors
- [ ] Keyboard navigation works (Tab, Enter, Esc, arrows)
- [ ] Focus visible with clear ring (no `outline: none` without replacement)
- [ ] Skip links or logical heading structure (h1 → h2 → h3)
- [ ] Color contrast passes WCAG AA (4.5:1 for normal text)

**Animation & Polish (5 pts)**
- [ ] Page elements fade in on mount (300ms)
- [ ] Staggered entrance for form fields (50ms each)
- [ ] Button hover scale (1.02)
- [ ] Reduced motion respected (`matchMedia('(prefers-reduced-motion: reduce)')`)
- [ ] Smooth transitions between states (≤200ms)

**Visual Consistency (5 pts)**
- [ ] Color palette matches "Neural Precision" (indigo, violet, coral, cyan)
- [ ] Typography follows scale (no arbitrary sizes)
- [ ] Spacing follows 4px rhythm
- [ ] Borders consistent (1px, radius 8px)
- [ ] No design system violations (no gradient text, no side-stripe borders)

**Total: 105 points (scale to 100) → Complete ≥85, Partial 50-84, Minimal <50**

---

## Upgrade Process

Every page upgrade follows these steps:

1. **Analyze** - Read the page, identify all failing checklist items
2. **Refactor** - Replace shadcn Input with SmartInput, raw JSON with ResultCard, add helper text, empty states, localStorage
3. **Polish** - Apply Neural Precision styling, animations, responsive behavior
4. **Verify** - Test keyboard nav, screen reader, mobile view, run audit script on modified page
5. **Commit** - `git commit -m "feat(agent): enhance UI/UX for <AppName>"`

Reference the **Reference Implementation Blueprint** for detailed code patterns.

---

## Component Library Reference

All reusable UI components live in `src/components/agent-ui/`:

| Component | Purpose | Import |
|-----------|---------|--------|
| `SmartInput` | Enhanced text input | `@/components/agent-ui/SmartInput'` |
| `SmartTextarea` | Multi-line textarea | `@/components/agent-ui/SmartTextarea'` |
| `FileUploadZone` | Drag-and-drop upload | `@/components/agent-ui/FileUploadZone'` |
| `ResultCard` | Single result display | `@/components/agent-ui/ResultCard'` |
| `ResultGrid` | Responsive result grid | `@/components/agent-ui/ResultGrid'` |
| `LoadingIndicator` | Loading spinner + message | `@/components/agent-ui/LoadingIndicator'` |
| `ErrorMessage` | Styled error with retry | `@/components/agent-ui/ErrorMessage'` |
| `EmptyState` | Empty data guidance | `@/components/agent-ui/EmptyState'` |
| `ExamplePrompt` | Clickable example text | `@/components/agent-ui/ExamplePrompt'` |
| `FormSection` | Grouped form fields | `@/components/agent-ui/FormSection'` |
| `ApiKeyInput` | Secure API key input | `@/components/agent-ui/ApiKeyInput'` |
| `ActionButton` | Consistent buttons | `@/components/agent-ui/ActionButton'` |
| `ToggleSwitch` | Boolean toggle | `@/components/agent-ui/ToggleSwitch'` |
| `SelectDropdown` | Custom select | `@/components/agent-ui/SelectDropdown'` |

Each component has TypeScript interfaces, full accessibility, and follows the design system.

---

## Reference Implementations

Study these pages as gold standards:

1. **FinanceAgentPage.tsx** - Complete form with inputs, validation, localStorage, result cards
2. **WebScrapingAgentPage.tsx** - URL input, mode selection, results display
3. **ReasoningAgentPage.tsx** - Question input, mode selector, formatted outputs

See `docs/reference-implementation-blueprint.md` for annotated breakdowns.

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-08  
**Applies To:** All files in `src/pages/agents/*.tsx`
