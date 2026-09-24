# OpenAI Model & Responses API Migration Plan

## Current State
- Personalization: `gpt-5.5` + `responses.create` + `json_schema`
- Reasoning: `gpt-4o-mini` + `chat.completions.create`
- Other apps: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`, `OpenAI-3-opus`
- Total functions: ~19 Netlify Functions

## Target State
All Netlify Functions use:
- Latest OpenAI models via `responses.create`
- Structured output with `json_schema` where applicable
- Reasoning effort controls
- Background mode for long-running tasks
- Conversation memory with `store`

## Model Assignments by App Category

### Personalization & Content
- `personalization/generate-personalization.ts` → `gpt-5.5` ✅ Already done
- `personalization/generate-media.ts` → `gpt-5.5` ✅ Already done
- `contentgenius-ai.ts` → `gpt-5.5`
- `socialbuzz-ai.ts` → `gpt-5.5`
- `launchrocket-ai.ts` → `gpt-5.5`
- `email-gtm-agent.ts` → `gpt-5.5`
- `product-launch-intelligence.ts` → `gpt-5.5`

### Reasoning & Analysis
- `reasoning-agent.ts` → `o3` or `gpt-4.5`
- `finance-agent.ts` → `gpt-5.5`
- `financial-coach.ts` → `gpt-5.5`
- `web-scraping-agent.ts` → `gpt-5.5`

### Audio/Video
- `podcastify-ai.ts` → `gpt-5.5` + TTS

### Agent Framework Demos
- `1_starter_agent/index.ts` → `gpt-4o`
- `5_1_in_memory_conversation_agent/index.ts` → `gpt-4o`
- `5_2_persistent_conversation_agent/index.ts` → `gpt-4o`
- `6_1_agent_lifecycle_callbacks/index.ts` → `gpt-4o`
- `6_2_llm_interaction_callbacks/index.ts` → `gpt-4o`
- `6_3_tool_execution_callbacks/index.ts` → `gpt-4o`

### CRM/External
- `salesforce-ai.ts` → Keep Salesforce REST
- `consultpro-ai.ts` → `gpt-5.5`

## Responses API Features to Add

### 1. Structured Output (`json_schema`)
All content generation apps should return structured JSON:
```typescript
const response = await openai.responses.create({
  model: 'gpt-5.5',
  input: prompt,
  text: {
    format: {
      type: 'json_schema',
      name: 'app_output',
      strict: true,
      schema: { /* app-specific schema */ }
    }
  }
});
```

### 2. Reasoning Effort
For reasoning/analysis apps:
```typescript
const response = await openai.responses.create({
  model: 'o3',
  input: prompt,
  reasoning: { effort: 'high' }
});
```

### 3. Background Mode
For long-running tasks:
```typescript
const response = await openai.responses.create({
  model: 'gpt-5.5',
  input: prompt,
  background: true
});
```

### 4. Conversation Memory
For multi-turn apps:
```typescript
const response = await openai.responses.create({
  model: 'gpt-5.5',
  input: prompt,
  previous_response_id: lastResponseId,
  store: true
});
```

## Implementation Order
1. Update personalization functions (already using Responses API)
2. Update reasoning-agent.ts
3. Update content/audio/video apps
4. Update agent framework demos
5. Deploy and test
