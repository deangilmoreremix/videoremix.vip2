import { Handler } from '@netlify/functions';
import OpenAI from 'openai';
import Firecrawl from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface RequestBody {
  company: string;
  type: 'competitor' | 'sentiment' | 'metrics';
  userId?: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { company, type, userId }: RequestBody = JSON.parse(event.body || '{}');

    if (!company || !type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Company and type are required' }),
      };
    }

    // Define search queries based on analysis type
    const searchQueries = {
      competitor: `${company} product launch analysis strengths weaknesses strategic takeaways`,
      sentiment: `${company} customer reviews sentiment social media feedback brand perception`,
      metrics: `${company} product launch metrics adoption revenue press coverage engagement`,
    };

    // Perform web search using Firecrawl
    const searchResults = await firecrawl.search(searchQueries[type], {
      limit: 10,
      scrapeOptions: { formats: ['markdown'] },
    });

    // Extract content from search results
    const contextContent = searchResults.data
      .map((result: any) => result.markdown || result.content || '')
      .filter((content: string) => content.length > 0)
      .join('\n\n---\n\n')
      .slice(0, 20000); // Limit context to avoid token limits

    let bullets: string;
    let report: string;

    if (type === 'competitor') {
      // Generate bullets for competitor analysis
      const bulletsResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a senior Go-To-Market strategist evaluating ${company}'s product launches. Generate up to 16 evidence-based insight bullets about their recent launches. Format: Start every bullet with exactly one tag: Positioning | Strength | Weakness | Learning. Follow with concise statement referencing concrete observations.`,
          },
          {
            role: 'user',
            content: `Based on this research context, generate the insight bullets:\n\n${contextContent}`,
          },
        ],
        temperature: 0.7,
      });

      bullets = bulletsResponse.choices[0]?.message?.content || '';

      // Expand to full report
      const reportResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Transform these insight bullets into a professional launch review for ${company}.

Produce well-structured **Markdown** with tables and bullet points.

# ${company} – Launch Review

## 1. Market & Product Positioning
• Bullet point summary (max 6 bullets).

## 2. Launch Strengths
| Strength | Evidence / Rationale |
|---|---|
| … | … | (add 4-6 rows)

## 3. Launch Weaknesses  
| Weakness | Evidence / Rationale |
|---|---|
| … | … | (add 4-6 rows)

## 4. Strategic Takeaways for Competitors
1. … (max 5 numbered recommendations)

Guidelines:
• Populate tables with specific points derived from bullets.
• Only include meaningful data.

Insight Bullets:
${bullets}`,
          },
        ],
        temperature: 0.7,
      });

      report = reportResponse.choices[0]?.message?.content || '';
    } else if (type === 'sentiment') {
      // Generate bullets for sentiment analysis
      const bulletsResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a market research expert analyzing sentiment for ${company}. Summarize market sentiment in <=10 bullets covering positive & negative themes with source mentions.`,
          },
          {
            role: 'user',
            content: `Based on this research context, generate the sentiment bullets:\n\n${contextContent}`,
          },
        ],
        temperature: 0.7,
      });

      bullets = bulletsResponse.choices[0]?.message?.content || '';

      // Expand to sentiment report
      const reportResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Use these tagged bullets to create a concise market-sentiment brief for **${company}**.

### Positive Sentiment
• List each positive point (max 6).

### Negative Sentiment  
• List each negative point (max 6).

### Overall Summary
Short paragraph (≤120 words) summarizing balance and key drivers.

Tagged Bullets:
${bullets}`,
          },
        ],
        temperature: 0.7,
      });

      report = reportResponse.choices[0]?.message?.content || '';
    } else if (type === 'metrics') {
      // Generate bullets for metrics analysis
      const bulletsResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a product launch performance analyst. List (max 10 bullets) important publicly available KPIs & qualitative signals for ${company}'s recent launches including engagement stats, press coverage, adoption metrics.`,
          },
          {
            role: 'user',
            content: `Based on this research context, generate the KPI bullets:\n\n${contextContent}`,
          },
        ],
        temperature: 0.7,
      });

      bullets = bulletsResponse.choices[0]?.message?.content || '';

      // Expand to metrics report
      const reportResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Convert these KPI bullets into a launch-performance snapshot for **${company}** suitable for executive dashboard.

## Key Performance Indicators
| Metric | Value / Detail | Source |
|---|---|---|
| … | … | … | (one row per KPI)

## Qualitative Signals
• Bullet list (max 5).

## Summary & Implications
Brief paragraph (≤120 words) on what metrics imply about success and next steps.

KPI Bullets:
${bullets}`,
          },
        ],
        temperature: 0.7,
      });

      report = reportResponse.choices[0]?.message?.content || '';
    } else {
      throw new Error('Invalid analysis type');
    }

    // Add sources section
    const sources = searchResults.data
      .map((result: any, index: number) => `${index + 1}. ${result.url}`)
      .join('\n');

    report += `\n\n## Sources\n${sources}`;

    // Log to Supabase
    if (userId) {
      await supabase.from('ai_agent_runs').insert({
        agent_type: `product_launch_${type}`,
        user_id: userId,
        input_data: { company, type },
        output_data: { report, bullets },
        status: 'completed',
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ report, bullets }),
    };
  } catch (error) {
    console.error('Product Launch Intelligence error:', error);

    // Log failed run
    try {
      const { company, type, userId }: RequestBody = JSON.parse(event.body || '{}');
      if (userId) {
        await supabase.from('ai_agent_runs').insert({
          agent_type: `product_launch_${type}`,
          user_id: userId,
          input_data: { company, type },
          output_data: { error: error.message },
          status: 'failed',
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};