export type AppInputKind = "text" | "textarea" | "number" | "select" | "multiselect" | "boolean" | "file";

export interface AppInputField {
  key: string;
  label: string;
  kind: AppInputKind;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean | string[];
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
  maxLength?: number;
  description?: string;
}

export interface AppOutputField {
  key: string;
  label: string;
  kind: "text" | "markdown" | "html" | "image" | "audio" | "file";
}

export interface AppRunRequest {
  tenantId: string;
  userId: string;
  input: Record<string, unknown>;
  metadata?: Record<string, string>;
}

export interface AppRunResult {
  output: Record<string, unknown>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    model?: string;
  };
  status: "completed" | "failed" | "partial";
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

export interface AppSpec {
  id: string;
  name: string;
  description: string;
  version: string;
  runtime: "openai-responses";
  model: string;
  systemPrompt: string;
  userPromptTemplate: string;
  inputs: AppInputField[];
  outputs: AppOutputField[];
  estimatedInputTokens: (input: Record<string, unknown>) => number;
  execute: (request: AppRunRequest) => Promise<AppRunResult>;
}

export interface TenantKey {
  tenantId: string;
  keyLabel: string;
  provider: "openai";
  scopes: string[];
}

export type KeyResolution = { source: "platform" } | { source: "tenant"; tenantKey: TenantKey };

export interface ResolveKeyInput {
  tenantId: string;
  provider: "openai";
}

export type ResolveKeyOutput = { resolvedKey: string; keyResolution: KeyResolution };
