# ConsultPro AI Agent Specification

## Overview
**Updated: OpenAI Migration Complete (2026-05-03)**

Convert the AI Consultant Agent from awesome-llm-apps into a **Supabase Edge Function-hosted SaaS agent** that provides comprehensive business consultation with real-time market research and strategic recommendations.

## Problem Statement

**Business Problem:**
Entrepreneurs and business leaders need expert consultation but can't afford expensive management consultants. They lack access to real-time market intelligence and strategic guidance for critical business decisions.

**Current Pain Points:**
- Consulting fees cost $500-5000+ per hour
- Outdated market research and analysis
- Lack of industry-specific strategic guidance
- Difficulty accessing competitive intelligence
- No systematic approach to business decision-making

**Target Users:**
- Startup founders seeking market validation
- Small business owners planning expansion
- Entrepreneurs evaluating new market opportunities
- Business leaders needing strategic direction
- Product managers developing market strategies

**Market Opportunity:**
- 400,000+ new businesses started annually in the US
- Average consulting cost: $150/hour
- Businesses lose $100K+ annually due to poor strategic decisions
- 70% of startups fail due to poor market understanding

## Solution Overview

**Core Functionality:**
ConsultPro AI transforms business questions into comprehensive strategic consultation with:
- Real-time market research and competitive analysis
- Industry-specific strategic recommendations
- Risk assessment and mitigation strategies
- Actionable implementation roadmaps with timelines
- Financial projections and ROI analysis

**Key Differentiators:**
- **Real-Time Intelligence**: Live web research for current market data
- **Strategic Depth**: Comprehensive business analysis framework
- **Actionable Outputs**: Specific recommendations with implementation steps
- **Industry Expertise**: Tailored advice for different business sectors

**Success Metrics:**
- Provide consultant-quality advice at 90% lower cost
- Deliver analysis in minutes vs. weeks for traditional consulting
- Achieve 85% accuracy in market analysis and recommendations
- Generate 20+ actionable insights per consultation

## User Experience

### Input Interface
**Primary Input Form:**
```
Business Question/Challenge: [Textarea - detailed business inquiry]
Industry: [Dropdown: Technology, Healthcare, Finance, Retail, etc.]
Company Stage: [Dropdown: Idea, Startup, Growth, Enterprise]
Current Situation: [Textarea - business context and background]
Specific Goals: [Textarea - what they want to achieve]
Budget Constraints: [Optional - financial limitations]
Timeline Expectations: [Optional - decision timeframe]
```

**Input Validation:**
- Business question required (minimum 50 characters)
- Industry selection required for tailored analysis
- Smart categorization of business challenges
- Progressive disclosure for advanced options

### Processing Experience
**Analysis Framework Display:**
1. 🔍 Research & Analysis (0-30%)
2. 📊 Market Intelligence (30-60%)
3. 🎯 Strategic Recommendations (60-85%)
4. 📋 Implementation Roadmap (85-100%)

**Real-time Progress:**
- Live research findings as they're discovered
- Confidence indicators for different analysis areas
- Partial results available during processing
- Ability to refine questions mid-analysis

### Output Interface
**Comprehensive Consultation Report:**

**Executive Summary:**
- Key findings and recommendations overview
- Confidence levels and data sources
- Immediate action items

**Market Analysis Section:**
- Industry overview and trends
- Competitive landscape assessment
- Market opportunity sizing
- Customer segmentation insights

**Strategic Recommendations:**
- Primary strategic direction
- Alternative approaches with pros/cons
- Risk mitigation strategies
- Success probability estimates

**Implementation Roadmap:**
- Phase 1: Immediate actions (0-30 days)
- Phase 2: Short-term initiatives (30-90 days)
- Phase 3: Long-term strategic moves (90-365 days)
- Success metrics and KPIs

**Financial Analysis:**
- Cost-benefit analysis
- ROI projections
- Funding requirements
- Break-even analysis

**Risk Assessment:**
- High-risk factors identification
- Mitigation strategies
- Contingency plans
- Early warning indicators

**Export Options:**
- Download complete consultation report (PDF/Word)
- Export strategic roadmap (project management format)
- Share consultation with team members
- Save to consultation history

