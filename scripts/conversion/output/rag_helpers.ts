// ============================================================
// RAG Tutorials conversion: Shared Edge Function helpers
// ============================================================
// Utilities common to all 20 RAG Edge Functions:
//   - OpenAI embedding generation (text-embedding-3-small)
//   - pgvector similarity search via Supabase
//   - RAG prompt construction + OpenAI chat completion
//   - File/PDF ingestion helpers
// ============================================================

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import FormData from "form-data";
import { readFile } from "fs/promises";

// ──────────────────────────────────────────────────────────────
// Typed clients
// ──────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ──────────────────────────────────────────────────────────────
// Embedding helpers
// ──────────────────────────────────────────────────────────────
export async function embedText(
  text: string,
  model: string = "text-embedding-3-small"
): Promise<number[]> {
  if (!text.trim()) return new Array(1536).fill(0);

  const result = await openai.embeddings.create({
    model,
    input: text.slice(0, 8192), // truncate to safe limit
  });
  return result.data[0].embedding;
}

export async function embedMultipleTexts(
  texts: string[]
): Promise<number[][]> {
  const result = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts.map((t) => t.slice(0, 8192)),
  });
  return result.data.map((d) => d.embedding);
}

// ──────────────────────────────────────────────────────────────
// Supabase pgvector search
// ──────────────────────────────────────────────────────────────
export interface DocumentMatch {
  id: number;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

export async function matchDocumentsRPC(
  embedding: number[],
  collectionSlug?: string,
  threshold: number = 0.0,
  k: number = 5
): Promise<DocumentMatch[]> {
  // If a collection slug is provided, filter by collection through metadata
  const response = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: k,
    // If collectionSlug: filter in SQL WHERE (metadata->>'collection' = collectionSlug)
  });

  if (response.error) {
    console.error("match_documents RPC error:", response.error);
    return [];
  }

  // Filter by collection client-side if needed
  let docs = (response.data || []) as DocumentMatch[];
  if (collectionSlug) {
    docs = docs.filter((d) => d.metadata?.collection === collectionSlug);
  }
  // Sort by similarity descending, trim to k
  docs.sort((a, b) => b.similarity - a.similarity);
  return docs.slice(0, k);
}

// ──────────────────────────────────────────────────────────────
// RAG prompt construction
// ============================================================
export function buildRagPrompt(
  question: string,
  documents: DocumentMatch[],
  systemPrompt?: string
): { messages: { role: string; content: string }[] } {
  const context = documents
    .map((d, i) => `[${i + 1}] ${d.content}`)
    .join("\n\n");

  const defaultSystem =
    systemPrompt ||
    `You are a helpful AI assistant. Answer the question based ONLY on the provided context. If the answer cannot be found, say "I couldn't find relevant information." Cite sources using [N] notation.`;

  return {
    messages: [
      { role: "system", content: defaultSystem },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  };
}

// ──────────────────────────────────────────────────────────────
// LLM completion (streaming + non-streaming)
// ──────────────────────────────────────────────────────────────
export async function chatCompletion(
  messages: { role: string; content: string }[],
  stream: boolean = false,
  maxTokens: number = 1024,
  temperature: number = 0.7
) {
  if (stream) {
    return openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      stream: true,
      max_tokens: maxTokens,
      temperature,
    });
  }

  const result = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    stream: false,
    max_tokens: maxTokens,
    temperature,
  });
  return result.choices[0]?.message?.content || "";
}

// ──────────────────────────────────────────────────────────────
// File ingestion (PDF → embed → pgvector)
// ============================================================
export async function storeDocumentInSupabase(
  content: string,
  metadata: Record<string, any> = {},
  collectionSlug?: string
): Promise<{ id: number; success: boolean }> {
  const embedding = await embedText(content);
  const fullMetadata = {
    ...metadata,
    collection: collectionSlug || "default",
    embedded_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("documents").insert({
    content,
    embedding,
    metadata: fullMetadata,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return { id: 0, success: false };
  }
  return { id: data[0]?.id || 0, success: true };
}

// Parse multipart form data (Edge Function friendly)
export function parseMultipart(event: any): Promise<{
  fields: Record<string, string>;
  files: Record<string, { filename: string; content: Uint8Array; mime: string }>;
}> {
  return new Promise((resolve, reject) => {
    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType?.includes("multipart/form-data")) {
      return resolve({ fields: {}, files: {} });
    }

    // Deno standard library parse would be needed here.
    // Edge Functions do not spawn child processes.
    // For Streamlit → Cloudflare → Supabase, use fetch() with FormData.
    resolve({ fields: {}, files: {} });
  });
}

// ──────────────────────────────────────────────────────────────
// Error response helper
// ──────────────────────────────────────────────────────────────
export function errorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function successResponse<T>(data: T, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================
// END rag_helpers.ts
// ============================================================
