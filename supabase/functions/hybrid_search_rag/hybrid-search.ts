import { OpenAI } from 'openai';
import { createClient } from 'npm:@supabase/supabase-js@2';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Hybrid search: vector similarity + keyword search
export async function hybridSearch(query: string, collectionName: string) {
  try {
    // Get vector results
    const queryEmbedding = await getEmbedding(query);
    const { data: vectorResults, error: vectorError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 10,
      collection_name: collectionName
    });

    if (vectorError) throw vectorError;

    // Get keyword results using pg_search (assuming it's set up)
    const { data: keywordResults, error: keywordError } = await supabase
      .from('documents')
      .select('*')
      .textSearch('content', query)
      .limit(10);

    if (keywordError) console.warn('Keyword search failed:', keywordError);

    // Combine and rerank results
    const combinedResults = [...(vectorResults || []), ...(keywordResults || [])];
    const rerankedResults = await rerankResults(query, combinedResults);

    return rerankedResults.slice(0, 5);
  } catch (error) {
    console.error('Hybrid search error:', error);
    throw error;
  }
}

async function rerankResults(query: string, results: any[]) {
  if (results.length === 0) return results;

  const rerankPrompt = `Given the query: "${query}"
  Rank these documents by relevance (1 = most relevant):

  ${results.map((r, i) => `${i + 1}. ${r.content?.substring(0, 200) || 'No content'}`).join('\n')}

  Return only the ranking numbers in order, separated by commas.`;

  const rerankResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: rerankPrompt }],
    max_tokens: 50
  });

  const ranking = rerankResponse.choices[0].message.content?.split(',').map(n => parseInt(n.trim()));
  return ranking ? results.sort((a, b) => ranking.indexOf(results.indexOf(a)) - ranking.indexOf(results.indexOf(b))) : results;
}

async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}