# AI Apps Enhancement Design
**Date:** 2026-05-22
**Status:** Approved

## Overview

Enhance all 95 AI apps with OpenAI Responses + Realtime API features, improved result display (copy/save/expand), tab-based UI, multi-turn conversations, and comprehensive error handling.

## Feature Breakdown

### 1. Tab-Based Result Layout
- **Input Tab:** Form for app inputs
- **Results Tab:** Shows AI output with copy/save/expand controls
- Tab state persists within session
- Empty state when no results yet

### 2. Result Display Controls (All)
- **Copy to Clipboard:** One-click copy of full JSON or formatted output
- **Save to Workspace:** Save result to Supabase Storage
- **Expand/Collapse:** Collapsible sections for large nested JSON
- **Copy Individual Fields:** Copy specific output keys

### 3. Realtime API Integration (All Equally)
- **WebSocket Streaming:** Replace SSE with bidirectional WebSocket
- **Vision/Image Input:** Real-time image analysis for visual apps
- **Voice Output:** Text-to-speech for audio-capable apps

### 4. Multi-Turn Conversations
- Apps maintain context across multiple runs within session
- Conversation history stored in component state
- Clear context button available

### 5. Error Handling (All)
- Inline retry button on failure
- AI-suggested fixes displayed in error state
- Auto-retry once on failure (configurable)
- Error history visible

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AIAppRunnerPage                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                     AIAppShell                          │ │
│  │  ┌────────────────┬────────────────┐                    │ │
│  │  │  Input Form    │   Results     │  ← Tab Navigation  │ │
│  │  │  (Tab 1)       │   (Tab 2)     │                    │ │
│  │  └────────────────┴────────────────┘                    │ │
│  │                        │                                 │ │
│  │              ┌─────────┴─────────┐                      │ │
│  │              │  ResultControls   │                      │ │
│  │              │  [Copy][Save][+/-]│                      │ │
│  │              └───────────────────┘                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      useRunAIApp Hook                        │
│  • WebSocket streaming (replaces SSE)                       │
│  • Conversation history (multi-turn)                         │
│  • Auto-retry + error suggestions                           │
│  • Multi-turn context management                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Supabase Edge Function                         │
│  • WebSocket mode support                                    │
│  • Vision tool (image analysis)                              │
│  • Voice tool (text-to-speech)                               │
│  • Code execution                                            │
│  • File search                                              │
│  • Web search                                               │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: UI Framework
1. Update `AIAppShell` with tab-based navigation
2. Create `ResultPanel` component with copy/save/expand
3. Create `ErrorState` with retry + suggestions
4. Update `AIAppRunnerPage` to manage tab state

### Phase 2: Hook Enhancements
1. Add WebSocket streaming to `useRunAIApp`
2. Add conversation history state
3. Add auto-retry logic
4. Add error suggestions parsing

### Phase 3: Edge Function Updates
1. Add WebSocket endpoint support
2. Add vision tool to all visual apps
3. Add voice tool configuration
4. Enhance tool definitions

### Phase 4: App Configuration
1. Add tools to all 95 apps
2. Categorize apps by capability needs
3. Test all tool types

## Component Inventory

| Component | Purpose | New/Modified |
|-----------|--------|-------------|
| AIAppShell | Tab navigation + layout | Modified |
| AIAppRunnerPage | Tab state management | Modified |
| ResultPanel | Copy/Save/Expand controls | New |
| ErrorStateV2 | Retry + suggestions | Modified |
| useRunAIApp | WebSocket + multi-turn + retry | Modified |
| run-ai-app edge | WebSocket + tools | Modified |

## File Changes

### New Files
- `src/components/ai/ResultPanel.tsx` - Result display with controls
- `src/components/ai/primitives/CollapsibleSection.tsx` - Expand/collapse

### Modified Files
- `src/components/ai/AIAppShell.tsx` - Add tabs
- `src/pages/AIAppRunnerPage.tsx` - Tab state
- `src/components/ai/apps/useRunAIApp.ts` - WebSocket + multi-turn
- `src/components/ai/primitives/ErrorState.tsx` - Enhance with retry
- `supabase/functions/run-ai-app/index.ts` - WebSocket mode
- `supabase/functions/run-ai-app/app-configs.ts` - All tools

## Verification

1. TypeScript compiles clean
2. UI shows tabs correctly
3. Copy/Save/Expand all work
4. WebSocket streaming connects
5. Multi-turn context persists
6. Error retry works
7. All 95 apps load without errors