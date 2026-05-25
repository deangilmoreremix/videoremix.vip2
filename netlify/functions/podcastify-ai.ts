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

interface PodcastifyInput {
  blogUrl: string;
  customInstructions?: string;
  userId?: string;
}

interface PodcastifyResult {
  id: string;
  blogUrl: string;
  timestamp: string;
  status: 'processing' | 'completed' | 'error';
  title: string;
  summary: string;
  podcastScript: string;
  keyPoints: string[];
  estimatedDuration: string;
  processingTime: number;
  error?: string;
}

// Mock web scraping function (in production, use a proper scraping service)
async function scrapeBlogContent(url: string): Promise<string> {
  // For demo purposes, return a mock blog content
  // In production, integrate with a scraping service like Firecrawl or ScrapingBee
  return `
    <h1>Sample Blog Post Title</h1>
    <p>This is an example blog post about artificial intelligence and its impact on modern business. AI technologies are transforming how companies operate, from customer service to product development.</p>

    <h2>The Rise of AI in Business</h2>
    <p>Artificial intelligence has become a cornerstone of modern business strategy. Companies across industries are adopting AI to improve efficiency, reduce costs, and enhance customer experiences.</p>

    <h2>Key Benefits of AI Implementation</h2>
    <ul>
      <li>Automated customer service through chatbots</li>
      <li>Data-driven decision making</li>
      <li>Predictive analytics for business forecasting</li>
      <li>Streamlined operations and workflow optimization</li>
    </ul>

    <h2>Future of AI in Business</h2>
    <p>As AI technology continues to evolve, we can expect to see even more sophisticated applications across all business functions. The key to successful AI adoption lies in understanding both the capabilities and limitations of these technologies.</p>
  `;
}

function extractTextFromHtml(html: string): string {
  // Simple HTML text extraction (in production, use a proper HTML parser)
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function generatePodcastContent(blogContent: string, customInstructions?: string): Promise<{
  title: string;
  summary: string;
  podcastScript: string;
  keyPoints: string[];
  estimatedDuration: string;
}> {
  const prompt = `You are a professional podcast producer specializing in converting blog posts into engaging podcast episodes.

Convert this blog content into a podcast episode. Create:

1. **Podcast Title**: An engaging title for the episode
2. **Summary**: A 2-3 sentence summary of the episode content
3. **Podcast Script**: A natural, conversational script that would work well for audio (aim for 800-1200 words)
4. **Key Points**: 5-7 main takeaways from the content
5. **Estimated Duration**: How long this would take to read aloud (in minutes)

Blog Content:
${blogContent}

${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

Make the script engaging and conversational, like a podcast host speaking directly to listeners. Include natural transitions, rhetorical questions, and engaging language.

Format your response as a JSON object with exactly these keys:
{
  "title": "episode title",
  "summary": "brief summary",
  "podcastScript": "full conversational script",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "estimatedDuration": "X minutes"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [
      { role: 'system', content: 'You are a professional podcast producer. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]
  });

  const content = response.choices[0].message.content;

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse podcast content response:', content.text);
    throw new Error('Failed to generate podcast content');
  }
}

async function runPodcastify(input: PodcastifyInput): Promise<PodcastifyResult> {
  const startTime = Date.now();

  try {
    // Step 1: Scrape blog content
    const rawContent = await scrapeBlogContent(input.blogUrl);

    // Step 2: Extract clean text
    const cleanContent = extractTextFromHtml(rawContent);

    // Step 3: Generate podcast content
    const podcastContent = await generatePodcastContent(cleanContent, input.customInstructions);

    const processingTime = Date.now() - startTime;

    return {
      id: `podcastify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blogUrl: input.blogUrl,
      timestamp: new Date().toISOString(),
      status: 'completed',
      title: podcastContent.title,
      summary: podcastContent.summary,
      podcastScript: podcastContent.podcastScript,
      keyPoints: podcastContent.keyPoints,
      estimatedDuration: podcastContent.estimatedDuration,
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    return {
      id: `podcastify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blogUrl: input.blogUrl,
      timestamp: new Date().toISOString(),
      status: 'error',
      title: '',
      summary: '',
      podcastScript: '',
      keyPoints: [],
      estimatedDuration: '',
      processingTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const input: PodcastifyInput = JSON.parse(event.body);

    // Validate input
    if (!input.blogUrl?.trim()) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Blog URL is required' })
      };
    }

    // Basic URL validation
    try {
      new URL(input.blogUrl);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Please enter a valid URL' })
      };
    }

    // Create result record
    const resultId = `podcastify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const initialResult: PodcastifyResult = {
      id: resultId,
      blogUrl: input.blogUrl,
      timestamp,
      status: 'processing',
      title: '',
      summary: '',
      podcastScript: '',
      keyPoints: [],
      estimatedDuration: '',
      processingTime: 0
    };

    // Save initial result to database
    const { error: dbError } = await supabase
      .from('ai_agent_runs')
      .insert({
        id: resultId,
        agent_type: 'podcastify_ai',
        user_id: input.userId || null,
        input_data: input,
        output_data: initialResult,
        status: 'processing',
        created_at: timestamp
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // Run the podcast generation
    const finalResult = await runPodcastify(input);

    // Update result in database
    await supabase
      .from('ai_agent_runs')
      .update({
        output_data: finalResult,
        status: finalResult.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', resultId);

    return { statusCode: 200, body: JSON.stringify(finalResult) };

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