## Technical Implementation

### Architecture Overview
```
User Input → ConsultProForm → Supabase Edge Function → Multi-Phase Analysis → Supabase → Consultation Report
     ↓              ↓                      ↓              ↓               ↓           ↓
Validation → Progress Tracking → **OpenAI GPT-4o** → Research + Strategy → Storage → UI Display
```

### Netlify Function Structure
**Primary Function:** `/netlify/functions/consultpro-ai`

**Function Signature:**
```javascript
export async function handler(event) {
  const { question, industry, stage, context, goals, budget, timeline } = JSON.parse(event.body);

  // Multi-phase consultation analysis
  const result = await runBusinessConsultation({
    question,
    industry,
    stage,
    context,
    goals,
    budget,
    timeline
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}
```

### Analysis Pipeline (Converted from Python Agno)

**Phase 1: Research & Analysis Agent**
- **AI Provider**: **OpenAI GPT-4o** (comprehensive analysis)
- **Input**: Business question + context + industry
- **Output**: Comprehensive business situation analysis
- **Tools**: Web search integration for market data
- **Estimated Time**: 45-60 seconds

**Phase 2: Market Intelligence Agent**
- **AI Provider**: **OpenAI GPT-4o** (market expertise)
- **Input**: Research findings + industry context
- **Output**: Market opportunity and competitive analysis
- **Tools**: Industry trend analysis, competitor research
- **Estimated Time**: 35-45 seconds

**Phase 3: Strategic Advisor Agent**
- **AI Provider**: **OpenAI GPT-4o** (strategic planning)
- **Input**: Market intelligence + business goals
- **Output**: Strategic recommendations and positioning
- **Tools**: Strategic frameworks, competitive positioning
- **Estimated Time**: 40-50 seconds

**Phase 4: Implementation Specialist Agent**
- **AI Provider**: **OpenAI GPT-4o** (execution planning)
- **Input**: Strategic recommendations + constraints
- **Output**: Detailed implementation roadmap
- **Tools**: Project planning, resource allocation, timeline creation
- **Estimated Time**: 30-40 seconds

**Phase 5: Risk Assessment Agent**
- **AI Provider**: **OpenAI GPT-4o** (risk analysis)
- **Input**: Complete analysis + implementation plan
- **Output**: Risk assessment and mitigation strategies
- **Tools**: Risk modeling, scenario planning, contingency development
- **Estimated Time**: 25-35 seconds

### Data Schema

**Input Schema:**
```typescript
interface BusinessConsultationInput {
  question: string;
  industry: string;
  stage: 'idea' | 'startup' | 'growth' | 'enterprise';
  context?: string;
  goals?: string;
  budget?: string;
  timeline?: string;
  userId?: string;
}
```

**Output Schema:**
```typescript
interface BusinessConsultationResult {
  id: string;
  question: string;
  industry: string;
  stage: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';

  // Analysis outputs
  researchAnalysis?: ResearchAnalysis;
  marketIntelligence?: MarketIntelligence;
  strategicRecommendations?: StrategicRecommendations;
  implementationRoadmap?: ImplementationRoadmap;
  riskAssessment?: RiskAssessment;

  // Metadata
  processingTime: number;
  sources: string[];
  confidence: number;
  recommendations: string[];
}
```

### Error Handling

**Validation Errors:**
- Empty business question → "Please provide details about your business challenge or question"
- Invalid industry → "Please select your industry for tailored analysis"
- Insufficient context → "More business context helps provide better recommendations"

**Processing Errors:**
- Research failures → Continue with available data, note limitations
- API timeouts → Provide partial analysis with completion estimate
- Data quality issues → Include confidence scores and alternative interpretations

**User Feedback:**
- Clear progress indicators through analysis phases
- Confidence scores for different recommendation types
- Alternative approaches when primary recommendations have uncertainties
- Follow-up question suggestions for deeper analysis

### Security Considerations

**Data Privacy:**
- Business questions and context kept confidential
- No sensitive financial data permanently stored
- Analysis results encrypted in transit and at rest
- User consultation history isolated by authentication

**Content Filtering:**
- Business consultation limited to ethical, legal advice
- No generation of misleading financial projections
- Compliance with AI provider usage policies
- Appropriate disclaimers for professional consultation

