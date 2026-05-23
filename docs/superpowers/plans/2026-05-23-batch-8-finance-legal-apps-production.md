# Batch 8: Finance & Legal Apps — Production UIs + OpenAI Responses API

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (dispatch fresh subagent per 3-4 app group, spec review + code quality review after each group). No human-in-loop between groups — keep executing until all 10 are done.

**Goal:** Deliver 10 production-ready custom React UIs for Finance & Legal Apps. All are stubs (7 lines each). The plan leverages `web_search_preview` (6 apps: live market data, news, regulations) and `file_search` (5 apps: CSV/JSON/PDF upload with base64 encoding). All 10 get multi-turn, rich structured output, and color-coded risk/score rendering.

**Architecture:**
- Backend: Existing `/v1/responses` Edge function already supports `web_search_preview` and `file_search`. No backend changes needed for Batch 8 — just the UIs.
- Frontend: Each app follows `_TEMPLATE.tsx` + Batch 1-7 patterns. File upload uses `BasicFileUpload` → `FileReader.readAsDataURL` → base64 → input field → Edge → `file_search`. Multi-turn with `enableMultiTurn: true` and `lastInputs` preservation.
- Color coding: `text-red-400` + `bg-red-950/30` for high risk/low score; `text-yellow-400` + `bg-yellow-950/30` for medium; `text-green-400` + `bg-green-950/30` for good.

**Tech Stack:** React + TypeScript + Tailwind + `useRunAIApp` hook + `BasicFileUpload` + `StructuredResult` + `PromptTextarea` + `ResultActions` + shadcn `Input/Label/Select` + existing AI primitives.

---

## The 10 Apps

| # | App ID | Tools | Key Inputs | Key Outputs |
|---|--------|-------|------------|-------------|
| 1 | `finance-research-ai` | web_search | companyTicker, researchType, timeFrame | financialOverview, valuationAnalysis, industryContext, risksAndOpportunities, recentNews |
| 2 | `business-finance-ai-team` | file_search | businessType, revenue, expenses, growthGoals | financialHealthScore, revenueAnalysis, costOptimization, profitabilityTimeline, cashFlowProjection |
| 3 | `profit-coach-ai` | web_search | businessModel, currentMargins, revenue, targetProfitIncrease | profitAnalysis, quickWins, strategicMoves, marginImprovement, pricingStrategy, costReduction |
| 4 | `investment-research-assistant` | web_search | investmentOptions, riskTolerance, investmentHorizon, amount | optionsAnalysis, recommendation, riskAssessment, expectedReturns, diversificationSuggestions |
| 5 | `startup-due-diligence-ai` | web_search | startupName, pitchDeck, stage, investmentAmount | teamAssessment, marketAnalysis, productTraction, financialHealth, riskFactors, investmentRecommendation |
| 6 | `revenue-data-analyst-ai` | file_search | revenueData (JSON/CSV), timePeriod, breakdown | revenueOverview, growthAnalysis, customerSegmentation, churnAnalysis, revenueForecast |
| 7 | `financial-dashboard-ai` | file_search | businessType, keyMetrics, stakeholderRole, refreshFrequency | dashboardConcept, kpiDefinitions, visualizationTypes, alertThresholds, layoutSuggestion |
| 8 | `contract-summary-ai` | file_search | contractType, contractText, focusArea | summary, keyTerms, obligations, risks, redFlags, recommendedChanges |
| 9 | `legal-pdf-explainer` | file_search | documentType, query | plainEnglishSummary, sectionBreakdown, yourObligations, rightsHighlighted, questionsToAsk |
| 10 | `policy-compliance-assistant` | web_search | industry, regulationType, companySize | complianceOverview, keyRequirements, implementationChecklist, penaltiesForNonCompliance |

