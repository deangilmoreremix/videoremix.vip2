import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ScrapeInput {
  url: string;
  prompt: string;
  mode: 'extract' | 'summarize' | 'qa' | 'list';
  userId?: string;
}

interface ScrapeResult {
  url: string;
  extractedData: any;
  summary?: string;
  keyPoints?: string[];
  mode: string;
}

// Simple HTML content fetcher with basic cleaning
async function fetchWebpage(url: string): Promise<string> {
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Scraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      // Note: Netlify Functions have size limits; very large pages may fail
      // For production, consider using a dedicated scraping service
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      console.warn(`Non-HTML content type: ${contentType}`);
    }

    const text = await response.text();
    
    // Basic HTML cleaning
    const cleaned = cleanHTML(text);
    
    // Truncate if too long (OpenAI has token limits)
    if (cleaned.length > 50000) {
      return cleaned.substring(0, 50000) + '\n\n[Content truncated due to length]';
    }
    
    return cleaned;
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      throw new Error('Unable to reach the website. Check the URL and your internet connection.');
    }
    throw error;
  }
}

function cleanHTML(html: string): string {
  // Remove script and style tags
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  
  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Replace tags with newlines appropriately
  cleaned = cleaned
    .replace(/<(br|h[1-6]|p|div|section|article|header|footer|table|tr|td|th|ul|ol|li)[^>]*>/gi, '\n')
    .replace(/<\/[^>]+>/g, '');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Decode HTML entities (basic)
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  return cleaned;
}

async function extractWithAI(content: string, prompt: string, mode: string): Promise<any> {
  const modeInstructions = {
    extract: `Extract structured data based on the user's request. Return a JSON object, array, or string as appropriate.`,
    summarize: 'Provide a concise summary of the content. Return a JSON with "summary" field containing 2-3 sentences.',
    qa: 'Answer the user\'s question based on the page content. Return a JSON with "answer" field.',
    list: 'Extract a list of items from the content. Return a JSON with "items" array.'
  };

  const systemPrompt = `You are an AI web scraping assistant. ${modeInstructions[mode as keyof typeof modeInstructions]}

Always respond with valid, parseable JSON. Return only JSON, no other text.`;

  const userPrompt = `Webpage Content (truncated to 50k chars):
  
${content}

  
User Request: ${prompt}

Based on the request and the webpage content, extract the requested information.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const contentText = response.choices[0].message.content?.trim() || '{}';
    
    // Extract JSON from response (in case there's surrounding text)
    const jsonMatch = contentText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : contentText;
    
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error('OpenAI extraction error:', error);
    // Fallback: return raw content summary
    return {
      error: 'Failed to parse extraction',
      rawSummary: content.substring(0, 500) + '...'
    };
  }
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const input: ScrapeInput = JSON.parse(event.body);

    if (!input.url?.trim() || !input.prompt?.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL and prompt are required' })
      };
    }

    // Validate URL
    try {
      new URL(input.url);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please provide a valid URL including protocol (https://)' })
      };
    }

    // Fetch webpage
    let content: string;
    try {
      content = await fetchWebpage(input.url);
    } catch (err: any) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Failed to fetch webpage: ${err.message}` })
      };
    }

    if (content.length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Page appears to be empty or could not be accessed' })
      };
    }

    // Extract with AI
    let extractedData: any;
    let summary: string | undefined;
    let keyPoints: string[] | undefined;

    try {
      extractedData = await extractWithAI(content, input.prompt, input.mode);
      
      // Post-process for specific modes
      if (input.mode === 'summarize' && typeof extractedData === 'object' && 'summary' in extractedData) {
        summary = extractedData.summary;
      }
      
      if (input.mode === 'list' && Array.isArray(extractedData)) {
        keyPoints = extractedData.slice(0, 10).map(String);
      } else if (input.mode === 'extract' && typeof extractedData === 'object') {
        keyPoints = Object.values(extractedData).flatMap(v => 
          Array.isArray(v) ? v.map(String) : [String(v)]
        ).slice(0, 5);
      }
    } catch (err) {
      console.error('Extraction error:', err);
      extractedData = { error: 'AI extraction failed', rawContent: content.substring(0, 200) };
    }

    const result: ScrapeResult = {
      url: input.url,
      extractedData,
      summary,
      keyPoints,
      mode: input.mode
    };

    // Save to database
    try {
      await supabase
        .from('ai_agent_runs')
        .insert({
          agent_type: 'web_scraping_agent',
          user_id: input.userId || null,
          input_data: { url: input.url, prompt: input.prompt, mode: input.mode },
          output_data: result,
          status: 'completed',
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return { statusCode: 200, body: JSON.stringify(result) };

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
