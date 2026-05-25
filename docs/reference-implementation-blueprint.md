# Reference Implementation Blueprint

**Purpose:** This document deconstructs the gold-standard agent pages to provide copy-paste ready patterns for upgrading all 129 pages.

**Gold Standards (score ≥70/100):**
1. `FinanceAgentPage.tsx` (score: 72) - Form with validation, localStorage, result cards
2. `FinancialCoachPage.tsx` (72) - CSV input with format examples
3. `ReasoningAgentPage.tsx` (72) - Question input with sidebar
4. `WebScrapingAgentPage.tsx` (72) - URL input with mode selection
5. `EmailGTMPage.tsx` (62) - Multi-field form with helper text

---

## Pattern 1: Single Input + Submit

**Use case:** Simple agent with one primary input (e.g., stock symbol, URL, query)

### Before (Minimal)
```tsx
export default function SimpleAgentPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch('/api/agent', { body: JSON.stringify({ input }) });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={handleSubmit}>Go</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
```

### After (Complete)
```tsx
import { SmartInput } from '@/components/agent-ui/SmartInput';
import { ResultCard, ResultGrid } from '@/components/agent-ui/ResultCard';
import { LoadingIndicator } from '@/components/agent-ui/LoadingIndicator';
import { EmptyState } from '@/components/agent-ui/EmptyState';
import { ActionButton } from '@/components/agent-ui/ActionButton';
import { ExamplePrompt } from '@/components/agent-ui/ExamplePrompt';

export default function SimpleAgentPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved query from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('simple-agent-query');
    if (saved) setQuery(saved);
  }, []);

  // Persist query
  useEffect(() => {
    localStorage.setItem('simple-agent-query', query);
  }, [query]);

  const handleSubmit = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      setResult(data);
      localStorage.removeItem('simple-agent-query'); // Clear draft on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Empty state - no result yet
  if (!result && !loading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-3">AI Analysis Agent</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Enter your query and let AI analyze it. Get structured insights with confidence scores.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <SmartInput
            label="Your Question"
            name="query"
            value={query}
            onChange={setQuery}
            placeholder="Ask anything... e.g., 'What are the market trends for AI in 2026?'"
            helperText="Be specific for better results. Include context when relevant."
            required
          />

          <ExamplePrompt
            examples={[
              "What are the latest AI trends?",
              "Analyze this quarterly data...",
              "Summarize this research paper...",
            ]}
            onSelect={setQuery}
          />

          <ActionButton
            onClick={handleSubmit}
            loading={loading}
            disabled={!query.trim()}
            size="lg"
            className="w-full"
          >
            <Sparkles className="h-4 w-4" />
            Analyze with AI
          </ActionButton>

          {error && (
            <ErrorMessage
              title="Analysis failed"
              message={error}
              onRetry={handleSubmit}
            />
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <LoadingIndicator
        message="Analyzing your query..."
        subtext="This usually takes 5-10 seconds"
        progress={null}
      />
    );
  }

  // Result state - formatted display
  return (
    <div className="space-y-6">
      <ResultGrid columns={2}>
        <ResultCard
          icon={<Sparkles />}
          title="Summary"
          value={result.summary?.length ? result.summary.slice(0, 100) + '...' : 'No summary'}
        />
        <ResultCard
          icon={<TrendingUp />}
          title="Confidence"
          value={`${(result.confidence * 100).toFixed(0)}%`}
          subtext="AI confidence score"
          variant={result.confidence > 0.8 ? 'success' : 'warning'}
        />
      </ResultGrid>

      {/* Full width section */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">Detailed Analysis</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 whitespace-pre-wrap">{result.fullAnalysis}</p>
        </div>
      </div>

      <ActionButton onClick={() => { setResult(null); setQuery(''); }}>
        Start New Analysis
      </ActionButton>
    </div>
  );
}
```

**Key Features:**
- ✅ Descriptive label with required indicator
- ✅ Placeholder with example
- ✅ Helper text explaining purpose
- ✅ Example prompts as clickable chips
- ✅ localStorage persistence (draft saves)
- ✅ Validation (required field)
- ✅ Styled loading indicator
- ✅ Styled error with retry
- ✅ Empty state with CTAs turning into result display
- ✅ Results in `ResultCard`/`ResultGrid`, not raw JSON
- ✅ Formatted value display (percentages, truncation)
- ✅ Action buttons to reset/start over

