// supabase/functions/_shared/mission-steps.ts
//
// How the steps of a mission hand their results to each other.
//
// WHY
//   A mission is a chain: "research this → write an article from it → turn it
//   into social posts". The queue already runs the steps in order
//   (agentos.task_edges), but nothing passed a step's result on, so every
//   step started from scratch. These helpers build that hand-off.
//
// Pure functions with no Deno imports, so vitest can test them directly.

/** Each earlier result is capped so a long chain can't overflow the prompt. */
export const UPSTREAM_RESULT_CAP = 6000;

export interface UpstreamResult {
  title: string;
  result: string;
}

/** A task that runs one app directly, with no model call of its own. */
export interface AppStep {
  app_slug: string;
  request: string;
}

/** The app step a task carries, if it is one. */
export function readAppStep(input: unknown): AppStep | null {
  if (typeof input !== 'object' || input === null) return null;
  const step = (input as Record<string, unknown>).app_step;
  if (typeof step !== 'object' || step === null) return null;
  const slug = (step as Record<string, unknown>).app_slug;
  const request = (step as Record<string, unknown>).request;
  if (typeof slug !== 'string' || !slug.trim()) return null;
  return { app_slug: slug.trim(), request: typeof request === 'string' ? request : '' };
}

function cap(text: string): string {
  return text.length > UPSTREAM_RESULT_CAP
    ? `${text.slice(0, UPSTREAM_RESULT_CAP)}\n…(cut to ${UPSTREAM_RESULT_CAP} characters)`
    : text;
}

/** The "results from earlier steps" block, or '' when there are none. */
export function formatUpstreamResults(results: UpstreamResult[]): string {
  const usable = results.filter((entry) => entry.result.trim());
  if (usable.length === 0) return '';
  return [
    '## Results from earlier steps',
    ...usable.map((entry) => `### ${entry.title}\n${cap(entry.result.trim())}`),
  ].join('\n\n');
}

/** What an app step sends to its app: the job, plus what came before. */
export function buildAppStepRequest(request: string, upstream: UpstreamResult[]): string {
  const job = request.trim() || 'Continue the work using the results from the earlier steps.';
  const earlier = formatUpstreamResults(upstream);
  return earlier ? `${job}\n\n${earlier}` : job;
}

/**
 * The text of an app's answer. The runner returns { output }, where output is
 * either the parsed JSON the model wrote or { content, … } for plain text.
 */
export function appResultText(response: unknown): string {
  if (typeof response === 'string') return response;
  if (typeof response !== 'object' || response === null) return String(response ?? '');
  const record = response as Record<string, unknown>;
  const output = 'output' in record ? record.output : record;
  if (typeof output === 'string') return output;
  if (typeof output === 'object' && output !== null) {
    const content = (output as Record<string, unknown>).content;
    if (typeof content === 'string' && content.trim()) return content;
    return JSON.stringify(output, null, 2);
  }
  return JSON.stringify(record, null, 2);
}

/** The result text a finished task stored, or '' if it has none. */
export function taskResultText(output: unknown): string {
  if (typeof output !== 'object' || output === null) return '';
  const result = (output as Record<string, unknown>).result;
  if (typeof result === 'string') return result;
  if (result === undefined || result === null) return '';
  return JSON.stringify(result, null, 2);
}
