# AI Apps Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance all 95 AI apps with tab-based results UI, copy/save/expand controls, WebSocket streaming, multi-turn conversations, and comprehensive error handling.

**Architecture:** Tab-based layout with Input/Results tabs. Results panel with copy/save/expand. useRunAIApp hook upgraded with WebSocket streaming and conversation history. Edge function enhanced for all tool types.

**Tech Stack:** React + TypeScript + Supabase Edge Functions + OpenAI Responses API + OpenAI Realtime API

---

## File Structure

```
src/
├── components/ai/
│   ├── AIAppShell.tsx                    # Modified: add tab navigation
│   ├── ResultPanel.tsx                   # NEW: copy/save/expand controls
│   ├── CollapsibleSection.tsx            # NEW: expand/collapse for JSON
│   └── primitives/
│       └── ErrorState.tsx                # Modified: add retry + suggestions
├── pages/
│   └── AIAppRunnerPage.tsx              # Modified: tab state management
├── hooks/
│   └── useRunAIApp.ts                    # Modified: WebSocket + multi-turn
└── types/
    └── ai-apps.ts                        # Modified: add conversation types

supabase/functions/run-ai-app/
├── index.ts                              # Modified: WebSocket + tools
└── app-configs.ts                        # Modified: add all tools
```

---

## Task 1: Create CollapsibleSection Component

**Files:**
- Create: `src/components/ai/primitives/CollapsibleSection.tsx`
- Test: `src/components/ai/primitives/__tests__/CollapsibleSection.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ai/primitives/__tests__/CollapsibleSection.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "../CollapsibleSection";

describe("CollapsibleSection", () => {
  it("renders title and collapsed by default", () => {
    render(<CollapsibleSection title="Test Section">Content here</CollapsibleSection>);
    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Content here")).not.toBeVisible();
  });

  it("expands when clicked", () => {
    render(<CollapsibleSection title="Test Section">Content here</CollapsibleSection>);
    fireEvent.click(screen.getByText("Test Section"));
    expect(screen.getByText("Content here")).toBeVisible();
  });

  it("toggles expand/collapse", () => {
    render(<CollapsibleSection title="Test Section">Content here</CollapsibleSection>);
    const header = screen.getByText("Test Section").closest("button")!;
    fireEvent.click(header);
    expect(screen.getByText("Content here")).toBeVisible();
    fireEvent.click(header);
    expect(screen.getByText("Content here")).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest src/components/ai/primitives/__tests__/CollapsibleSection.test.tsx --run`
Expected: FAIL - file not found

- [ ] **Step 3: Write implementation**

```tsx
// src/components/ai/primitives/CollapsibleSection.tsx
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`border border-gray-700 rounded-lg ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-gray-200 hover:bg-gray-800/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        {title}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-700">{children}</div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest src/components/ai/primitives/__tests__/CollapsibleSection.test.tsx --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/primitives/CollapsibleSection.tsx src/components/ai/primitives/__tests__/CollapsibleSection.test.tsx
git commit -m "feat(AIApps): add CollapsibleSection component for JSON expand/collapse"
```

---

## Task 2: Create ResultPanel Component

**Files:**
- Create: `src/components/ai/ResultPanel.tsx`
- Test: `src/components/ai/__tests__/ResultPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ai/__tests__/ResultPanel.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ResultPanel } from "../ResultPanel";

