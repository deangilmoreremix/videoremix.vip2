import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse, errorResponse } from '../_shared/utils.ts';

import { createClient } from 'npm:@supabase/supabase-js@2';

// Fetch user's API key from Supabase (user-provided keys)
async function getUserApiKey(user_id, provider) {
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_api_key')
    .eq('user_id', user_id)
    .eq('provider', provider)
    .single();

  if (error || !data) {
    return null;
  }
  return data.encrypted_api_key;
}

// Verify JWT token to get user_id
async function verifyUser(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return null;
    return { user_id: user.id };
  } catch (e) {
    console.error('JWT verification failed:', e);
    return null;
  }
}

import Anthropic from 'npm:anthropic@0.39.0';;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const anthropic = new Anthropic({
  apiKey: userApiKey!,
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

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4000,
    temperature: 0.7,
    system: 'You are a professional podcast producer. Always respond with valid JSON.',
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

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


  // Verify authentication and get user's API key
  const { user_id } = await verifyUser(req);
  if (!user_id) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Get user's anthropic API key
  const userApiKey = await getUserApiKey(user_id, 'anthropic');
  if (!userApiKey) {
    return jsonResponse({ 
      error: 'API_KEY_MISSING',
      message: 'Please add your anthropic API key in your profile.',
      provider: 'anthropic'
    }, 403);
  }

  // Parse body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    // body remains undefined for non-JSON requests
  }
Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
  }

  try {
    const input: PodcastifyInput = await req.json();

    // Validate input
    if (!input.blogUrl?.trim()) {
      return new Response(JSON.stringify({ error: 'Blog URL is required' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
    }

    // Basic URL validation
    try {
      new URL(input.blogUrl);
    } catch {
      return new Response(JSON.stringify({ error: 'Please enter a valid URL' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
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

    return new Response(JSON.stringify(finalResult), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });;
  }
}