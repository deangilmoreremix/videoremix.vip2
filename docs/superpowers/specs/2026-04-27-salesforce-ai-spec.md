# SalesForce AI Agent Specification
## Overview
**Updated: OpenAI Migration Complete (2026-05-03)**

Convert the AI Sales Intelligence Agent Team from awesome-llm-apps into a **Supabase Edge Function-hosted SaaS agent** that generates competitive sales battle cards for VideoRemix.vip users.

## Problem Statement

**Business Problem:**
Sales teams waste hours manually researching competitors and creating battle cards. They need instant, AI-powered competitive intelligence to win deals against major players like Salesforce, HubSpot, Slack, and Zendesk.

**Current Pain Points:**
- Manual competitor research takes 4-6 hours per deal
- Battle cards are outdated within weeks
- Sales reps lack real-time competitive positioning
- No standardized objection handling scripts
- Difficult to create professional visual comparisons

**Target Users:**
- Sales representatives preparing for competitive deals
- Sales managers creating team battle cards
- Sales enablement teams building competitive content
- Entrepreneurs competing against established players

**Market Opportunity:**
- 50% of B2B sales involve competition (source: Salesforce)
- Average deal cycle: 3-6 months with multiple competitor objections
- Battle cards increase win rates by 15-25% (source: Miller Heiman Group)

## Solution Overview

**Core Functionality:**
SalesForce AI transforms competitor + product information into comprehensive sales battle cards with:
- Real-time competitor research and analysis
- Feature-by-feature comparisons
- SWOT analysis with evidence-based insights
- Professional objection handling scripts
- Visual comparison infographics
- Exportable HTML battle cards for CRM integration

**Key Differentiators:**
- **Real-time Intelligence**: Always up-to-date competitor data
- **Multi-step AI Analysis**: 7-stage research pipeline
- **Professional Output**: Sales-ready battle cards and visuals
- **Evidence-based**: All claims backed by web research
- **SaaS Integration**: Works within VideoRemix ecosystem

**Success Metrics:**
- Reduce battle card creation time from 6 hours to 5 minutes
- Increase competitive deal win rates by 20%
- Provide 15+ data points per competitor analysis
- Generate professional HTML + visual outputs

## User Experience

### Input Interface
**Primary Input Form:**
```
Competitor Company: [Text input with autocomplete]
Your Product: [Text input with suggestions]
Industry Context: [Optional dropdown: B2B SaaS, Marketing, Sales, etc.]
Additional Context: [Optional textarea for deal specifics]
```

**Input Validation:**
- Competitor field required (accepts company name or URL)
- Product field required
- Real-time validation with helpful error messages
- Smart suggestions for common competitors

### Processing Experience
**Progress Indicators:**
1. 🔍 Researching competitor profile (0-20%)
2. 📊 Analyzing product features (20-40%)
3. 🎯 Uncovering positioning strategy (40-60%)
4. ⚖️ Creating SWOT analysis (60-75%)
5. 💬 Generating objection scripts (75-90%)
6. 📄 Building battle card (90-95%)
7. 📈 Creating comparison visual (95-100%)

**Real-time Updates:**
- Streaming status messages
- Estimated completion time
- Ability to cancel long-running processes
- Progress persistence across page refreshes

### Output Interface
**Tabbed Results View:**
1. **Overview Tab**: Executive summary with key insights
2. **Battle Card Tab**: Full HTML battle card (embedded preview)
3. **Comparison Tab**: Visual infographic
4. **Details Tab**: Raw research data and sources

**Export Options:**
- Download battle card as HTML file
- Download comparison chart as PNG/PDF
- Copy objection scripts to clipboard
- Share results via unique link (optional premium feature)

**Save & History:**
- Auto-save results to user account
- Access previous battle cards
- Compare multiple competitors
- Team sharing capabilities

## Technical Implementation