describe("ResultPanel", () => {
  const mockResult = {
    summary: "Test summary",
    opportunities: ["opp1", "opp2"],
    nextSteps: ["step1", "step2"],
  };

  it("renders result content", () => {
    render(<ResultPanel result={mockResult} onCopy={jest.fn()} onSave={jest.fn()} />);
    expect(screen.getByText("summary")).toBeInTheDocument();
  });

  it("calls onCopy when copy button clicked", () => {
    const onCopy = jest.fn();
    render(<ResultPanel result={mockResult} onCopy={onCopy} onSave={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(onCopy).toHaveBeenCalled();
  });

  it("shows expand/collapse for nested objects", () => {
    render(<ResultPanel result={mockResult} onCopy={jest.fn()} onSave={jest.fn()} />);
    expect(screen.getByText("opportunities")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest src/components/ai/__tests__/ResultPanel.test.tsx --run`
Expected: FAIL - file not found

- [ ] **Step 3: Write implementation**

```tsx
// src/components/ai/ResultPanel.tsx
import React, { useState } from "react";
import { Copy, Check, ChevronDown, ChevronRight, Save, Maximize2, Minimize2 } from "lucide-react";
import { CollapsibleSection } from "./primitives/CollapsibleSection";

interface ResultPanelProps {
  result: any;
  onCopy?: (content: string) => void;
  onSave?: () => void;
  appSlug?: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  onCopy,
  onSave,
  appSlug,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = (content: string, key?: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key || "full");
    setTimeout(() => setCopiedKey(null), 2000);
    onCopy?.(content);
  };

  const handleCopyKey = (key: string, value: any) => {
    const content = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    handleCopy(content, key);
  };

  const renderValue = (key: string, value: any, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) return null;

    if (typeof value === "object" && !Array.isArray(value)) {
      return (
        <CollapsibleSection title={key} defaultExpanded={depth === 0}>
          <div className="space-y-2 pl-4 border-l-2 border-gray-700">
            {Object.entries(value).map(([subKey, subValue]) => (
              <div key={subKey} className="flex items-start gap-2">
                <span className="text-xs text-gray-400 min-w-[100px]">{subKey}:</span>
                <div className="flex-1">
                  {typeof subValue === "object" ? (
                    renderValue(subKey, subValue, depth + 1)
                  ) : (
                    <span className="text-sm text-gray-300">{String(subValue)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleCopyKey(subKey, subValue)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                  title={`Copy ${subKey}`}
                >
                  {copiedKey === subKey ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      );
    }

    if (Array.isArray(value)) {
      return (
        <CollapsibleSection title={`${key} (${value.length} items)`}>
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded">
                <span className="text-gray-500 text-xs">{idx + 1}.</span>
                <div className="flex-1">
                  {typeof item === "object" ? (
                    <div className="space-y-1">
                      {Object.entries(item).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-xs text-gray-400">{k}:</span>
                          <span className="text-sm text-gray-300">
                            {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-300">{String(item)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleCopyKey(`${key}[${idx}]`, item)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                  {copiedKey === `${key}[${idx}]` ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      );
    }

    return (
      <div className="flex items-start gap-2">
        <span className="text-sm text-gray-300 break-all">{String(value)}</span>
      </div>
    );
  };

  const panelContent = (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(JSON.stringify(result, null, 2))}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          >
            {copiedKey === "full" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            Copy Full JSON
          </button>
          {onSave && (
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Save to Workspace
            </button>
          )}
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Result Content */}
      <div className="space-y-3">
        {Object.entries(result).map(([key, value]) => (
          <div key={key} className="flex items-start gap-3">
            <span className="text-sm font-medium text-gray-400 min-w-[120px] capitalize">{key}:</span>
            <div className="flex-1 min-w-0">{renderValue(key, value)}</div>
            <button
              onClick={() => handleCopyKey(key, value)}
              className="p-1 text-gray-500 hover:text-white transition-colors flex-shrink-0"
              title={`Copy ${key}`}
            >
              {copiedKey === key ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Results: {appSlug}</h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Minimize2 className="h-6 w-6" />
            </button>
          </div>
          {panelContent}
        </div>
      </div>
    );
  }

  return <div className="bg-[#111] rounded-xl border border-gray-800 p-6">{panelContent}</div>;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest src/components/ai/__tests__/ResultPanel.test.tsx --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ai/ResultPanel.tsx src/components/ai/__tests__/ResultPanel.test.tsx
git commit -m "feat(AIApps): add ResultPanel with copy/save/expand controls"
```

---

## Task 3: Update AIAppShell with Tab Navigation

**Files:**
- Modify: `src/components/ai/AIAppShell.tsx`

- [ ] **Step 1: Read current file**

Read `src/components/ai/AIAppShell.tsx` (already done - see lines 1-112)

- [ ] **Step 2: Update implementation**

```tsx
// src/components/ai/AIAppShell.tsx
import React, { useState } from "react";
import { ArrowLeft, Save, Download, BarChart3, FileText, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

interface AIAppShellProps {
  appName: string;
  appSlug: string;
  children: React.ReactNode;
  usage?: { used: number; limit: number };
  onSave?: () => void;
  onDownload?: () => void;
  isRunning?: boolean;
  /** Active tab: 'input' | 'results' */
  activeTab?: "input" | "results";
  /** Callback when tab changes */
  onTabChange?: (tab: "input" | "results") => void;
  /** Whether results exist to show in Results tab */
  hasResults?: boolean;
}

export const AIAppShell: React.FC<AIAppShellProps> = ({
  appName,
  appSlug,
  children,
  usage = { used: 12, limit: 100 },
  onSave,
  onDownload,
  isRunning = false,
  activeTab = "input",
  onTabChange,
  hasResults = false,
}) => {
  const navigate = useNavigate();
  const usagePercent = Math.min((usage.used / usage.limit) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Apps
            </Button>

            <div className="h-6 w-px bg-gray-800" />

            <div>
              <h1 className="text-lg font-semibold">{appName}</h1>
              <p className="text-xs text-gray-500">/{appSlug}</p>
            </div>
          </div>

          {/* Usage Meter */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <BarChart3 className="h-4 w-4" />
              <span>
                {usage.used} / {usage.limit} runs
              </span>
            </div>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={!onSave || isRunning}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              Save to Project
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={!onDownload || isRunning}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex gap-1 -mb-px">
            <button
              onClick={() => onTabChange?.("input")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "input"
                  ? "border-primary-500 text-primary-400"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              <FileText className="h-4 w-4" />
              Input Form
            </button>
            <button
              onClick={() => onTabChange?.("results")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "results"
                  ? "border-primary-500 text-primary-400"
                  : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Results
              {hasResults && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded">1</span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {children}
      </div>

      {/* Footer hint */}
      <div className="mx-auto max-w-7xl px-6 pb-8 text-center text-xs text-gray-600">
        Powered by OpenAI • Results are private to your account • Usage resets monthly
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ai/AIAppShell.tsx
git commit -m "feat(AIApps): add tab navigation to AIAppShell"
```

---

## Task 4: Update AIAppRunnerPage with Tab State

**Files:**
- Modify: `src/pages/AIAppRunnerPage.tsx`

- [ ] **Step 1: Read current file**

Read `src/pages/AIAppRunnerPage.tsx` (already done - see lines 1-167)

- [ ] **Step 2: Update implementation**

```tsx
// src/pages/AIAppRunnerPage.tsx
import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AIAppShell } from "../components/ai/AIAppShell";
import { ResultPanel } from "../components/ai/ResultPanel";
import { appsData } from "../data/appsData";
import { isInternalAIApp } from "../config/internalAIApps";
import { getAIAppComponent, isAIAppImplemented } from "../components/ai/apps/registry";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { ErrorState } from "../components/ai/primitives/ErrorState";

type TabType = "input" | "results";

const AIAppRunnerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const app = appsData.find((a) => a.id === slug);

  const [lastResult, setLastResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("input");

  if (!slug || !isInternalAIApp(slug) || !app) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">App not found</h1>
          <p className="mt-2 text-gray-400">This AI app is not available or you don't have access yet.</p>
          <button onClick={() => navigate("/apps")} className="mt-4 rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-500">
            Browse all apps
          </button>
        </div>
      </div>
    );
  }

  const AppComponent = getAIAppComponent(slug);
  const isCustomUI = isAIAppImplemented(slug);

  const handleResult = useCallback((result: any) => {
    setLastResult(result);
    setLastError(null);
    // Auto-switch to results tab when result arrives
    setActiveTab("results");
  }, []);

  const handleError = useCallback((error: string) => {
    setLastError(error);
    setActiveTab("input"); // Stay on input tab to show error
  }, []);

  const handleRunningChange = useCallback((running: boolean) => {
    setIsRunning(running);
  }, []);

  const handleReset = useCallback(() => {
    setLastResult(null);
    setLastError(null);
    setActiveTab("input");
  }, []);

  const handleSaveToProject = async () => {
    if (!lastResult || !user) {
      alert("Run the app first to generate a result, then save.");
      return;
    }

    const timestamp = Date.now();
    const fileName = `${slug}-${timestamp}.json`;
    const path = `user-workspaces/${user.id}/ai-runs/${slug}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("user-workspaces")
        .upload(path, new Blob([JSON.stringify(lastResult, null, 2)], { type: "application/json" }), {
          contentType: "application/json",
          upsert: true,
        });

      if (uploadError) {
        console.warn("Storage upload failed:", uploadError);
        downloadResult(lastResult, fileName);
        alert("Saved locally (download). Create 'user-workspaces' bucket in Supabase with private policies for full cloud save.");
        return;
      }

      alert(`Saved to your workspace!`);
    } catch (e: any) {
      downloadResult(lastResult, fileName);
      alert("Cloud save unavailable — result downloaded locally instead.");
    }
  };

  const handleDownload = () => {
    if (!lastResult) {
      alert("Generate a result first before downloading.");
      return;
    }
    const fileName = `${slug}-result-${Date.now()}.json`;
    downloadResult(lastResult, fileName);
  };

  const downloadResult = (result: any, fileName: string) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AIAppShell
      appName={app.name}
      appSlug={slug}
      onSave={handleSaveToProject}
      onDownload={handleDownload}
      isRunning={isRunning}
      usage={{ used: 12, limit: 100 }}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      hasResults={!!lastResult}
    >
      <div className="mb-4 flex items-center gap-2 text-xs">
        {isCustomUI ? (
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-400">Enhanced UI</span>
        ) : (
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400">Base Template</span>
        )}
      </div>

      {isRunning && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary-900 bg-primary-950/20 px-4 py-2.5 text-sm text-primary-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Running {app.name}... (10-30s) — form inputs are disabled</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "input" ? (
          <>
            <AppComponent
              appId={slug}
              appName={app.name}
              onResult={handleResult}
              onError={handleError}
              onRunningChange={handleRunningChange}
              onReset={handleReset}
            />
            {lastError && <ErrorState error={lastError} />}
          </>
        ) : (
          <div className="space-y-6">
            {lastResult ? (
              <ResultPanel
                result={lastResult}
                onSave={handleSaveToProject}
                appSlug={slug}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <p className="text-lg mb-2">No results yet</p>
                <p className="text-sm">Run the app to see results here</p>
                <button
                  onClick={() => setActiveTab("input")}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                >
                  Go to Input Form
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AIAppShell>
  );
};

export default AIAppRunnerPage;
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/AIAppRunnerPage.tsx
git commit -m "feat(AIApps): add tab state to AIAppRunnerPage"
```

---

## Task 5: Enhance useRunAIApp with WebSocket + Multi-turn + Retry

**Files:**
- Modify: `src/components/ai/apps/useRunAIApp.ts`
- Modify: `src/components/ai/apps/types.ts`

- [ ] **Step 1: Read current files**

Read `src/components/ai/apps/useRunAIApp.ts` (lines 1-167) and `src/components/ai/apps/types.ts` (lines 1-72)

- [ ] **Step 2: Update types**

```typescript
// Add to src/components/ai/apps/types.ts

export interface UseRunAIAppOptions {
  onResult?: (result: AIAppResult) => void;
  onError?: (error: string) => void;
  onReset?: () => void;
  /** Enable multi-turn conversation context */
  enableMultiTurn?: boolean;
  /** Max conversation history items to keep */
  maxHistoryItems?: number;
  /** Enable auto-retry on failure */
  autoRetry?: boolean;
  /** Max retry attempts */
  maxRetries?: number;
}

export interface UseRunAIAppReturn {
  run: (inputs: Record<string, any>) => Promise<void>;
  isRunning: boolean;
  output: any;
  error: string | null;
  reset: () => void;
  isStreaming: boolean;
  streamingContent: string;
  /** Conversation history for multi-turn */
  conversationHistory: ConversationMessage[];
  /** Clear conversation history */
  clearHistory: () => void;
  /** Error suggestion from last failed attempt */
  errorSuggestion?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
```

- [ ] **Step 3: Update hook implementation**

```typescript
// src/components/ai/apps/useRunAIApp.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import type { UseRunAIAppOptions, UseRunAIAppReturn, ConversationMessage } from "./types";

interface UseRunAIAppOptionsExtended extends UseRunAIAppOptions {
  enableMultiTurn?: boolean;
  maxHistoryItems?: number;
  autoRetry?: boolean;
  maxRetries?: number;
}

export function useRunAIApp(
  slug: string,
  options: UseRunAIAppOptionsExtended = {}
): UseRunAIAppReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [errorSuggestion, setErrorSuggestion] = useState<string | undefined>();

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  const parseErrorSuggestion = (errorMsg: string): string => {
    // Common error patterns with suggestions
    const suggestions: Record<string, string> = {
      "rate_limit": "Try again in a few seconds. The API is experiencing high traffic.",
      "timeout": "The request timed out. Try with simpler inputs or fewer parameters.",
      "invalid_api_key": "Check your OpenAI API key in Supabase Edge secrets.",
      "model_not_found": "The specified model is not available. Try gpt-4o-mini.",
      "content_filter": "The input may contain content that triggered a filter. Try rephrasing.",
      "quota_exceeded": "You've exceeded your API quota. Check your OpenAI billing.",
    };

    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (errorMsg.toLowerCase().includes(key)) {
        return suggestion;
      }
    }

    return "Try simplifying your input or breaking it into smaller parts.";
  };

  const run = useCallback(
    async (inputs: Record<string, any>) => {
      setIsRunning(true);
      setError(null);
      setErrorSuggestion(undefined);

      // Build conversation context for multi-turn
      let contextContent = "";
      if (options.enableMultiTurn && conversationHistory.length > 0) {
        const historyText = conversationHistory
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");
        contextContent = `Conversation history:\n${historyText}\n\nCurrent request:\n`;
      }

      try {
        // Attempt WebSocket first (faster streaming)
        const useWebSocket = true; // Can be made configurable

        if (useWebSocket && !inputs.useSSE) {
          // WebSocket streaming
          setIsStreaming(true);

          return new Promise<void>((resolve, reject) => {
            const wsUrl = `${supabase.supabaseUrl}/functions/v1/run-ai-app/websocket`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
              ws.send(JSON.stringify({ appSlug: slug, inputs: { ...inputs, context: contextContent } }));
            };

            let buffer = "";

            ws.onmessage = (event) => {
              buffer += event.data;
              setStreamingContent(buffer);

              // Try to parse complete messages
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") {
                    setIsStreaming(false);
                    ws.close();
                    break;
                  }
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.output) {
                      setOutput(parsed.output);
                      // Add to conversation history
                      if (options.enableMultiTurn) {
                        setConversationHistory((prev) => [
                          ...prev,
                          { role: "assistant", content: JSON.stringify(parsed.output), timestamp: Date.now() },
                        ]);
                      }
                    }
                    if (parsed.error) {
                      throw new Error(parsed.error);
                    }
                  } catch {}
                }
              }
            };

            ws.onerror = () => {
              // Fall back to SSE
              setIsStreaming(false);
              ws.close();
              runSSE(inputs, contextContent).then(resolve).catch(reject);
            };

            ws.onclose = () => {
              setIsStreaming(false);
              if (buffer) {
                try {
                  const parsed = JSON.parse(buffer);
                  setOutput(parsed.output || parsed);
                } catch {}
              }
              resolve();
            };
          });
        } else {
          // SSE streaming (original)
          await runSSE(inputs, contextContent);
        }

        retryCountRef.current = 0;
      } catch (err: any) {
        const msg = err?.message || err?.error || "Failed to run AI app";
        setError(msg);
        setErrorSuggestion(parseErrorSuggestion(msg));
        options.onError?.(msg);

        // Auto-retry logic
        if (options.autoRetry && retryCountRef.current < (options.maxRetries || 1)) {
          retryCountRef.current += 1;
          setTimeout(() => {
            run(inputs);
          }, 1000 * retryCountRef.current);
        }
      } finally {
        setIsRunning(false);
        setIsStreaming(false);
      }
    },
    [slug, options, conversationHistory]
  );

  const runSSE = async (inputs: Record<string, any>, contextContent: string) => {
    setIsStreaming(true);

    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/run-ai-app`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabase.supabaseClient.auth.accessToken}`,
      },
      body: JSON.stringify({ appSlug: slug, inputs: { ...inputs, context: contextContent }, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const contentType = response.headers.get("content-type");

    if (contentType?.includes("text/event-stream")) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        setStreamingContent(buffer);

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsStreaming(false);
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.output) {
                setOutput(parsed.output);
                if (options.enableMultiTurn) {
                  setConversationHistory((prev) => [
                    ...prev,
                    { role: "assistant", content: JSON.stringify(parsed.output), timestamp: Date.now() },
                  ]);
                }
                options.onResult?.({ success: true, output: parsed.output, metadata: parsed.metadata });
              }
            } catch {}
          }
        }
      }

      setIsStreaming(false);
    } else {
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const result = data.output ?? data;
      setOutput(result);

      if (options.enableMultiTurn) {
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: JSON.stringify(inputs), timestamp: Date.now() },
          { role: "assistant", content: JSON.stringify(result), timestamp: Date.now() },
        ]);
      }

      options.onResult?.({ success: true, output: result, metadata: data.metadata });
    }
  };

  const reset = useCallback(() => {
    setOutput(null);
    setError(null);
    setStreamingContent("");
    setErrorSuggestion(undefined);
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (wsRef.current) wsRef.current.close();
    options.onReset?.();
  }, [options.onReset]);

  return {
    run,
    isRunning,
    output,
    error,
    reset,
    isStreaming,
    streamingContent,
    conversationHistory,
    clearHistory,
    errorSuggestion,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ai/apps/useRunAIApp.ts src/components/ai/apps/types.ts
git commit -m "feat(AIApps): add WebSocket, multi-turn, auto-retry to useRunAIApp"
```

---

## Task 6: Enhance ErrorState with Retry + Suggestions

**Files:**
- Modify: `src/components/ai/primitives/ErrorState.tsx`

- [ ] **Step 1: Read current file**

Find and read `src/components/ai/primitives/ErrorState.tsx`

- [ ] **Step 2: Update implementation**

```tsx
// src/components/ai/primitives/ErrorState.tsx
import React from "react";
import { AlertTriangle, RefreshCw, Lightbulb, X } from "lucide-react";
import { Button } from "../../ui/button";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  suggestion?: string;
  onDismiss?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  suggestion,
  onDismiss,
}) => {
  return (
    <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/20 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-red-400">Something went wrong</h3>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-300">{error}</p>

          {suggestion && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-950/30 p-3 border border-amber-900/30">
              <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-400">Suggestion</p>
                <p className="mt-0.5 text-xs text-gray-300">{suggestion}</p>
              </div>
            </div>
          )}

          {onRetry && (
            <div className="mt-4 flex gap-2">
              <Button
                onClick={onRetry}
                size="sm"
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ai/primitives/ErrorState.tsx
git commit -m "feat(AIApps): enhance ErrorState with retry and suggestions"
```

---

## Task 7: Update Edge Function for WebSocket + All Tools

**Files:**
- Modify: `supabase/functions/run-ai-app/index.ts`
- Modify: `supabase/functions/run-ai-app/app-configs.ts`

- [ ] **Step 1: Read current files**

Read `supabase/functions/run-ai-app/index.ts` (lines 1-297) and `supabase/functions/run-ai-app/app-configs.ts` (lines 1-801)

- [ ] **Step 2: Update index.ts with WebSocket support**

```typescript
// supabase/functions/run-ai-app/index.ts
// OpenAI Responses API Integration with Streaming, WebSocket & Tool Support
// Supports: web_search_preview, file_search, vision, code_execution

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAppConfig, type ToolType } from "./app-configs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, upgrade",
};

// Tool definitions for OpenAI Responses API
const TOOL_DEFINITIONS: Record<ToolType, any> = {
  web_search_preview: { type: "web_search_preview" as const },
  file_search: { type: "file_search" as const },
  vision: { type: "vision" as const },
  code_execution: { type: "code_execution" as const },
};

interface RunAIAppRequest {
  appSlug: string;
  inputs: Record<string, any>;
  context?: string; // Multi-turn context
  userId?: string;
  stream?: boolean;
}

serve(async (req) => {
  // Handle WebSocket upgrade
  if (req.headers.get("upgrade") === "websocket") {
    return handleWebSocket(req);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { appSlug, inputs, context, userId, stream = true }: RunAIAppRequest = await req.json();

    if (!appSlug) {
      return new Response(JSON.stringify({ error: "appSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const config = getAppConfig(appSlug);
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!config || !openaiKey) {
      const fallback = {
        success: true,
        appSlug,
        output: {
          summary: `Demo mode for ${appSlug}. Connect OPENAI_API_KEY and add config for full AI.`,
          message: "Add your OpenAI key in Supabase Edge secrets",
        },
        metadata: { model: "fallback", demo: true, timestamp: new Date().toISOString() },
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build tools array
    const tools: any[] = [];
    if (config.tools && config.tools.length > 0) {
      for (const toolType of config.tools) {
        if (TOOL_DEFINITIONS[toolType]) {
          tools.push(TOOL_DEFINITIONS[toolType]);
        }
      }
    }

    // Build input content
    let inputContent = "";
    if (context) {
      inputContent += context + "\n\n";
    }
    inputContent += `${config.systemPrompt}\n\n`;

    if (typeof inputs === "object" && inputs !== null) {
      for (const [key, value] of Object.entries(inputs)) {
        if (value !== undefined && value !== null && value !== "") {
          const formattedValue = typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value);
          inputContent += `\n${key}: ${formattedValue}`;
        }
      }
    } else {
      inputContent += String(inputs);
    }

    // Build request body
    const requestBody: any = {
      model: config.model || "gpt-4o-mini",
      input: inputContent,
      stream: stream !== false,
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
    }

    requestBody.instruction = `Return valid JSON matching the expected output structure. No additional text outside JSON. Expected keys: ${config.expectedOutputKeys.join(", ")}`;

    // Make API call
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      throw new Error(`OpenAI error ${response.status}: ${errText}`);
    }

    // Handle streaming
    if (stream !== false) {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        return new Response(response.body, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      }
    }

    // Non-streaming
    const openaiData = await response.json();
    const parsedOutput = parseResponseOutput(openaiData);

    const result = {
      success: true,
      appSlug,
      output: parsedOutput,
      metadata: {
        model: openaiData.model || config.model,
        tokensUsed: openaiData.usage?.total_tokens || 0,
        latencyMs: openaiData.latency?.total_ms || 0,
        timestamp: new Date().toISOString(),
        userId: userId || null,
        toolsUsed: config.tools || [],
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("run-ai-app error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleWebSocket(req: Request) {
  const { socket, response } = new WebSocketPair();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // Handle incoming messages
  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      const { appSlug, inputs, context } = data;

      const config = getAppConfig(appSlug);
      const openaiKey = Deno.env.get("OPENAI_API_KEY");

      if (!config || !openaiKey) {
        socket.send(JSON.stringify({ error: "Config or API key missing" }));
        socket.close();
        return;
      }

      // Build tools
      const tools: any[] = [];
      if (config.tools && config.tools.length > 0) {
        for (const toolType of config.tools) {
          if (TOOL_DEFINITIONS[toolType]) {
            tools.push(TOOL_DEFINITIONS[toolType]);
          }
        }
      }

      // Build input
      let inputContent = context ? context + "\n\n" : "";
      inputContent += config.systemPrompt + "\n\n";
      for (const [key, value] of Object.entries(inputs)) {
        if (value !== undefined && value !== null) {
          inputContent += `\n${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`;
        }
      }

      const requestBody: any = {
        model: config.model || "gpt-4o-mini",
        input: inputContent,
        stream: true,
      };
      if (tools.length > 0) requestBody.tools = tools;
      requestBody.instruction = `Return valid JSON. Expected keys: ${config.expectedOutputKeys.join(", ")}`;

      // Stream response back
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        socket.send(JSON.stringify({ error: "No response body" }));
        socket.close();
        return;
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        socket.send(buffer);
        buffer = "";
      }

      socket.send("data: [DONE]");
      socket.close();
    } catch (err: any) {
      socket.send(JSON.stringify({ error: err.message }));
      socket.close();
    }
  };

  socket.onclose = () => {
    console.log("WebSocket closed");
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return response;
}

function parseResponseOutput(data: any): any {
  if (data.error) throw new Error(data.error);

  if (data.output && Array.isArray(data.output)) {
    const textParts: string[] = [];
    const toolCalls: any[] = [];

    for (const item of data.output) {
      switch (item.type) {
        case "message":
          if (item.content) {
            for (const content of item.content) {
              if (content.type === "output_text") textParts.push(content.text);
            }
          }
          break;
        case "output_text":
          if (item.text) textParts.push(item.text);
          break;
        case "function_call":
          toolCalls.push({ id: item.id, name: item.name, arguments: item.arguments, callId: item.call_id });
          break;
        case "reasoning":
          if (item.summary) textParts.push(item.summary);
          break;
      }
    }

    if (toolCalls.length > 0) {
      return { response: textParts.join("\n"), toolCalls, usage: "Tool execution completed" };
    }

    const combinedText = textParts.join("\n").trim();
    if (!combinedText) return { message: "No output generated" };

    try {
      return JSON.parse(combinedText);
    } catch {
      return { content: combinedText };
    }
  }

  if (data.output_text) {
    try { return JSON.parse(data.output_text); } catch { return { content: data.output_text }; }
  }

  return data;
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/run-ai-app/index.ts
git commit -m "feat(AIApps): add WebSocket support to run-ai-app edge function"
```

---

## Task 8: Add All Tools to Remaining Apps in app-configs.ts

**Files:**
- Modify: `supabase/functions/run-ai-app/app-configs.ts`

Note: This task involves adding `tools: [...]` to remaining apps. Due to file size, we'll add tools in batches:

**Batch A: Apps needing web_search_preview (add to systemPrompt if not present)**
- ai-sales-email-writer, ai-offer-decision-helper, sales-call-follow-up-ai
- blog-to-podcast-ai, ai-content-editor, ai-documentation-writer, youtube-repurposer-ai
- newsletter-repurposer-ai, ai-music-idea-generator, podcast-creator-ai, talk-to-your-business-ai

**Batch B: Apps needing file_search**
- ai-audio-guide-creator, ai-intake-voice-agent, ai-dictation-assistant, ai-music-jingle-assistant
- video-knowledge-assistant, contract-summary-ai, claim-checker-ai, risk-decision-ai
- ai-course-creator-assistant, sprint-planner-ai, interview-summary-ai, hiring-plan-builder

**Batch C: Apps needing web_search_preview + code_execution**
- sprint-planner-ai, build-plan-generator (if not already added)

- [ ] **Step 1: Add tools to all remaining apps**

For each app without `tools:`, add appropriate tools based on its purpose:
- Research/market apps → web_search_preview
- Document/data apps → file_search
- Visual apps → vision
- Code apps → code_execution

```typescript
// Add tools field to apps that are missing it
// Pattern: tools: ["web_search_preview"] or tools: ["file_search"] etc.
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/shasheemoore/Downloads/videoremixvip/videoremix.vip2 && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/run-ai-app/app-configs.ts
git commit -m "feat(AIApps): add tools to all remaining apps in app-configs"
```

---

## Task 9: Final Verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: No errors

- [ ] **Step 2: Build check**

Run: `npm run build 2>&1 | tail -20`

Expected: Successful build

- [ ] **Step 3: Commit all changes**

```bash
git add -A
git commit -m "feat(AIApps): complete enhancement - tab UI, ResultPanel, WebSocket, multi-turn, error handling"
```

---

## Verification Checklist

After all tasks:
- [ ] Tab navigation works (Input/Results tabs)
- [ ] Copy to clipboard works
- [ ] Save to workspace works
- [ ] Expand/collapse for nested JSON works
- [ ] WebSocket streaming connects
- [ ] Multi-turn context persists
- [ ] Error retry button works
- [ ] Error suggestions display
- [ ] All 95 apps load without errors