// src/types/agentos.ts
//
// SHARED CONTRACT for the SapienX AgentOS port.
//
// Every AgentOS service, component, page, and edge function in this port must
// use these types. They mirror the `agentos` Supabase schema exactly
// (supabase/migrations/20261012120*00_agentos_*.sql) so a row can round-trip
// through the database without a hand-written mapping layer.
//
// Naming: database columns are snake_case and preserved verbatim (they are the
// wire format between the browser, the edge functions, and the queue RPCs).

/** The verified Clerk user id that owns a row (`owner_clerk_id`). */
export type ClerkUserId = string;

export type ISODateTime = string;

// ---------------------------------------------------------------------------
// Workspaces and teams
// ---------------------------------------------------------------------------

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Workspace {
  id: string;
  owner_clerk_id: ClerkUserId;
  name: string;
  description: string;
  goals: string;
  instructions: string;
  policies: WorkspacePolicies;
  settings: Record<string, unknown>;
  archived_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface WorkspacePolicies {
  /** Model ids allowed in this workspace. Empty = no restriction. */
  allowed_models?: string[];
  /** Tool keys that require an explicit human approval before execution. */
  approval_required_tools?: string[];
  /** Maximum credits a single mission may consume. */
  mission_credit_ceiling?: number;
  /** Block executions entirely (freeze switch). */
  executions_paused?: boolean;
  /** Restrict which app slugs a worker in this workspace may invoke. */
  allowed_app_slugs?: string[];
}

export interface WorkspaceMember {
  workspace_id: string;
  member_clerk_id: ClerkUserId;
  role: WorkspaceRole;
  invited_by: ClerkUserId | null;
  revoked_at: ISODateTime | null;
  created_at: ISODateTime;
}

// ---------------------------------------------------------------------------
// Digital workers
// ---------------------------------------------------------------------------

export type WorkerStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface Worker {
  id: string;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  name: string;
  role: string;
  avatar: string | null;
  accent: string;
  instructions: string;
  goals: string;
  status: WorkerStatus;
  model_provider: string;
  model_id: string;
  fallback_provider: string | null;
  fallback_model_id: string | null;
  temperature: number;
  max_output_tokens: number;
  tools: WorkerToolRef[];
  knowledge: WorkerKnowledgeRef[];
  memory_enabled: boolean;
  permissions: WorkerPermissions;
  heartbeat: WorkerHeartbeat;
  metadata: Record<string, unknown>;
  cloned_from: string | null;
  archived_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface WorkerToolRef {
  tool_key: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface WorkerKnowledgeRef {
  /** Document / knowledge source label. */
  name: string;
  kind: 'note' | 'file' | 'url' | 'memory';
  ref?: string;
}

export interface WorkerPermissions {
  /** Tool keys the worker may never call, even if assigned. */
  denied_tools?: string[];
  /** Requires a human approval row before these action types execute. */
  approval_required_actions?: string[];
  /** App slugs the worker may invoke from the 130-app catalog. */
  allowed_app_slugs?: string[];
  /** Allow outbound network calls. */
  allow_web_access?: boolean;
  /** Allow writing artifacts to storage. */
  allow_artifacts?: boolean;
}

export interface WorkerHeartbeat {
  enabled: boolean;
  /** Standard 5-field cron expression. */
  cron?: string;
  timezone?: string;
  /** Free-form prompt executed on each heartbeat. */
  prompt?: string;
}

export interface WorkerTool {
  id: string;
  worker_id: string;
  owner_clerk_id: ClerkUserId;
  tool_key: string;
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: ISODateTime;
}

// ---------------------------------------------------------------------------
// Memory and conversations
// ---------------------------------------------------------------------------

export type MemoryKind = 'fact' | 'preference' | 'note' | 'knowledge' | 'file' | 'summary';
export type MemoryScope = 'worker' | 'workspace';

export interface WorkerMemory {
  id: string;
  worker_id: string | null;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  kind: MemoryKind;
  scope: MemoryScope;
  content: string;
  source: string;
  importance: number;
  tags: string[];
  hit_count: number;
  last_used_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type ConversationChannel = 'ui' | 'canvas' | 'api' | 'schedule' | 'mission';

export interface Conversation {
  id: string;
  worker_id: string | null;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  title: string;
  channel: ConversationChannel;
  message_count: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  conversation_id: string;
  owner_clerk_id: ClerkUserId;
  role: MessageRole;
  content: string;
  tool_calls: unknown[];
  run_id: string | null;
  tokens: number;
  created_at: ISODateTime;
}

// ---------------------------------------------------------------------------
// Missions and tasks
// ---------------------------------------------------------------------------

export type MissionStatus =
  | 'draft' | 'planned' | 'active' | 'blocked'
  | 'completed' | 'failed' | 'cancelled';

export interface Mission {
  id: string;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  title: string;
  description: string;
  goal: string;
  status: MissionStatus;
  priority: number;
  created_by: 'user' | 'worker' | 'schedule' | 'api';
  started_at: ISODateTime | null;
  completed_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type TaskStatus =
  | 'pending' | 'blocked' | 'queued' | 'running'
  | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';

export type TaskTrigger = 'manual' | 'mission' | 'schedule' | 'handoff' | 'api';

export interface Task {
  id: string;
  mission_id: string | null;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  title: string;
  description: string;
  assigned_worker_id: string | null;
  status: TaskStatus;
  priority: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  attempt: number;
  max_attempts: number;
  trigger: TaskTrigger;
  run_after: ISODateTime;
  lease_owner: string | null;
  lease_expires_at: ISODateTime | null;
  handoff_to_task_id: string | null;
  requires_approval: boolean;
  approval_id: string | null;
  started_at: ISODateTime | null;
  completed_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface TaskEdge {
  task_id: string;
  waits_for: string;
  kind: 'depends_on' | 'handoff';
  created_at: ISODateTime;
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

export type RunStatus = 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timeout';

export interface ExecutionRun {
  id: string;
  task_id: string;
  worker_id: string | null;
  conversation_id: string | null;
  owner_clerk_id: ClerkUserId;
  status: RunStatus;
  trigger: TaskTrigger;
  model_provider: string | null;
  model_id: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  credits: number;
  attempt: number;
  lease_owner: string | null;
  lease_expires_at: ISODateTime | null;
  started_at: ISODateTime;
  ended_at: ISODateTime | null;
  error: string | null;
}

export type EventLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

/** Canonical execution event kinds emitted by the runtime. */
export const EXECUTION_EVENT_KINDS = [
  'run.started',
  'run.claimed',
  'plan.created',
  'tool.called',
  'tool.result',
  'app.invoked',
  'model.request',
  'model.response',
  'memory.retrieved',
  'memory.written',
  'handoff.requested',
  'approval.requested',
  'approval.granted',
  'approval.rejected',
  'run.succeeded',
  'run.failed',
  'run.cancelled',
  'run.timeout',
  'usage.recorded',
] as const;

export type ExecutionEventKind = (typeof EXECUTION_EVENT_KINDS)[number];

export interface ExecutionEvent {
  id: string;
  run_id: string | null;
  task_id: string | null;
  worker_id: string | null;
  owner_clerk_id: ClerkUserId;
  seq: number;
  kind: string;
  level: EventLevel;
  message: string;
  payload: Record<string, unknown>;
  created_at: ISODateTime;
}

// ---------------------------------------------------------------------------
// Schedules and approvals
// ---------------------------------------------------------------------------

export interface Schedule {
  id: string;
  mission_id: string | null;
  workspace_id: string | null;
  worker_id: string | null;
  owner_clerk_id: ClerkUserId;
  title: string;
  prompt: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  input: Record<string, unknown>;
  next_run_at: ISODateTime | null;
  last_run_at: ISODateTime | null;
  last_status: string | null;
  last_error: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export interface Approval {
  id: string;
  task_id: string | null;
  run_id: string | null;
  worker_id: string | null;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  action_type: string;
  action_payload: Record<string, unknown>;
  reason: string;
  status: ApprovalStatus;
  requested_at: ISODateTime;
  expires_at: ISODateTime | null;
  decided_at: ISODateTime | null;
  decided_by: ClerkUserId | null;
  decision_note: string | null;
}

// ---------------------------------------------------------------------------
// Models, providers, connections
// ---------------------------------------------------------------------------

export interface ModelCatalogEntry {
  id: string;
  provider: string;
  display_name: string;
  family: string;
  context_window: number;
  capabilities: string[];
  credit_rate_in: number;
  credit_rate_out: number;
  status: 'active' | 'preview' | 'deprecated';
}

export type ProviderMode = 'platform' | 'byok';

export interface ProviderConfig {
  id: string;
  owner_clerk_id: ClerkUserId;
  workspace_id: string | null;
  provider: string;
  label: string;
  mode: ProviderMode;
  /** Opaque server-side secret reference. NEVER a secret. */
  credential_ref: string | null;
  is_default: boolean;
  status: 'untested' | 'active' | 'error' | 'disabled';
  model_ids: string[];
  last_test_at: ISODateTime | null;
  last_test_note: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export type IntegrationSupport = 'supported' | 'limited' | 'unsupported';

export interface Integration {
  key: string;
  name: string;
  description: string;
  category: string;
  auth_type: 'api_key' | 'oauth2' | 'browser_session' | 'none';
  capabilities: string[];
  support: IntegrationSupport;
  docs_url: string | null;
}

export type ConnectionIsolation = 'tenant' | 'worker' | 'ephemeral';

export interface ConnectedAccount {
  id: string;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  integration_key: string;
  account_label: string;
  status: 'connected' | 'revoked' | 'error' | 'expired';
  scopes: string[];
  /** Opaque server-side secret reference. NEVER a secret. */
  credential_ref: string | null;
  metadata: Record<string, unknown>;
  isolation: ConnectionIsolation;
  health_status: 'unknown' | 'healthy' | 'degraded' | 'failed';
  last_checked_at: ISODateTime | null;
  connected_at: ISODateTime;
  revoked_at: ISODateTime | null;
}

// ---------------------------------------------------------------------------
// Artifacts, usage, audit, notifications, canvas
// ---------------------------------------------------------------------------

export interface Artifact {
  id: string;
  run_id: string | null;
  task_id: string | null;
  worker_id: string | null;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  kind: 'file' | 'text' | 'image' | 'audio' | 'video' | 'report';
  name: string;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  preview: string | null;
  metadata: Record<string, unknown>;
  created_at: ISODateTime;
}

export interface UsageRecord {
  id: string;
  owner_clerk_id: ClerkUserId;
  workspace_id: string | null;
  worker_id: string | null;
  run_id: string | null;
  provider: string;
  model_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  credits: number;
  cost_usd: number;
  created_at: ISODateTime;
}

export interface AuditLog {
  id: string;
  actor_clerk_id: ClerkUserId | null;
  acting_as: 'user' | 'worker' | 'system';
  action: string;
  entity_type: string;
  entity_id: string | null;
  workspace_id: string | null;
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: ISODateTime;
}

export interface AgentNotification {
  id: string;
  owner_clerk_id: ClerkUserId;
  kind: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: ISODateTime | null;
  created_at: ISODateTime;
}

export type CanvasNodeKind = 'workspace' | 'worker' | 'task' | 'model' | 'runtime' | 'surface';

export interface CanvasNode {
  id: string;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  node_kind: CanvasNodeKind;
  ref_id: string | null;
  label: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  z_index: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface CanvasEdge {
  id: string;
  workspace_id: string | null;
  owner_clerk_id: ClerkUserId;
  source_node_id: string;
  target_node_id: string;
  edge_kind: 'handoff' | 'dependency' | 'assignment' | 'data';
  label: string;
  animated: boolean;
  data: Record<string, unknown>;
  created_at: ISODateTime;
}

// ---------------------------------------------------------------------------
// Result envelopes used by every AgentOS service
// ---------------------------------------------------------------------------

export interface AgentOSResult<T> {
  data: T | null;
  error: AgentOSError | null;
}

export interface AgentOSError {
  code:
    | 'unauthenticated'
    | 'not_found'
    | 'forbidden'
    | 'validation'
    | 'conflict'
    | 'database'
    | 'unsupported'
    | 'unknown';
  message: string;
  /** Original database error message, for operator diagnostics only. */
  detail?: string;
}

export function ok<T>(data: T): AgentOSResult<T> {
  return { data, error: null };
}

export function err<T = never>(
  code: AgentOSError['code'],
  message: string,
  detail?: string,
): AgentOSResult<T> {
  return { data: null, error: { code, message, detail } };
}
