import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Types
interface ContentGeniusInput {
  content: string;
  contentType: 'transcript' | 'audio' | 'notes';
  meetingTitle?: string;
  attendees?: string[];
  meetingDate?: string;
  userId?: string;
}

interface ActionItem {
  description: string;
  owner?: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
}

interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface ContentGeniusResult {
  id: string;
  meetingTitle?: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  summary: string;
  actionItems: ActionItem[];
  insights: string[];
  sentiment: SentimentAnalysis;
  topics: string[];
  processingTime: number;
  error?: string;
}

// Content processing and cleaning
function cleanContent(content: string): string {
  // Remove extra whitespace and normalize
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Main analysis function
async function analyzeMeetingContent(content: string, context?: {
  meetingTitle?: string;
  attendees?: string[];
  meetingDate?: string;
}): Promise<{
  summary: string;
  actionItems: ActionItem[];
  insights: string[];
  sentiment: SentimentAnalysis;
  topics: string[];
}> {
  const contextInfo = context?.meetingTitle ? `Meeting: ${context.meetingTitle}\n` : '';
  const attendeesInfo = context?.attendees?.length ? `Attendees: ${context.attendees.join(', ')}\n` : '';
  const dateInfo = context?.meetingDate ? `Date: ${context.meetingDate}\n` : '';

  const prompt = `You are ContentGenius AI, a professional meeting analysis assistant. Analyze this meeting content and provide a comprehensive analysis.

${contextInfo}${attendeesInfo}${dateInfo}

MEETING CONTENT:
${content}

Provide your analysis in the following JSON format:
{
  "summary": "2-3 paragraph executive summary of key outcomes and decisions",
  "actionItems": [
    {
      "description": "Clear, actionable task description",
      "owner": "Person responsible (if mentioned, otherwise omit)",
      "deadline": "Due date (if mentioned, otherwise omit)",
      "priority": "high|medium|low based on urgency and importance",
      "status": "pending"
    }
  ],
  "insights": [
    "Key insights, themes, or important discussion points",
    "Another insight or theme",
    "Additional observations"
  ],
  "sentiment": {
    "overall": "positive|neutral|negative",
    "score": 0.8,
    "breakdown": {
      "positive": 60,
      "neutral": 30,
      "negative": 10
    }
  },
  "topics": [
    "Main topic 1",
    "Main topic 2",
    "Main topic 3"
  ]
}

Focus on:
- Extracting concrete decisions and outcomes
- Identifying specific action items with owners when possible
- Providing actionable insights
- Accurate sentiment analysis
- Categorizing main discussion topics

Be thorough but concise. Ensure action items are specific and measurable.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 3000,
    temperature: 0.3,
    messages: [
      { role: 'system', content: 'You are ContentGenius AI, a professional meeting analysis assistant. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]
  });

  const content_response = response.choices[0].message.content;
  if (!content_response) {
    throw new Error('No response from AI service');
  }

  try {
    const result = JSON.parse(content_response);

    // Validate and normalize the response
    return {
      summary: result.summary || 'Analysis completed but summary not available.',
      actionItems: Array.isArray(result.actionItems) ? result.actionItems.map((item: any) => ({
        description: item.description || 'Action item description missing',
        owner: item.owner,
        deadline: item.deadline,
        priority: item.priority || 'medium',
        status: item.status || 'pending'
      })) : [],
      insights: Array.isArray(result.insights) ? result.insights : [],
      sentiment: {
        overall: result.sentiment?.overall || 'neutral',
        score: typeof result.sentiment?.score === 'number' ? result.sentiment.score : 0,
        breakdown: {
          positive: result.sentiment?.breakdown?.positive || 0,
          neutral: result.sentiment?.breakdown?.neutral || 0,
          negative: result.sentiment?.breakdown?.negative || 0
        }
      },
      topics: Array.isArray(result.topics) ? result.topics : []
    };
  } catch (error) {
    console.error('Failed to parse ContentGenius response:', content_response);
    throw new Error('Failed to parse meeting analysis results');
  }
}

async function runContentGenius(input: ContentGeniusInput): Promise<ContentGeniusResult> {
  const startTime = Date.now();

  try {
    // Clean and validate content
    const cleanedContent = cleanContent(input.content);
    if (!cleanedContent.trim()) {
      throw new Error('Meeting content is empty or invalid');
    }

    // Analyze the content
    const analysis = await analyzeMeetingContent(cleanedContent, {
      meetingTitle: input.meetingTitle,
      attendees: input.attendees,
      meetingDate: input.meetingDate
    });

    const processingTime = Date.now() - startTime;

    return {
      id: `contentgenius_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      meetingTitle: input.meetingTitle,
      timestamp: new Date().toISOString(),
      status: 'completed',
      summary: analysis.summary,
      actionItems: analysis.actionItems,
      insights: analysis.insights,
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      id: `contentgenius_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      meetingTitle: input.meetingTitle,
      timestamp: new Date().toISOString(),
      status: 'error',
      summary: '',
      actionItems: [],
      insights: [],
      sentiment: {
        overall: 'neutral',
        score: 0,
        breakdown: { positive: 0, neutral: 0, negative: 0 }
      },
      topics: [],
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main handler
export async function handler(event: any) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const input: ContentGeniusInput = JSON.parse(event.body);

    // Validate input
    if (!input.content?.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Meeting content is required'
        })
      };
    }

    if (input.content.length > 50000) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Content exceeds maximum length of 50,000 characters'
        })
      };
    }

    if (!['transcript', 'audio', 'notes'].includes(input.contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid content type. Must be transcript, audio, or notes'
        })
      };
    }

    // Create result record
    const resultId = `contentgenius_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const initialResult: ContentGeniusResult = {
      id: resultId,
      meetingTitle: input.meetingTitle,
      timestamp,
      status: 'processing',
      summary: '',
      actionItems: [],
      insights: [],
      sentiment: {
        overall: 'neutral',
        score: 0,
        breakdown: { positive: 0, neutral: 0, negative: 0 }
      },
      topics: [],
      processingTime: 0
    };

    // Save initial result to database
    const { error: dbError } = await supabase
      .from('ai_agent_runs')
      .insert({
        id: resultId,
        agent_type: 'contentgenius_ai',
        user_id: input.userId || null,
        input_data: input,
        output_data: initialResult,
        status: 'processing',
        created_at: timestamp
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue processing even if DB save fails
    }

    // Run the analysis
    const finalResult = await runContentGenius(input);

    // Update result in database
    await supabase
      .from('ai_agent_runs')
      .update({
        output_data: finalResult,
        status: finalResult.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);

    return {
      statusCode: 200,
      body: JSON.stringify(finalResult)
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}