**Rate Limiting:**
- Per-user limits: 10 consultations per week
- Per-industry analysis: Prevent excessive API usage
- Enterprise tiers: Higher limits for consulting firms

## Testing Requirements

### Unit Tests
- Input validation and sanitization functions
- Individual analysis phase logic
- Error handling and recovery mechanisms
- Data transformation and output formatting

### Integration Tests
- Netlify function deployment and scaling
- AI provider API integration and failover
- External research API connectivity
- Database operations and user session management

### End-to-End Tests
- Complete business consultation workflow
- Error scenarios and graceful degradation
- Performance under concurrent consultation requests
- Mobile responsiveness and accessibility

### User Acceptance Tests
- Entrepreneur consultation workflow validation
- Business advisor feedback on recommendation quality
- Industry expert evaluation of strategic advice
- Small business owner usability testing

## Success Criteria

### Functional Requirements
- ✅ Complete consultation in <4 minutes
- ✅ Provide 15+ strategic recommendations per analysis
- ✅ Include 20+ data sources and citations
- ✅ Cover 90% of common business consultation scenarios

### Quality Requirements
- ✅ Consultation quality matches $500/hour consultant level
- ✅ 85%+ recommendation accuracy and relevance
- ✅ Zero critical business advice errors
- ✅ Sub-60 second response times for analysis phases

### Business Requirements
- ✅ 100+ consultations generated monthly
- ✅ 4.7+ star user satisfaction rating
- ✅ Positive ROI within 1 month of launch
- ✅ Clear path to premium consultation tiers

## Implementation Timeline

**Phase 1: Core Consultation Framework (Days 1-5)**
- Multi-agent consultation pipeline development
- Input form and validation implementation
- Progress tracking and intermediate results
- Basic error handling and user feedback

**Phase 2: Intelligence & Research (Days 6-9)**
- Research agent optimization for business data
- Market intelligence analysis refinement
- Strategic recommendation quality enhancement
- Source citation and evidence integration

**Phase 3: Advanced Features (Days 10-12)**
- Implementation roadmap generation
- Risk assessment and mitigation strategies
- Financial analysis and ROI projections
- Industry-specific consultation templates

**Phase 4: Polish & Optimization (Days 13-15)**
- UI/UX refinement for consultation experience
- Performance optimization and caching
- Export functionality and report generation
- Beta testing preparation and user feedback integration

## Risk Mitigation

**Technical Risks:**
- Complex multi-agent coordination → Modular pipeline with clear handoffs
- Research data quality variability → Multiple sources with validation and cross-referencing
- Analysis depth vs. speed trade-off → Progressive disclosure with optional deep-dive analysis

**Business Risks:**
- Consultation quality expectations → Transparent methodology and confidence scoring
- Competitive differentiation → Focus on speed, cost, and real-time intelligence
- User adoption challenges → Freemium model with clear value demonstration

**Market Risks:**
- Regulatory compliance → Appropriate disclaimers and professional consultation boundaries
- Liability concerns → Clear terms of service and usage limitations
- Scalability challenges → Horizontal scaling with API provider partnerships

## Dependencies

**External Services:**
- **OpenAI GPT-4o API** (primary AI provider — migrated from Claude/Anthropic)
- Web search APIs (market research and data gathering)
- Supabase (consultation storage and user management)

**Internal Dependencies:**
- VideoRemix authentication system
- Existing dashboard components and UI patterns
- User management and subscription systems
- Admin analytics and consultation tracking

## Future Enhancements

**Phase 2 Features:**
- Follow-up consultation capabilities
- Consultation session saving and versioning
- Team collaboration on business analyses
- Integration with business planning tools

**Phase 3 Features:**
- Industry-specific expert models
- Historical consultation pattern analysis
- Predictive business outcome modeling
- Multi-language consultation support

**Phase 4 Features:**
- Video consultation with AI avatars
- Real-time market trend monitoring
- Competitive intelligence alerts
- Custom consultation frameworks for enterprise clients</content>
<parameter name="filePath">docs/superpowers/specs/2026-04-27-consultpro-ai-spec.md