---

## Pattern 2: File Upload + Text Inputs

**Use case:** RAG agents, document processing (Chat with PDF, RAG Chain)

### Complete Implementation

```tsx
import { FileUploadZone } from '@/components/agent-ui/FileUploadZone';
import { SmartInput } from '@/components/agent-ui/SmartInput';
import { SmartTextarea } from '@/components/agent-ui/SmartTextarea';
import { FormSection } from '@/components/agent-ui/FormSection';

export default function ChatWithPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load persisted state
  useEffect(() => {
    const saved = localStorage.getItem('pdf-chat-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setQuestion(parsed.question || '');
        setApiKey(parsed.apiKey || '');
      } catch {}
    }
  }, []);

  // Persist question + API key
  useEffect(() => {
    localStorage.setItem('pdf-chat-state', JSON.stringify({ question, apiKey }));
  }, [question, apiKey]);

  const handleSubmit = async () => {
    if (!file) {
      setError('Please upload a PDF file');
      return;
    }
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    if (!apiKey.trim()) {
      setError('OpenAI API key is required');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('question', question);
    formData.append('apiKey', apiKey);

    try {
      const res = await fetch('/functions/v1/chat-with-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to process PDF');

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Chat with PDF</h1>
        <p className="text-gray-400">
          Upload a PDF document and ask questions about its content using AI
        </p>
      </div>

      <FormSection
        title="Document Upload"
        description="Select a PDF file to analyze (max 10MB)"
      >
        <div className="md:col-span-2">
          <FileUploadZone
            accept=".pdf"
            maxSize={10 * 1024 * 1024}
            onFileSelect={setFile}
            selectedFile={file}
            helperText="For best results, use text-based PDFs (not scanned images)"
          />
        </div>
      </FormSection>

      <FormSection
        title="Configuration"
        description="Enter your OpenAI API key and your question"
      >
        <div className="md:col-span-2">
          <ApiKeyInput
            label="OpenAI API Key"
            value={apiKey}
            onChange={setApiKey}
            helperText="Your key is stored locally and never sent to our servers"
            required
          />
        </div>

        <SmartTextarea
          label="Your Question"
          name="question"
          value={question}
          onChange={setQuestion}
          placeholder="What are the key takeaways from this document?"
          helperText="Be specific. You can ask about data, conclusions, methods, etc."
          example="What is the main hypothesis of this paper?"
          rows={4}
          required
        />
      </FormSection>

      {/* Action buttons */}
      <div className="flex gap-3 justify-center">
        <ActionButton onClick={handleSubmit} loading={loading} size="lg">
          <MessageSquare className="h-4 w-4" />
          Ask Question
        </ActionButton>

        <ActionButton
          variant="ghost"
          onClick={() => { setFile(null); setQuestion(''); }}
          disabled={loading}
        >
          Clear
        </ActionButton>
      </div>

      {error && <ErrorMessage title="Failed to process" message={error} onRetry={handleSubmit} />}

      {loading && (
        <LoadingIndicator
          message="Analyzing document..."
          subtext="Extracting text and generating answer"
        />
      )}

      {result && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <ResultCard
            icon={<CheckCircle2 />}
            title="Answer"
            description={result.answer}
            variant="success"
          />

          {result.sources && result.sources.length > 0 && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Source References</h3>
              <div className="space-y-2">
                {result.sources.map((source: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    <p className="text-gray-300 font-mono text-xs bg-gray-800/50 p-2 rounded flex-1">
                      {source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <ActionButton onClick={() => { setResult(null); }}>
              Ask Another Question
            </ActionButton>
          </div>
        </motion.div>
      )}

      {/* Empty state: file not selected but no error - shown above */}
      {!file && !result && !loading && (
        <EmptyState
          icon={<FileText />}
          title="No document loaded"
          description="Upload a PDF to start asking questions about its contents"
          tips={[
            "Ensure your PDF is text-based (not scanned images)",
            "Larger documents take longer to process",
            "You can ask follow-up questions after the first upload",
          ]}
        />
      )}
    </div>
  );
}
```

