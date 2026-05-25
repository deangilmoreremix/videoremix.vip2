import { OpenAI } from 'openai';
import { createClient } from 'npm:@supabase/supabase-js@2';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!
);

// Convert images to captions using GPT-4o Vision
export async function processImage(imageBase64: string, query: string) {
  try {
    const visionResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail for RAG indexing:' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 500
    });

    const caption = visionResponse.choices[0].message.content;

    // Store in pgvector with metadata
    const embedding = await getEmbedding(caption!);

    await supabase.from('image_rag_documents').insert({
      content: caption,
      embedding: embedding,
      metadata: { original_query: query, image_caption: true }
    });

    return caption;
  } catch (error) {
    console.error('Vision processing error:', error);
    throw error;
  }
}

async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}