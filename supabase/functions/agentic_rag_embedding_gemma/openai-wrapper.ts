import { OpenAI } from 'openai';
import { createClient } from 'npm:@supabase/supabase-js@2';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// OpenAI wrapper for local LLM replacements
export async function generateResponse(prompt: string, context?: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// RAG retrieval logic
export async function retrieveDocuments(query: string, collectionName: string) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: await getEmbedding(query),
    match_threshold: 0.7,
    match_count: 5,
    collection_name: collectionName
  });

  if (error) throw error;
  return data;
}

async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}