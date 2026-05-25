import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, jsonResponse } from '../_shared/utils.ts';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// Initialize OpenAI client
function getOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

// Fetch user's API key from Supabase (user-provided keys)
async function getUserApiKey(user_id: string, provider: string) {
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
async function verifyUser(req: Request) {
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

// Get embedding using OpenAI
async function getEmbedding(openai: OpenAI, text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}

// RAG retrieval using OpenAI embeddings + Supabase vector search
async function retrieveDocuments(
  openai: OpenAI,
  query: string, 
  collectionName: string,
  matchThreshold: number = 0.7,
  matchCount: number = 5
) {
  // Get query embedding using OpenAI
  const queryEmbedding = await getEmbedding(openai, query);
  
  // Search in Supabase vector database
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
    collection_name: collectionName
  });

  if (error) throw error;
  return data;
}

// Generate response using OpenAI
async function generateResponse(
  openai: OpenAI, 
  context: string, 
  query: string
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant with access to retrieved documents. Use the provided context to answer questions accurately. If the answer isn't in the context, say so.\n\nContext:\n${context}`
      },
      {
        role: 'user',
        content: query
      }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  return completion.choices[0].message.content || '';
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Verify authentication and get user's API key
    const { user_id } = await verifyUser(req);
    if (!user_id) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Get user's OpenAI API key
    const userApiKey = await getUserApiKey(user_id, 'openai');
    if (!userApiKey) {
      return jsonResponse({ 
        error: 'API_KEY_MISSING',
        message: 'Please add your OpenAI API key in your profile.',
        provider: 'openai'
      }, 403);
    }

    const openai = getOpenAIClient(userApiKey);
    const body = await req.json();
    
    const { query, collection_name, match_threshold, match_count } = body;

    if (!query) {
      return jsonResponse({ error: 'Query is required' }, 400);
    }

    // Retrieve documents using OpenAI embeddings
    const documents = await retrieveDocuments(
      openai,
      query,
      collection_name || 'default',
      match_threshold || 0.7,
      match_count || 5
    );

    // Generate response with context
    const context = documents?.map((doc: any) => doc.content || doc.text).join('\n\n') || '';
    const answer = await generateResponse(openai, context, query);

    return jsonResponse({
      status: 'success',
      answer,
      sources: documents,
      function: 'rag-agent-cohere',
      embedding_model: 'text-embedding-3-small',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('RAG agent error:', error);
    return new Response(
      JSON.stringify({ error: error.message, status: 'error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