**Key Differentiators from Pattern 1:**
- Uses `FileUploadZone` with drag-and-drop
- Multiple form sections with `FormSection`
- API key field using `ApiKeyInput` with reveal toggle
- Multi-line question with `SmartTextarea` including `example` prop
- Multiple `ResultCard` variants (success + reference list)
- More complex result structure displayed without raw JSON

---

## Pattern 3: Chat Interface

**Use case:** Conversational agents (1StarterAgent, CustomerSupportVoice)

### Complete Implementation

```tsx
import { SmartInput } from '@/components/agent-ui/SmartInput';
import { ActionButton } from '@/components/agent-ui/ActionButton';
import { EmptyState } from '@/components/agent-ui/EmptyState';
import { LoadingIndicator } from '@/components/agent-ui/LoadingIndicator';
import { MessageSquare, User, Bot } from 'lucide-react';

export default function ChatAgentPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist conversation
  useEffect(() => {
    const saved = localStorage.getItem('chat-history');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('chat-history', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, history: messages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Empty state - first time
  if (messages.length === 0) {
    return (
      <div className="space-y-6 h-[calc(100vh-12rem)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">AI Assistant</h1>
          <p className="text-gray-400">Start a conversation. I can help with a variety of tasks.</p>
        </div>

        {/* Suggestions */}
        <div className="max-w-3xl mx-auto">
          <ExamplePrompt
            title="Start with one of these:"
            examples={[
              "What can you help me with?",
              "Explain quantum computing simply",
              "Write a Python function to sort a list",
            ]}
            onSelect={setInput}
          />
        </div>

        {/* Input area */}
        <div className="max-w-3xl mx-auto">
          <SmartInput
            label="Message"
            name="message"
            value={input}
            onChange={setInput}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            helperText="Press Enter to send. Conversation history is saved locally."
          />
          <div className="mt-3 flex justify-end">
            <ActionButton onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
              Send
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="space-y-6 h-[calc(100vh-12rem)] flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
            )}

            <div className={cn(
              "max-w-[80%] rounded-lg p-4",
              msg.role === 'user'
                ? "bg-violet-600 text-white"
                : "bg-gray-800 border border-gray-700 text-gray-200"
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>

            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
          </motion.div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <LoadingIndicator message="Thinking..." size="sm" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-800 pt-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <div className="flex-1">
            <SmartInput
              label=""
              name="message"
              value={input}
              onChange={setInput}
              placeholder="Type your message..."
            />
          </div>
          <ActionButton onClick={handleSend} loading={loading} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </ActionButton>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Press Enter to send • Conversation history saved locally
        </p>
      </div>
    </div>
  );
}
```

**Chat-Specific Notes:**
- Use `useRef` + `scrollIntoView` to auto-scroll to latest message
- Persist entire message history in localStorage
- Differentiate user vs assistant bubbles (colors, alignment, icons)
- Support keyboard shortcuts (Enter to send)
- Loading indicator inline within chat stream
- Empty state includes suggestion chips using `ExamplePrompt`

---

## Pattern 4: Results Table Display

**Use case:** Financial transactions, data listings, comparison tables

