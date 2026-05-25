# ContentGenius AI Agent Specification
## Overview
**Updated: OpenAI Migration Complete (2026-05-04)**

Convert the AI Meeting Agent from awesome-llm-apps into a **Supabase Edge Function-hosted SaaS agent** that transforms meeting transcripts and notes into actionable summaries, insights, and follow-up tasks for VideoRemix.vip users.

## Problem Statement

**Business Problem:**
Teams waste hours taking meeting notes, summarizing discussions, and extracting action items. ContentGenius AI solves this by instantly transforming raw meeting content into professional summaries, key insights, and actionable next steps.

**Current Pain Points:**
- Manual note-taking during meetings distracts from active participation
- Post-meeting summarization takes 30-60 minutes per meeting
- Action items get lost in long email threads
- Key decisions and insights are forgotten
- No standardized meeting documentation

**Target Users:**
- Meeting facilitators and note-takers
- Project managers tracking action items
- Executives needing meeting summaries
- Teams implementing meeting efficiency tools
- Consultants documenting client meetings

**Market Opportunity:**
- Average meeting length: 30-60 minutes
- Post-meeting work: 15-30 minutes per participant
- Enterprise meetings: 20+ per week per team
- Meeting summarization market: $2B+ annually

## Solution Overview

**Core Functionality:**
ContentGenius AI transforms meeting transcripts, notes, or recordings into:
- Executive summaries with key decisions
- Action items with owners and deadlines
- Meeting insights and themes
- Follow-up recommendations
- Sentiment analysis of discussion
- Topic categorization and tagging

**Key Differentiators:**
- **Multi-Input Support**: Handles transcripts, audio recordings, or live notes
- **Actionable Outputs**: Generates tasks, not just summaries
- **Sentiment Analysis**: Understands meeting tone and engagement
- **Integration Ready**: Exports to project management tools
- **Professional Formatting**: Creates meeting minutes and reports

**Success Metrics:**
- Reduce post-meeting work by 80%
- Improve action item completion rates by 40%
- Generate meeting summaries in under 30 seconds
- Support multiple input formats (text, audio)
- Export to 5+ project management platforms

## User Experience

### Input Interface
**Primary Input Methods:**
```
1. Text Transcript Upload: [File upload or paste]
2. Audio Recording: [File upload with transcription]
3. Live Meeting Notes: [Textarea with real-time processing]
4. Meeting Details: [Optional context form]
```

**Input Validation:**
- Accepts .txt, .docx, .pdf for transcripts
- Supports .mp3, .wav, .m4a for audio
- Real-time character count and processing estimates
- Smart detection of meeting vs. other content

### Processing Experience
**Progress Indicators:**
1. 📝 Analyzing content structure (0-20%)
2. 🎯 Extracting key decisions (20-40%)
3. ✅ Identifying action items (40-60%)
4. 📊 Analyzing sentiment (60-80%)
5. 📋 Generating summary (80-100%)

**Real-time Updates:**
- Live processing status with time estimates
- Partial results streaming as available
- Ability to cancel and restart processing
- Progress persistence across sessions

### Output Interface
**Tabbed Results View:**
1. **Summary Tab**: Executive overview with key outcomes
2. **Actions Tab**: Action items with owners and deadlines
3. **Insights Tab**: Key themes and discussion points
4. **Details Tab**: Full analysis with sentiment breakdown

**Export Options:**
- Download meeting minutes as PDF
- Export action items to CSV/Trello/Asana
- Copy summary to clipboard
- Share meeting report via link

**Save & History:**
- Save meeting analyses to user dashboard
- Search and filter past meetings
- Compare meeting effectiveness over time
- Team sharing for collaborative review

## Technical Implementation

### Netlify Function Architecture
**Function: `/netlify/functions/contentgenius-ai`**

**Input Processing:**
- Text extraction from various formats
- Audio transcription using OpenAI Whisper (if audio provided)
- Content cleaning and normalization
- Meeting structure detection

**AI Processing Pipeline:**
1. **Content Analysis**: GPT-4o analyzes meeting structure and content
2. **Decision Extraction**: Identifies key decisions and outcomes
3. **Action Item Detection**: Finds tasks, owners, and deadlines
4. **Sentiment Analysis**: Analyzes discussion tone and engagement
5. **Summary Generation**: Creates executive summary and insights

**Output Formatting:**
- Structured JSON with all analysis components
- Professional text formatting for reports
- Action item data structure for integrations
- Sentiment scores and breakdowns