### Architecture Overview
```
Frontend (React) → Supabase Edge Function → **OpenAI GPT-4o** + Web Search → Database
     ↓                    ↓                         ↓               ↓
User Input → Input Validation → **Multi-stage GPT-4o Pipeline** → Supabase
     ↓                    ↓                         ↓               ↓
UI Updates → Progress Streaming → Response Processing → Result Storage
```

### Netlify Function Structure
**Primary Function:** `/netlify/functions/salesforce-ai`

**Function Signature:**
```javascript
export async function handler(event) {
  const { competitor, product, industry, context } = JSON.parse(event.body);

  // 7-stage pipeline execution
  const result = await runSalesIntelligencePipeline({
    competitor,
    product,
    industry,
    context
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}
```

### Pipeline Stages (Converted from Python, migrated to OpenAI)

**Stage 1: Competitor Research**
- **AI Provider**: **OpenAI GPT-4o** (web search reasoning)
- **Input**: Competitor name/company
- **Output**: Company profile with key facts
- **Tools**: Web search integration (SerpAPI or similar)
- **Estimated Time**: 20-30 seconds

**Stage 2: Product Feature Analysis**
- **AI Provider**: **OpenAI GPT-4o**
- **Input**: Competitor + user's product
- **Output**: Feature comparison matrix
- **Tools**: Web scraping for product pages
- **Estimated Time**: 25-35 seconds

**Stage 3: Positioning Analysis**
- **AI Provider**: **OpenAI GPT-4o**
- **Input**: Research data from stages 1-2
- **Output**: Competitive positioning insights
- **Tools**: Content analysis of marketing materials
- **Estimated Time**: 20-30 seconds

**Stage 4: SWOT Analysis**
- **AI Provider**: **OpenAI GPT-4o**
- **Input**: All research data
- **Output**: Structured SWOT with evidence
- **Tools**: Data synthesis (no external tools)
- **Estimated Time**: 15-25 seconds

**Stage 5: Objection Scripts**
- **AI Provider**: **OpenAI GPT-4o**
- **Input**: SWOT analysis + positioning
- **Output**: Top 10 objections with responses
- **Tools**: Script generation patterns
- **Estimated Time**: 20-30 seconds

**Stage 6: Battle Card Generation**
- **AI Provider**: **OpenAI GPT-4o** (HTML generation)
- **Input**: All pipeline data
- **Output**: Professional HTML battle card
- **Tools**: HTML/CSS generation
- **Estimated Time**: 15-25 seconds

**Stage 7: Visual Comparison**
- **AI Provider**: **OpenAI DALL-E 3** (image generation) - alternative to Gemini Pro Vision
- **Input**: Feature comparison data
- **Output**: PNG comparison infographic
- **Tools**: AI image generation
- **Estimated Time**: 10-20 seconds

### Data Schema

**Input Schema:**
```typescript
interface SalesIntelligenceInput {
  competitor: string; // Company name or URL
  product: string;    // User's product name
  industry?: string;  // Optional industry context
  context?: string;   // Additional deal context
  userId?: string;    // For result persistence
}
```

**Output Schema:**
```typescript
interface SalesIntelligenceResult {
  id: string;
  competitor: string;
  product: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';

  // Stage outputs
  competitorProfile?: CompetitorProfile;
  featureAnalysis?: FeatureAnalysis;
  positioningIntel?: PositioningIntel;
  swotAnalysis?: SWOTAnalysis;
  objectionScripts?: ObjectionScript[];
  battleCardHtml?: string;
  comparisonChartUrl?: string;

  // Metadata
  processingTime: number;
  sources: string[];
  confidence: number;
}
```

### Error Handling

**Validation Errors:**
- Empty competitor field → "Please enter a competitor company name"
- Invalid company → "Could not find information for this company"
- API failures → Graceful fallback with partial results

**Processing Errors:**
- Stage timeouts → Continue with partial results, flag incomplete sections
- API rate limits → Queue requests, provide estimated wait time
- Network failures → Retry with exponential backoff

