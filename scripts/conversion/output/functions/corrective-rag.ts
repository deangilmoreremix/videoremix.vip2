import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface RAGInput {
  query: string;
  documentId?: string;
  topK?: number;
  userId?: string;
}

interface RAGResult {
  id: string;
  answer: string;
  sources: Array<{ content: string; similarity: number }>;
  timestamp: string;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const input: RAGInput = JSON.parse(event.body);
  if (!input.query?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Query is required' }) };
  }

  const resultId = `rag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Generate embedding for query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: input.query
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search Supabase pgvector
    const { data: matches, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: input.topK || 5
    });

    if (searchError) throw searchError;

    const contexts = (matches || []).map(m => m.content).join('\n\n---\n\n');

    // Generate answer
    const prompt = `Answer based on the following context. If unsure, say so.\n\nContext:\n${contexts}\n\nQuestion: ${input.query}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that answers based on provided context.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const result: RAGResult = {
      id: resultId,
      answer: completion.choices[0].message.content,
      sources: (matches || []).map(m => ({ content: m.content?.substring(0, 200), similarity: m.similarity })),
      timestamp: new Date().toISOString()
    };

    await supabase.from('ai_agent_runs').insert({
      id: resultId,
      agent_type: 'corrective-rag',
      user_id: input.userId || null,
      input_data: input,
      output_data: result,
      status: 'completed',
      created_at: result.timestamp
    });

    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error('RAG error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}