### Database Schema
**Table: `ai_agent_runs`**
```sql
{
  id: string,
  agent_type: 'contentgenius_ai',
  user_id: string,
  input_data: {
    content: string,
    contentType: 'transcript' | 'audio' | 'notes',
    meetingTitle?: string,
    attendees?: string[],
    meetingDate?: string
  },
  output_data: {
    summary: string,
    actionItems: ActionItem[],
    insights: string[],
    sentiment: SentimentAnalysis,
    topics: string[],
    processingTime: number
  },
  status: 'processing' | 'completed' | 'error',
  created_at: timestamp,
  updated_at: timestamp
}
```

### AI Prompts & Logic

**Primary Analysis Prompt:**
```
You are ContentGenius AI, a professional meeting analysis assistant. Analyze this meeting content and provide:

1. EXECUTIVE_SUMMARY: 2-3 paragraph summary of key outcomes
2. KEY_DECISIONS: List of decisions made with context
3. ACTION_ITEMS: Tasks with owners, deadlines, priority
4. INSIGHTS: Important themes and discussion points
5. SENTIMENT: Overall tone and engagement level
6. TOPICS: Main discussion categories

Format as JSON with these exact keys.
```

**Response Processing:**
- Parse structured JSON response
- Validate action item format and completeness
- Calculate sentiment scores from analysis
- Generate topic tags automatically

## Data Schema

### Input Schema
```typescript
interface ContentGeniusInput {
  content: string;              // Meeting transcript/notes
  contentType: 'transcript' | 'audio' | 'notes';
  meetingTitle?: string;        // Optional meeting name
  attendees?: string[];         // Optional attendee list
  meetingDate?: string;         // Optional date
  userId?: string;              // User identifier
}
```

### Output Schema
```typescript
interface ActionItem {
  description: string;
  owner?: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;  // -1 to 1
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface ContentGeniusResult {
  id: string;
  summary: string;
  actionItems: ActionItem[];
  insights: string[];
  sentiment: SentimentAnalysis;
  topics: string[];
  processingTime: number;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}
```

## Error Handling

### Input Validation Errors
- **Empty Content**: "Please provide meeting content to analyze"
- **Unsupported Format**: "Content format not supported. Please use text or audio files"
- **Content Too Long**: "Content exceeds 50,000 characters. Please split into smaller segments"

### Processing Errors
- **AI Service Unavailable**: "Analysis service temporarily unavailable. Please try again"
- **Invalid Content**: "Content appears to be non-meeting related. Please check your input"
- **Timeout**: "Analysis taking longer than expected. Results will be emailed when complete"

### Recovery Strategies
- Automatic retry for transient failures
- Partial results for long content
- Fallback to simpler analysis for complex content
- User notification for extended processing

## Testing Requirements

### Unit Tests
- Input validation functions
- Content parsing and cleaning
- JSON response parsing
- Error handling scenarios

### Integration Tests
- Full pipeline with mock AI responses
- Database save/load operations
- File upload processing
- Audio transcription (if implemented)

### End-to-End Tests
- Complete user workflow from upload to results
- Error scenarios and recovery
- Performance under load
- Mobile responsiveness

### Success Criteria
- 95% accuracy in action item extraction
- <30 second processing for typical meetings
- 99% uptime for function availability
- Support for 10,000+ character transcripts

## Security & Privacy

### Data Handling
- Meeting content encrypted in transit and at rest
- No persistent storage of sensitive meeting data
- User-controlled data retention policies
- GDPR compliance for EU users

### Access Control
- User authentication required
- Results accessible only to content owner
- Optional team sharing with permissions
- Audit logging of all access

## Performance Optimization

### Function Optimization
- Cold start reduction through warming
- Response streaming for large outputs
- Caching for repeated analyses
- Parallel processing for multi-part content

### Scalability Considerations
- Queue system for high-volume processing
- Auto-scaling based on demand
- Database connection pooling
- CDN for static assets

## Business Value

### Revenue Model
- **Freemium**: 5 meetings/month free
- **Pro**: $29/month - 100 meetings/month
- **Business**: $99/month - Unlimited + team features
- **Enterprise**: Custom pricing for large teams

### Competitive Advantages
- **Speed**: Sub-30 second analysis vs. hours manually
- **Accuracy**: AI-powered extraction vs. human error
- **Integration**: Export to PM tools vs. manual entry
- **Scalability**: Handle any meeting size vs. limited capacity

### Market Positioning
"Transform hours of meeting follow-up into seconds with AI-powered analysis that extracts insights, action items, and decisions instantly."</content>
<parameter name="filePath">docs/superpowers/specs/2026-05-04-contentgenius-ai-spec.md