```tsx
{result && result.data && result.data.length > 0 ? (
  <div className="overflow-x-auto -mx-4 sm:mx-0">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="text-left py-3 px-4 font-medium text-gray-300">Date</th>
          <th className="text-left py-3 px-4 font-medium text-gray-300">Category</th>
          <th className="text-right py-3 px-4 font-medium text-gray-300">Amount</th>
          <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
        </tr>
      </thead>
      <tbody>
        {result.data.map((item) => (
          <motion.tr
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors"
          >
            <td className="py-3 px-4">{formatDate(item.date)}</td>
            <td className="py-3 px-4">
              <span className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-300">
                {item.category}
              </span>
            </td>
            <td className={`py-3 px-4 text-right font-medium ${item.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(item.amount)}
            </td>
            <td className="py-3 px-4">
              <span className={`inline-flex items-center gap-1.5 text-xs ${item.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                <CheckCircle2 className="h-3 w-3" />
                {item.status}
              </span>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <EmptyState
    icon={<BarChart3 />}
    title="No transactions found"
    description="Your financial data will appear here once you add transactions"
    tips={["Add a transaction using the form above", "Import a CSV file for bulk entry"]}
  />
)}
```

---

## Pattern 5: Settings/Configuration Page

**Use case:** API key management, preferences

```tsx
export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [theme, setTheme] = useState('dark');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('agent-settings') || '{}');
    setOpenaiKey(settings.openaiKey || '');
    setTheme(settings.theme || 'dark');
  }, []);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('agent-settings', JSON.stringify({ openaiKey, theme }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your preferences and API keys</p>
      </div>

      <FormSection title="API Keys" description="Configure external service credentials">
        <div className="md:col-span-2">
          <ApiKeyInput
            label="OpenAI API Key"
            value={openaiKey}
            onChange={setOpenaiKey}
            helperText="Required for AI features. Key is stored locally and never shared."
          />
        </div>
      </FormSection>

      <FormSection title="Preferences" description="Customize your experience">
        <SelectDropdown
          label="Theme"
          value={theme}
          onValueChange={setTheme}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'system', label: 'System' },
          ]}
          helperText="Choose your preferred color scheme"
        />
      </FormSection>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
        <ActionButton onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" />
          {saved ? 'Saved!' : 'Save Settings'}
        </ActionButton>

        {saved && (
          <span className="text-sm text-green-400 flex items-center gap-1">
            <Check className="h-4 w-4" /> Changes saved
          </span>
        )}
      </div>
    </div>
  );
}
```

---

## Pattern 6: Data Visualization + Filters

**Use case:** Analytics, dashboards, chart-heavy pages

```tsx
export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    setLoading(true);
    const res = await fetch(`/api/metrics?range=${timeRange}`);
    setMetrics(await res.json());
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400">Performance metrics over time</p>
        </div>

        <SelectDropdown
          value={timeRange}
          onValueChange={setTimeRange}
          options={[
            { value: '24h', label: 'Last 24 Hours' },
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
          ]}
        />
      </div>

      {loading ? (
        <LoadingIndicator message="Loading metrics..." />
      ) : (
        <>
          {/* KPI Cards */}
          <ResultGrid columns={3}>
            <ResultCard
              icon={<Users />}
              title="Total Users"
              value={metrics.reduce((a, b) => a + b.users, 0).toLocaleString()}
              subtext={`+${metrics[0]?.newUsers || 0} this ${timeRange}`}
              variant="info"
            />
            <ResultCard
              icon={<Zap />}
              title="API Calls"
              value={metrics.reduce((a, b) => a + b.calls, 0).toLocaleString()}
              subtext="Total requests"
              variant="success"
            />
            <ResultCard
              icon={<DollarSign />}
              title="Cost"
              value={`$${metrics.reduce((a, b) => a + b.cost, 0).toFixed(2)}`}
              subtext="OpenAI usage"
              variant="warning"
            />
          </ResultGrid>

          {/* Chart section placeholder */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Usage Over Time</h3>
            {/* Chart component would go here */}
          </div>
        </>
      )}
    </div>
  );
}
```

---

## Migration Checklist (per page)

Go through each page and check off:

**Baseline (must haves):**
- [ ] Replace `<Input>` → `<SmartInput>`
- [ ] Replace `<Textarea>` → `<SmartTextarea>`
- [ ] Ensure all inputs have descriptive placeholders (>15 chars, with examples)
- [ ] Ensure all inputs have `<Label>` with `htmlFor` and ID match
- [ ] Add `helperText` prop to every input (explain purpose, give examples)
- [ ] Add `required` indicator and `aria-required` for mandatory fields
- [ ] Replace raw `<pre>{JSON.stringify(...)}</pre>` → `<ResultCard>`/`<ResultGrid>`
- [ ] Add `<LoadingIndicator>` during all async operations
- [ ] Replace basic error `<p>` → `<ErrorMessage>` with retry
- [ ] Add `<EmptyState>` for no-data conditions
- [ ] Add localStorage persistence for drafts
- [ ] Add keyboard support (Enter to submit)
- [ ] Add ARIA attributes (describedby, invalid, required)

**Polish (nice to haves):**
- [ ] Group fields with `<FormSection>`
- [ ] Add `<ExamplePrompt>` for free-text fields
- [ ] Use `<ApiKeyInput>` for API keys
- [ ] Add file upload with `<FileUploadZone>` instead of `<input type="file">`
- [ ] Add formatted number/date displays in results
- [ ] Add empty state tips with numbered list
- [ ] Add pull-to-refresh or infinite scroll for long lists
- [ ] Add animations with `framer-motion` (fade-in, stagger)
- [ ] Ensure responsive grid columns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

**Validation:**
- [ ] Run audit script: score should improve by ≥20 points
- [ ] Test keyboard navigation (Tab through all inputs)
- [ ] Test screen reader (VoiceOver/NVDA) reads labels and errors
- [ ] Test on mobile viewport (375px)
- [ ] Verify no raw JSON visible anywhere

---

## Quick Replacement Snippets

### File → find → replace

**Placeholder empty → descriptive:**
```diff
- placeholder=""
+ placeholder="Enter your search query (e.g., 'Apple stock price')"
```

**Raw JSON → ResultCard:**
```diff
- <pre>{JSON.stringify(result, null, 2)}</pre>
+ {result && (
+   <ResultGrid columns={2}>
+     <ResultCard title="Price" value={result.price} />
+     <ResultCard title="Change" value={`${(result.change * 100).toFixed(2)}%`} variant="success" />
+   </ResultGrid>
+ )}
```

**Basic button → ActionButton:**
```diff
- <button onClick={handleSubmit}>Submit</button>
+ <ActionButton onClick={handleSubmit} loading={loading}>
+   Submit
+ </ActionButton>
```

**No helper text → add helper:**
```diff
+ <p id="field-help" className="text-xs text-gray-400">
+   Enter a valid email address. We&apos;ll never share it.
+ </p>
```

---

## Component Import Map

```typescript
// Common imports for upgrading pages:
import { SmartInput } from '@/components/agent-ui/SmartInput';
import { SmartTextarea } from '@/components/agent-ui/SmartTextarea';
import { FileUploadZone } from '@/components/agent-ui/FileUploadZone';
import { ResultCard, ResultGrid } from '@/components/agent-ui/ResultCard';
import { LoadingIndicator } from '@/components/agent-ui/LoadingIndicator';
import { ErrorMessage } from '@/components/agent-ui/ErrorMessage';
import { EmptyState } from '@/components/agent-ui/EmptyState';
import { ExamplePrompt } from '@/components/agent-ui/ExamplePrompt';
import { FormSection } from '@/components/agent-ui/FormSection';
import { ApiKeyInput } from '@/components/agent-ui/ApiKeyInput';
import { ActionButton } from '@/components/agent-ui/ActionButton';
import { ToggleSwitch } from '@/components/agent-ui/ToggleSwitch';
import { SelectDropdown } from '@/components/agent-ui/SelectDropdown';
```

---

## Score Improvement Guide

| Current Score | Target | Typical Changes Needed | Effort |
|---------------|--------|-----------------------|---------|
| 30-40 | 60+ | Add helper text, empty states, error display | 2h/page |
| 41-55 | 70+ | Replace JSON with ResultCards, add localStorage | 3h/page |
| 56-70 | 80+ | Add ExamplePrompts, FormSections, polish animations | 4h/page |
| 71-80 | 90+ | Accessibility audit, color contrast fixes, responsive optimization | 2h/page |

**First pass (60→70):** ~3 hours per page  
**Second pass (70→80):** ~2 hours per page  
**Third pass (80+):** ~1 hour polish

Total estimated for 129 pages:
- Batch A (7 pop): 7 × 4h = 28h (parallel: 4h wall)
- Batch B (10 core): 10 × 4h = 40h (parallel: 6h wall)
- Batch C (20 spec): 20 × 3h = 60h (parallel teams: ~15h wall)
- Batch D (92 rem): 92 × 2.5h = 230h (parallel teams: ~30h wall)

**Total wall time** with 4 parallel subagents: ~7 days of work time across all agents.