**User Feedback:**
- Clear error messages with actionable next steps
- Partial results when possible (e.g., research succeeds but image generation fails)
- Support contact information for persistent issues

### Security Considerations

**Data Privacy:**
- No sensitive customer data stored
- Public competitor information only
- User session data encrypted in Supabase
- No API keys exposed to frontend

**Rate Limiting:**
- Per-user limits: 10 battle cards per hour
- Per-IP limits: Prevent abuse
- API provider quotas respected

**Content Filtering:**
- Competitor research limited to public information
- No generation of harmful or misleading content
- Compliance with AI provider usage policies

## Testing Requirements

### Unit Tests
- [ ] Input validation functions
- [ ] Data transformation utilities
- [ ] Error handling edge cases
- [ ] Schema validation

### Integration Tests
- [ ] Netlify function deployment
- [ ] AI provider API integrations
- [ ] Database operations
- [ ] File upload/storage

### End-to-End Tests
- [ ] Complete battle card generation workflow
- [ ] Error scenarios (invalid input, API failures)
- [ ] Performance under load
- [ ] Mobile responsiveness

### User Acceptance Tests
- [ ] Sales team workflow validation
- [ ] Output quality assessment
- [ ] Export functionality testing
- [ ] Performance benchmarks

## Success Criteria

### Functional Requirements
- ✅ Generates complete battle card in <5 minutes
- ✅ Includes 15+ data points per competitor
- ✅ Produces professional HTML + visual outputs
- ✅ Handles 95% of common competitor scenarios
- ✅ Maintains 99.5% uptime

### Quality Requirements
- ✅ Battle cards used in actual sales deals
- ✅ Sales teams report 20%+ win rate improvement
- ✅ Zero data security incidents
- ✅ Sub-30 second response times for research stages

### Business Requirements
- ✅ 100+ battle cards generated monthly
- ✅ 4.5+ star user satisfaction rating
- ✅ Positive ROI within 3 months
- ✅ Clear path to premium feature expansion

## Implementation Timeline

**Phase 1A (Days 1-3):**
- Spec finalization and approval
- Netlify function skeleton creation
- Basic input form implementation

**Phase 1B (Days 4-7):**
- Stage 1-3 implementation (research pipeline)
- Progress indicator integration
- Basic error handling

**Phase 1C (Days 8-10):**
- Complete pipeline implementation
- Output formatting and export
- End-to-end testing

**Phase 2 (Weeks 3-4):**
- UI polish and advanced features
- Performance optimization
- Beta testing and iteration

## Risk Mitigation

**Technical Risks:**
- AI provider API changes → Multiple provider fallbacks
- Function timeouts → Break complex tasks into smaller calls
- Data quality issues → Implement source validation and confidence scoring

**Business Risks:**
- Low adoption → Focus on high-value sales use cases first
- Competitive alternatives → Differentiate with real-time intelligence
- Cost overruns → Implement usage quotas and monitoring

**Operational Risks:**
- Support burden → Comprehensive documentation and self-service
- Data accuracy → Human oversight for critical deals
- Performance issues → CDN caching and response optimization

## Dependencies

**External Services:**
- **OpenAI GPT-4o API** (primary AI provider — migrated from Anthropic Claude)
- **OpenAI DALL-E 3 API** (image generation — replaced Gemini)
- SerpAPI or similar (web search)
- Supabase (data storage and user management)

**Internal Dependencies:**
- VideoRemix authentication system
- Existing dashboard components
- Payment processing integration
- User management system

## Future Enhancements

**Phase 2 Features:**
- Team collaboration and sharing
- CRM integrations (Salesforce, HubSpot)
- Historical battle card versioning
- Competitor monitoring alerts
- Industry-specific templates

**Phase 3 Features:**
- Multi-competitor analysis
- Predictive win probability
- Automated objection email generation
- Video battle card presentations
- Mobile app companion</content>
<parameter name="filePath">docs/superpowers/specs/2026-04-27-salesforce-ai-spec.md