**Special UI notes per app:**
- Finance Research AI: Ticker input → live price display → financial tables
- Business Finance AI Team: Score gauge (0-100), revenue/cost breakdown bars
- Profit Coach AI: "Quick Wins" in amber, "Strategic Moves" in blue
- Investment Research: Portfolio allocation pie chart (CSS), risk meter
- Startup Due Diligence: Invest/No Invest/Hold verdict banner
- Revenue Data Analyst: Trend arrows (↑↓), forecast confidence indicator
- Financial Dashboard AI: KPI cards with sparklines (CSS), alert badges
- Contract Summary AI: Red flag icons, risk meter, highlighted key terms list
- Legal PDF Explainer: Plain English box, "Your Obligations" checklist
- Policy Compliance: Checklist with ✓, timeline tracker

---

## File Upload Pattern (file_search apps: 2, 6, 7, 8, 9)

```tsx
const [uploadedFile, setUploadedFile] = useState<string | null>(null);
const [isFileLoading, setIsFileLoading] = useState(false);

const handleFileUpload = (file: File | null) => {
  if (!file) return;
  setIsFileLoading(true);
  const reader = new FileReader();
  reader.onload = (e) => {
    setUploadedFile(e.target?.result as string); // base64 data URL
    setIsFileLoading(false);
  };
  reader.onerror = () => { setIsFileLoading(false); setUploadedFile(null); };
  reader.readAsDataURL(file);
};
```

Pass `uploadedFile` as the appropriate input field (e.g., `revenueData`, `contractText`, `documentContent`).

---

## Multi-Turn Pattern (all 10 apps)

```tsx
const { run, isRunning, output, reset, clearHistory } = useRunAIApp(appId, {
  enableMultiTurn: true,
  onResult, onError, onReset,
});
const [lastInputs, setLastInputs] = useState<Record<string, unknown> | null>(null);

const handleRun = async () => {
  const inputs = buildInputs();
  setLastInputs(inputs);
  await run(inputs);
};

const handleQuickIterate = async (focus: string) => {
  const base = lastInputs || buildInputs();
  await run({ ...base, _iterationFocus: focus });
};
```

---

## App Implementation Groups

### Group 1: Tasks 1.1–1.4 (web_search + financial analysis)

- Task 1.1: `finance-research-ai` — ticker, researchType, timeFrame → financial tables + news
- Task 1.2: `profit-coach-ai` — margins + revenue → quick wins + strategic moves
- Task 1.3: `investment-research-assistant` — options + risk + amount → portfolio analysis + risk meter
- Task 1.4: `startup-due-diligence-ai` — startup data → due diligence report + verdict banner

### Group 2: Tasks 2.1–2.3 (web_search apps 5-10)

- Task 2.1: `policy-compliance-assistant` — industry + regulation → compliance checklist + timeline

### Group 3: Tasks 3.1–3.4 (file_search data entry apps)

- Task 3.1: `business-finance-ai-team` — financial data upload → health score + charts
- Task 3.2: `revenue-data-analyst-ai` — revenue CSV/JSON upload → trend analysis + forecast
- Task 3.3: `financial-dashboard-ai` — metrics upload → dashboard mockup with KPIs
- Task 3.4: `contract-summary-ai` — contract text/upload → risk summary + red flags

### Group 4: Tasks 4.1–4.2 (file_search legal apps)

- Task 4.1: `legal-pdf-explainer` — legal doc upload → plain English + obligations checklist
- Task 4.2: Final registry update — add all 10 to `productionReadySlugs`, update batch comment, group commit

---

## Implementation Rules (per `_TEMPLATE.tsx` lessons)

- Destructure `onReset` from AIAppProps; pass `{ onResult, onError, onReset }` to `useRunAIApp`
- Error: runner-only — never render `{error}` locally (forward via `onError`; runner uses `ErrorState`)
- No `window.location.reload()` ever — use `reset()` + local state clears
- Prefer primitives: `StructuredResult`, `PromptTextarea`, `BasicFileUpload`, `ResultActions`
- Keep form visible (disabled) during run; show result toggle on output presence
- After each app: `npm run build` must pass

## Success Criteria

- All 10 `productionReadySlugs` includes Batch 8 apps
- Batch 8 header comment in `registry.ts` updated to "Production Ready"
- `npm run build` passes (0 errors)
- All 10 apps render correct custom UI (not `GenericAIApp`)
- All 10 have multi-turn working
- File upload works for the 5 `file_search` apps