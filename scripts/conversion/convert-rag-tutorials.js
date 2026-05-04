#!/usr/bin/env node

/**
 * RAG Tutorials Conversion Script
 *
 * Converts all 20 RAG tutorial apps to Supabase Edge Functions + React Components.
 * This script:
 * 1. Analyzes each RAG app
 * 2. Generates Supabase Edge Function (with embedding generation + match_documents RPC)
 * 3. Generates React component
 * 4. Creates manifest at scripts/conversion/output/rag_manifest.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directories
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CATALOG_PATH = path.join(PROJECT_ROOT, 'streamlit_apps_catalog.json');
const SOURCE_BASE = path.join(PROJECT_ROOT, 'awesome-llm-apps', 'rag_tutorials');
const ANALYSIS_DIR = path.join(PROJECT_ROOT, 'scripts', 'conversion', 'output', 'analysis');
const FUNCTIONS_DIR = path.join(PROJECT_ROOT, 'scripts', 'conversion', 'output', 'functions');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'scripts', 'conversion', 'output', 'components');

// The 20 RAG tutorial apps from the catalog
const RAG_APPS = [
  'rag_database_routing',
  'gemini_agentic_rag',
  'deepseek_local_rag_agent',
  'ai_blog_search',
  'rag_chain',
  'autonomous_rag',
  'agentic_rag_embedding_gemma',
  'agentic_rag_with_reasoning',
  'qwen_local_rag',
  'agentic_rag_gpt5',
  'knowledge_graph_rag_citations',
  'contextualai_rag_agent',
  'vision_rag',
  'llama3.1_local_rag',
  'local_hybrid_search_rag',
  'rag_agent_cohere',
  'corrective_rag',
  'rag-as-a-service',
  'hybrid_search_rag',
  'agentic_rag_math_agent',
];

// Additional file found in directory (not in catalog)
const EXTRA_APP = 'local_rag_agent';

// ============ RAG-Specific Analysis Overrides ============

const RAG_ANALYSIS_OVERRIDES: Record<string, any> = {
  // Apps that use Qdrant (cloud) → migrate to Supabase pgvector
  'rag_database_routing': {
    providers: { openai: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store' } },
    uiType: 'multi-tab',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'question', label: 'Enter your question', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'gemini_agentic_rag': {
    providers: { google: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store' } },
    uiType: 'chat',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'prompt', label: 'Ask about your documents', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'deepseek_local_rag_agent': {
    providers: { ollama: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store' } },
    uiType: 'chat',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'prompt', label: 'Ask about your documents', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'ai_blog_search': {
    providers: { google: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: false,
    inputFields: [
      { name: 'url', label: 'Paste the blog link', type: 'text', required: true },
      { name: 'query', label: 'Enter your query about the blog post', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'rag_chain': {
    providers: { google: { count: 1 } },
    externalServices: { chromadb: { count: 1, usage: 'vector-store-local' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'query', label: 'Enter your query about the Pharmaceutical Industry', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'autonomous_rag': {
    providers: { openai: { count: 1 } },
    externalServices: { pgvector: { count: 1, usage: 'vector-store' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'question', label: 'Ask Your Question', type: 'text', required: true }
    ],
    outputFormat: 'markdown'
  },

  'agentic_rag_embedding_gemma': {
    providers: { ollama: { count: 1 } },
    externalServices: { lancedb: { count: 1, usage: 'vector-store-local' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: false,
    inputFields: [
      { name: 'query', label: 'Enter your question', type: 'text', required: true }
    ],
    outputFormat: 'markdown'
  },

  'agentic_rag_with_reasoning': {
    providers: { google: { count: 1 }, openai: { count: 1 } },
    externalServices: { lancedb: { count: 1, usage: 'vector-store-local' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: false,
    inputFields: [
      { name: 'query', label: 'Your question', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'qwen_local_rag': {
    providers: { ollama: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store' } },
    uiType: 'chat',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'prompt', label: 'Ask about your documents', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'agentic_rag_gpt5': {
    providers: { openai: { count: 1 } },
    externalServices: { lancedb: { count: 1, usage: 'vector-store-local' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: false,
    inputFields: [
      { name: 'query', label: 'Your question', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'knowledge_graph_rag_citations': {
    providers: { ollama: { count: 1 } },
    externalServices: { neo4j: { count: 1, usage: 'graph-db' } },
    uiType: 'multi-tab',
    complexity: 'complex',
    hasFileUpload: false,
    inputFields: [
      { name: 'query', label: 'Enter your question', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'contextualai_rag_agent': {
    providers: { contextual: { count: 1 } },
    externalServices: {},
    uiType: 'chat',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'query', label: 'Ask a question about your documents', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'vision_rag': {
    providers: { cohere: { count: 1 }, google: { count: 1 } },
    externalServices: {},
    uiType: 'form',
    complexity: 'complex',
    hasFileUpload: true,
    inputFields: [
      { name: 'question', label: 'Ask a question about the loaded images', type: 'text', required: true }
    ],
    outputFormat: 'markdown'
  },

  'llama3.1_local_rag': {
    providers: { ollama: { count: 1 } },
    externalServices: { chromadb: { count: 1, usage: 'vector-store-local' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: false,
    inputFields: [
      { name: 'prompt', label: 'Ask any question about the webpage', type: 'text', required: true }
    ],
    outputFormat: 'markdown'
  },

  'local_hybrid_search_rag': {
    providers: {}, // Uses local LLM via llama-cpp
    externalServices: { sqlite: { count: 1, usage: 'vector-store-local' } },
    uiType: 'chat',
    complexity: 'complex',
    hasFileUpload: true,
    inputFields: [
      { name: 'user_input', label: 'Ask a question about the documents', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'rag_agent_cohere': {
    providers: { cohere: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store' } },
    uiType: 'chat',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'query', label: 'Ask a question about the document', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'corrective_rag': {
    providers: { anthropic: { count: 1 }, openai: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: true,
    inputFields: [
      { name: 'user_question', label: 'Please enter your question', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'rag-as-a-service': {
    providers: { anthropic: { count: 1 } },
    externalServices: { ragie: { count: 1, usage: 'rag-service' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: false,
    inputFields: [
      { name: 'query', label: 'Enter your query', type: 'text', required: true }
    ],
    outputFormat: 'markdown'
  },

  'hybrid_search_rag': {
    providers: { anthropic: { count: 1 }, openai: { count: 1 }, cohere: { count: 1 } },
    externalServices: { sqlite: { count: 1, usage: 'vector-store-local' } },
    uiType: 'chat',
    complexity: 'complex',
    hasFileUpload: true,
    inputFields: [
      { name: 'user_input', label: 'Ask a question about the documents', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'agentic_rag_math_agent': {
    providers: { openai: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store' } },
    uiType: 'form',
    complexity: 'complex',
    hasFileUpload: false,
    inputFields: [
      { name: 'question', label: 'Your Question', type: 'textarea', required: true }
    ],
    outputFormat: 'markdown'
  },

  'local_rag_agent': {
    providers: { ollama: { count: 1 } },
    externalServices: { qdrant: { count: 1, usage: 'vector-store-local' } },
    uiType: 'form',
    complexity: 'rag',
    hasFileUpload: false,
    inputFields: [
      { name: 'query', label: 'Ask a question', type: 'text', required: true }
    ],
    outputFormat: 'markdown'
  },
};

// Vector DB mapping for migration
const VECTOR_DB_MAPPING: Record<string, { supabaseTable: string; embeddingModel: string; dimension: number }> = {
  'rag_database_routing': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  'rag_chain': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  'autonomous_rag': { supabaseTable: ' auto_rag_docs', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  'agentic_rag_embedding_gemma': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 768 },
  'agentic_rag_with_reasoning': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  'agentic_rag_gpt5': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  'rag_agent_cohere': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 1024 },
  'corrective_rag': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  'agentic_rag_math_agent': { supabaseTable: 'math_agent', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  'rag-as-a-service': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  'rag_database_routing': { supabaseTable: 'products_collection,support_collection,finance_collection', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
  // Default for other Qdrant-based apps
  'default': { supabaseTable: 'documents', embeddingModel: 'text-embedding-3-small', dimension: 1536 },
};

// ============ Helper Functions ============

function toPascalCase(str: string): string {
  return str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function capitalizeWords(str: string): string {
  return str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function getEmbeddingModel(appName: string): string {
  const override: Record<string, string> = {
    'rag_database_routing': 'text-embedding-3-small',
    'gemini_agentic_rag': 'text-embedding-3-small',
    'rag_chain': 'text-embedding-3-small',
    'rag_agent_cohere': 'text-embedding-3-small',
    'corrective_rag': 'text-embedding-3-small',
  };
  return override[appName] || 'text-embedding-3-small';
}

function getDimension(appName: string): number {
  const override: Record<string, number> = {
    'rag_database_routing': 1536,
    'rag_chain': 1536,
    'rag_agent_cohere': 1024,
    'corrective_rag': 1536,
  };
  return override[appName] || 1536;
}

function getCollectionTable(appName: string): string {
  const coll = RAG_ANALYSIS_OVERRIDES[appName];
  if (coll?.externalServices?.qdrant) return 'documents';
  if (coll?.externalServices?.chromadb) return 'documents';
  if (coll?.externalServices?.lancedb) return 'documents';
  return 'documents';
}

// ============ Custom RAG Function Template ============

function generateRAGEdgeFunction(appName: string, analysis: any): string {
  const isMultiCollection = appName === 'rag_database_routing';
  const needsWebSearch = appName === 'rag_database_routing' || appName === 'ai_blog_search';
  const needsIngestion = analysis.hasFileUpload;
  const embeddingModel = getEmbeddingModel(appName);
  const dim = getDimension(appName);
  const collectionName = getCollectionTable(appName);

  // Build input type based on required fields
  const inputFields = analysis.inputFields || [];
  const requiredFields = inputFields.map(f => `${f.name}: string`).join(';\n  ');

  // Function slug
  const functionSlug = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  return `import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface RAGInput {
  mode?: 'query' | 'ingest';
  ${requiredFields}
  documentId?: string;
  fileUrl?: string;
  fileName?: string;
  metadata?: Record<string, any>;
  topK?: number;
  userId?: string;
}

interface DocumentChunk {
  id: string;
  content: string;
  similarity: number;
  metadata?: Record<string, any>;
}

interface RAGResult {
  id: string;
  answer: string;
  sources: DocumentChunk[];
  metadata?: Record<string, any>;
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const startTime = Date.now();
  const input: RAGInput = JSON.parse(event.body);
  const mode = input.mode || 'query';
  const resultId = \`${functionSlug}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;

  if (mode === 'ingest' && input.fileUrl) {
    // ===== INGESTION MODE =====
    try {
      // Fetch document content (from URL or pre-uploaded)
      let documentText: string;
      if (input.fileUrl?.startsWith('http')) {
        const resp = await fetch(input.fileUrl);
        documentText = await resp.text();
      } else {
        documentText = input.fileUrl || '';
      }

      // Split into chunks
      const chunks = splitIntoChunks(documentText, 1000, 200);

      // Generate embeddings and store
      const storedChunks: DocumentChunk[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embeddingResp = await openai.embeddings.create({
          model: '${embeddingModel}',
          input: chunk
        });
        const embedding = embeddingResp.data[0].embedding;

        const { data: saved, error: insertErr } = await supabase
          .from('${collectionName}')
          .insert({
            content: chunk,
            embedding: embedding,
            metadata: {
              ...input.metadata,
              documentId: input.documentId,
              fileName: input.fileName,
              chunkIndex: i,
              totalChunks: chunks.length,
              createdAt: new Date().toISOString()
            }
          })
          .select('id')
          .single();

        if (insertErr) throw insertErr;
        storedChunks.push({ id: saved.id, content: chunk, similarity: 1.0 });
      }

      const result: RAGResult = {
        id: resultId,
        answer: \`Successfully ingested \${storedChunks.length} chunks from \${input.fileName || 'document'}\`,
        sources: storedChunks,
        metadata: { mode: 'ingest', chunksCreated: storedChunks.length }
      };

      // Log
      await supabase.from('ai_agent_runs').insert({
        id: resultId,
        agent_type: '${functionSlug}',
        user_id: input.userId || null,
        input_data: input,
        output_data: result,
        status: 'completed',
        created_at: new Date().toISOString()
      });

      return { statusCode: 200, body: JSON.stringify(result) };

    } catch (error: any) {
      console.error('Ingestion error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

  } else {
    // ===== QUERY MODE =====
    try {
      ${isMultiCollection ? `
      // Database routing: search across multiple collections
      const collections = ${appName === 'rag_database_routing' ? `['products_collection', 'support_collection', 'finance_collection']` : `['${collectionName}']`};
      let allMatches: any[] = [];

      for (const coll of collections) {
        const embedResp = await openai.embeddings.create({
          model: '${embeddingModel}',
          input: input.${inputFields[0]?.name || 'query'}
        });
        const queryEmbedding = embedResp.data[0].embedding;

        const { data: matches, error: searchErr } = await supabase.rpc('match_documents_vector', {
          query_embedding: queryEmbedding,
          match_threshold: 0.78,
          match_count: input.topK || 5,
          table_name: coll
        });
        if (!searchErr && matches) allMatches = allMatches.concat(matches);
      }

      // Sort by similarity and take top K
      allMatches.sort((a, b) => b.similarity - a.similarity);
      const matches = allMatches.slice(0, input.topK || 5);
      ` : `
      // Simple single-collection search
      const embedResp = await openai.embeddings.create({
        model: '${embeddingModel}',
        input: input.${inputFields[0]?.name || 'query'}
      });
      const queryEmbedding = embedResp.data[0].embedding;

      const { data: matches, error: searchErr } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.78,
        match_count: input.topK || 5
      });
      if (searchErr) throw searchErr;
      `}

      if (!matches || matches.length === 0) {
        const fallbackResult: RAGResult = {
          id: resultId,
          answer: \`No relevant documents found. Please upload relevant documents first.\`,
          sources: [],
          metadata: { mode: 'query', noResults: true }
        };
        return { statusCode: 200, body: JSON.stringify(fallbackResult) };
      }

      const contexts = matches.map((m: any) => m.content).join('\\n\\n---\\n\\n');

      // Generate answer using context
      const prompt = \`Answer based on the following context. If the context doesn't contain enough information, say so clearly.

Context:
\${contexts}

Question: \${input.${inputFields[0]?.name || 'query'}}\`

      const completion = await openai.chat.completions.create({
        model: '${getPrimaryModel(analysis)}',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that answers questions based on provided context. Always cite your sources when possible.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      const answer = completion.choices[0].message.content;

      const result: RAGResult = {
        id: resultId,
        answer,
        sources: matches.map((m: any) => ({
          content: m.content?.substring(0, 300) || '',
          similarity: m.similarity,
          metadata: m.metadata
        })),
        metadata: { mode: 'query', processingTimeMs: Date.now() - startTime }
      };

      // Log
      await supabase.from('ai_agent_runs').insert({
        id: resultId,
        agent_type: '${functionSlug}',
        user_id: input.userId || null,
        input_data: input,
        output_data: result,
        status: 'completed',
        created_at: new Date().toISOString()
      });

      return { statusCode: 200, body: JSON.stringify(result) };

    } catch (error: any) {
      console.error('Query error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }
}

// Helper: Simple text chunker
function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}
`;

function getPrimaryModel(analysis: any): string {
  if (analysis.providers.anthropic) return 'claude-3-sonnet-20240229';
  if (analysis.providers.google) return 'gemini-1.5-pro';
  if (analysis.providers.openai) return 'gpt-4o-mini';
  if (analysis.providers.ollama) return 'gpt-4o-mini'; // Using OpenAI for RAG
  if (analysis.providers.cohere) return 'gpt-4o-mini';
  return 'gpt-4o-mini';
}

// ============ React Component Template ============

function generateRAGReactComponent(appName: string, analysis: any): string {
  const componentName = toPascalCase(appName) + 'Page';
  const hasFileUpload = analysis.hasFileUpload;
  const hasFileOrUrl = appName === 'ai_blog_search' ? 'URL' : 'File';
  const fileType = appName === 'ai_blog_search' ? 'text' : 'file';

  const title = capitalizeWords(appName);

  // Generate file upload section if needed
  const fileUploadSection = hasFileUpload ? `
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadResp = await fetch('/api/functions/${appName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}?mode=ingest', {
        method: 'POST',
        body: formData
      });
      const result = await uploadResp.json();
      setUploadResult(result);
      if (result.answer) alert('Document uploaded successfully!');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };` : '';

  // Generate input fields
  const inputFields = analysis.inputFields.map(f => `
      <div className="space-y-2">
        <Label htmlFor="${f.name}">${f.label}${f.required ? ' *' : ''}</Label>
        ${f.type === 'textarea' || f.type === 'text' ? `
        <Textarea
          id="${f.name}"
          value={${`formData.${f.name}`}}
          onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}
          placeholder="${f.placeholder || ''}"
          rows={${f.type === 'textarea' ? 4 : 1}}
          className="bg-gray-900/50 border-gray-600 text-white"
        />
        ` : `
        <Input
          id="${f.name}"
          value={${`formData.${f.name}`}}
          onChange={(e) => setFormData({ ...formData, ${f.name}: e.target.value })}
          placeholder="${f.placeholder || ''}"
          className="bg-gray-900/50 border-gray-600"
        />
        `}
      </div>`).join('\n');

  // File upload UI
  const fileUploadUI = hasFileUpload ? `
      <div className="space-y-2">
        <Label>Upload Document</Label>
        <input
          type="file"
          accept=".pdf,.txt,.md"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />
        <p className="text-xs text-gray-500">Supported: PDF, TXT, MD</p>
        ${uploadResult ? (
          <div className="p-3 bg-green-900/30 text-green-300 rounded border border-green-700/50">
            ✅ {uploadResult.answer}
          </div>
        ) : (
          <Button type="button" onClick={handleUpload} disabled={uploading || !selectedFile} variant="outline" className="w-full">
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        )}
      </div>
` : '';

  // Query section
  const answerSection = `
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                Answer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-gray-200">{result.answer}</p>
              </div>
            </CardContent>
          </Card>

          {result.sources && result.sources.length > 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader><CardTitle>Sources</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.sources.map((source: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-900/50 rounded border border-gray-700">
                      <div className="text-xs text-blue-400 mb-1">Similarity: {(source.similarity * 100).toFixed(1)}%</div>
                      <p className="text-sm text-gray-300 line-clamp-3">{source.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}`;

  return `import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Loader2, Sparkles, Upload, FileText } from "lucide-react";

const ${componentName}: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ ${inputFields.map(f => `${f.name}: ""`).join(', ')} });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadResp = await fetch('/api/functions/${appName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}?mode=ingest', {
        method: 'POST',
        body: formData
      });
      const data = await uploadResp.json();
      setUploadResult(data);
      if (data.answer) {
        alert('Document uploaded successfully!');
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.${inputFields[0]?.name || 'query'}?.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = { ...formData, userId: user?.id };
      const res = await fetch('/api/functions/${appName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>${title} - VideoRemix.vip</title>
        <meta name="description" content="${capitalizeWords(appName)} AI-powered tool" />
      </Helmet>

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">${title}</h1>
            <p className="text-xl text-gray-400">${capitalizeWords(appName)} - AI-powered document Q&A</p>
          </motion.div>

          ${hasFileUpload ? `
          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>1. Upload Document</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Document</Label>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                </div>
                <Button type="button" onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full">
                  {uploading ? 'Uploading...' : 'Upload & Index Document'}
                </Button>
                ${uploadResult ? (
                  <div className="p-3 bg-green-900/30 text-green-300 rounded border border-green-700/50">
                    ✅ ${uploadResult.answer || 'Document processed!'}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
          ` : ''}

          <Card className="bg-gray-800/50 border-gray-700 mb-8">
            <CardHeader><CardTitle>${hasFileUpload ? '2. Ask a Question' : 'Ask a Question'}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
${inputFields}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Searching...' : 'Search Documents'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Card className="mb-6 border-red-500/50 bg-red-500/10">
              <CardContent className="pt-6">
                <p className="text-red-300">{error}</p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Searching documents and generating answer...</p>
              </CardContent>
            </Card>
          )}

${answerSection}
        </div>
      </main>
    </>
  );
};

export default ${componentName};
`;
}

// ============ Main Conversion ============

async function runConversion() {
  console.log('\n🚀 Starting RAG Tutorials Conversion...\n');

  // Ensure directories exist
  fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
  fs.mkdirSync(FUNCTIONS_DIR, { recursive: true });
  fs.mkdirSync(COMPONENTS_DIR, { recursive: true });

  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
  const ragTutorials = catalog.rag_tutorials;

  if (!ragTutorials) {
    console.error('❌ No rag_tutorials found in catalog!');
    process.exit(1);
  }

  const manifest: any = {
    convertedAt: new Date().toISOString(),
    category: 'rag_tutorials',
    totalApps: Object.keys(ragTutorials).length,
    apps: {},
    requiresManualReview: []
  };

  let successCount = 0;
  let errorCount = 0;

  for (const [appName, appInfo] of Object.entries(ragTutorials)) {
    console.log(`\n📦 Processing: ${appName}`);

    // Determine source file path
    const mainFile = appInfo.main_file || appInfo.mainFile;
    const sourcePath = path.join(PROJECT_ROOT, mainFile);

    if (!fs.existsSync(sourcePath)) {
      console.error(`   ❌ File not found: ${sourcePath}`);
      errorCount++;
      manifest.apps[appName] = { status: 'error', error: 'File not found' };
      manifest.requiresManualReview.push(appName);
      continue;
    }

    try {
      // 1. Analyze
      const analysis = performAnalysis(appName, sourcePath, ragTutorials);
      const analysisOutputPath = path.join(ANALYSIS_DIR, `rag_tutorials-${appName}.json`);
      fs.writeFileSync(analysisOutputPath, JSON.stringify(analysis, null, 2));
      console.log(`   ✅ Analyzed: ${analysisOutputPath}`);

      // 2. Generate function
      const functionCode = generateRAGEdgeFunction(appName, analysis);
      const functionSlug = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const functionPath = path.join(FUNCTIONS_DIR, `${functionSlug}.ts`);
      fs.writeFileSync(functionPath, functionCode);
      console.log(`   ✅ Function: ${functionPath}`);

      // 3. Generate component
      const componentCode = generateRAGReactComponent(appName, analysis);
      const componentName = toPascalCase(appName) + 'Page';
      const componentPath = path.join(COMPONENTS_DIR, `${componentName}.tsx`);
      fs.writeFileSync(componentPath, componentCode);
      console.log(`   ✅ Component: ${componentPath}`);

      manifest.apps[appName] = {
        status: 'success',
        sourceFile: mainFile,
        analysis: analysisOutputPath,
        function: functionPath,
        component: componentPath,
        functionSlug,
        componentName
      };
      successCount++;

    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);
      errorCount++;
      manifest.apps[appName] = { status: 'error', error: err.message };
      manifest.requiresManualReview.push(appName);
    }
  }

  // Save manifest
  const manifestPath = path.join(PROJECT_ROOT, 'scripts', 'conversion', 'output', 'rag_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Manifest saved: ${manifestPath}`);
  console.log(`\n📊 Summary: ${successCount} succeeded, ${errorCount} failed`);
  console.log(`⚠️  Manual review required for: ${manifest.requiresManualReview.join(', ') || 'none'}\n`);
}

function performAnalysis(appName: string, sourcePath: string, ragTutorials: any): any {
  const content = fs.readFileSync(sourcePath, 'utf-8');
  const appInfo = ragTutorials[appName];

  // Merge override with basic detection
  const override = RAG_ANALYSIS_OVERRIDES[appName] || {};
  const providers: Record<string, any> = {};

  // Simple provider detection
  if (content.includes('OpenAI') || content.includes('openai')) providers.openai = { count: 1, imports: 1 };
  if (content.includes('Anthropic') || content.includes('anthropic')) providers.anthropic = { count: 1, imports: 1 };
  if (content.includes('GoogleGenerativeAI') || content.includes('genai')) providers.google = { count: 1, imports: 1 };
  if (content.includes('Ollama') || content.includes('ollama')) providers.ollama = { count: 1, imports: 1 };
  if (content.includes('Cohere')) providers.cohere = { count: 1, imports: 1 };
  if (content.includes('ContextualAI')) providers.contextual = { count: 1, imports: 1 };

  const externalServices: Record<string, any> = {};
  if (content.includes('Qdrant') || content.includes('qdrant')) externalServices.qdrant = { count: 1, usage: 'vector-store' };
  if (content.includes('Chroma') || content.includes('chroma')) externalServices.chromadb = { count: 1, usage: 'vector-store-local' };
  if (content.includes('LanceDb') || content.includes('lancedb')) externalServices.lancedb = { count: 1, usage: 'vector-store-local' };
  if (content.includes('neo4j') || content.includes('Neo4j')) externalServices.neo4j = { count: 1, usage: 'graph-db' };
  if (content.includes('sqlite') || content.includes('SQLite')) externalServices.sqlite = { count: 1, usage: 'vector-store-local' };

  return {
    appName,
    category: 'rag_tutorials',
    filePath: sourcePath,
    mainFile: appInfo.main_file,
    hasChatInput: /st\.chat_input/.test(content),
    hasTabs: /st\.tabs/.test(content),
    hasFileUpload: /st\.file_uploader/.test(content),
    hasButtons: /st\.button/.test(content),
    uiType: override.uiType || (content.includes('st.chat_input') ? 'chat' : content.includes('st.tabs') ? 'multi-tab' : 'form'),
    widgetCounts: {
      textInput: (content.match(/st\.(text_input|text_area)\(/g) || []).length,
      fileUpload: (content.match(/st\.file_uploader\(/g) || []).length,
      button: (content.match(/st\.button\(/g) || []).length,
    },
    providers,
    externalServices,
    usesSessionState: /st\.session_state/.test(content),
    hasHistory: /messages.*=.*\[\]/.test(content),
    isAsync: /async def |await /.test(content),
    hasMultiAgent: /Crew\(|Agent\(|Team\(|Orchestrator\(/.test(content),
    hasRAG: /vector|retriever|embeddings|qdrant|chroma|lancedb|pgvector/.test(content),
    hasWebSearch: /duckduckgo|exa|tavily|firecrawl|DuckDuckGo/.test(content),
    linesOfCode: content.split('\n').length,
    ...override,
    inputFields: override.inputFields || extractInputFields(content),
    outputFormat: override.outputFormat || 'markdown',
  };
}

function extractInputFields(content: string): any[] {
  const fields: any[] = [];
  const widgetPattern = /st\.(text_input|text_area|file_uploader)\(\s*["']([^"']+)["']/g;
  let match;

  while ((match = widgetPattern.exec(content)) !== null) {
    const widgetType = match[1];
    const label = match[2];
    fields.push({
      name: label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      label,
      type: widgetType === 'file_uploader' ? 'file' : 'textarea',
      required: true
    });
  }

  // Also look for question text_input
  const questionMatch = content.match(/question\s*=\s*st\.text_input\(["'](.+?)["']/);
  if (questionMatch && !fields.some(f => f.label.includes('Question'))) {
    fields.push({ name: 'question', label: questionMatch[1], type: 'text', required: true });
  }

  return fields;
}

// Run
runConversion().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
