import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function handler(event: Request): Promise<Response> {
  if (event.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const { question, history = [] } = await event.json().catch(() => ({}));
  if (!question) return jsonResponse({ error: "question is required" }, 400);

  try {
    const { data: matches } = await supabase.rpc("match_documents", {
      query_embedding: await getEmbedding(question),
      match_threshold: 0.0,
      match_count: 5,
    });

    const documents = (matches || []).filter((d: any) => d.metadata?.collection === "pharma_database");
    return streamRagResponse(question, documents, history);
  } catch (err: any) {
    return jsonResponse({ error: err.message }, 500);
  }
}

async function getEmbedding(text: string): Promise<number[]> {
  const resp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8192),
  });
  return resp.data[0].embedding;
}

async function streamRagResponse(question: string, docs: any[], history: any[]): Promise<Response> {
  const context = docs.map((d, i) => `[${i + 1}] ${d.content}`).join("\n\n");
  const messages = [
    {
      role: "system",
      content: `You are a pharmaceutical sciences expert. Answer BASED ONLY on the provided context. Do not mention "context" explicitly. Be precise and concise.`,
    },
    ...history.map((h: any) => ({ role: h.role, content: h.content })),
    { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    stream: true,
    max_tokens: 1024,
  });

  return streamResponse(stream);
}

function streamResponse(stream: any): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
        }
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } }
  );
}

function jsonResponse(body: any, status: number = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
