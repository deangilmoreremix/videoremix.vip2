// supabase/functions/_shared/app-catalog-tool.ts
//
// How an agent sees the Awesome LLM apps.
//
// WHY
//   The videoremix_apps tool used to say only "Invoke an app from the
//   VideoRemix app catalog" with a free-text slug, so the model could not know
//   which apps exist and guessed slugs. The tool description now lists the
//   apps this agent may use, and the slug is an enum of exactly those.
//
// Pure functions with no Deno imports, so vitest can test them directly.

import { APP_CATALOG, APP_CATALOG_BY_SLUG, type CatalogApp } from './app-catalog.ts';

export interface AppsToolSpec {
  description: string;
  parameters: Record<string, unknown>;
}

/** The apps an agent may run: its allow-list, or every app when it has none. */
export function allowedCatalogApps(allowedSlugs: unknown): CatalogApp[] {
  if (!Array.isArray(allowedSlugs) || allowedSlugs.length === 0) return APP_CATALOG;
  const wanted = new Set(allowedSlugs.map((slug) => String(slug)));
  return APP_CATALOG.filter((app) => wanted.has(app.slug));
}

/** The videoremix_apps tool, specialised to what this agent may run. */
export function buildAppsToolSpec(allowedSlugs: unknown): AppsToolSpec {
  const apps = allowedCatalogApps(allowedSlugs);
  const list = apps.map((app) => `- ${app.slug}: ${app.name}. ${app.description}`).join('\n');
  return {
    description: [
      'Run one of the VideoRemix AI apps and get its result back.',
      'Pass the app slug and its inputs. Most apps take a single text field:',
      'inputs = { "request": "<what you want, with any URLs or details>" }.',
      'Apps you may run:',
      list,
    ].join('\n'),
    parameters: {
      type: 'object',
      properties: {
        app_slug: {
          type: 'string',
          enum: apps.map((app) => app.slug),
          description: 'The app to run.',
        },
        inputs: {
          type: 'object',
          additionalProperties: true,
          description: 'The app inputs, usually { "request": "..." }.',
        },
      },
      required: ['app_slug', 'inputs'],
    },
  };
}

/** True when the slug names a catalog app. */
export function isCatalogApp(slug: string): boolean {
  return APP_CATALOG_BY_SLUG.has(slug);
}

/** Up to `limit` catalog slugs that look like the one asked for. */
export function closestCatalogSlugs(slug: string, limit = 3): string[] {
  const words = slug.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  if (words.length === 0) return [];
  return APP_CATALOG.map((app) => {
    const haystack = `${app.slug} ${app.name}`.toLowerCase();
    const score = words.filter((word) => haystack.includes(word)).length;
    return { slug: app.slug, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.slug);
}

/** The error an agent gets for a slug that is not an app. */
export function unknownAppMessage(slug: string): string {
  const close = closestCatalogSlugs(slug);
  return close.length > 0
    ? `${slug} is not a VideoRemix app. Did you mean: ${close.join(', ')}?`
    : `${slug} is not a VideoRemix app.`;
}

/** What an owner sees when their agents have no key to run on. */
export const MISSING_OWNER_KEY_MESSAGE =
  'Add your OpenAI API key in Settings and turn on "Let my agents use this key". ' +
  'Agents run on your own key.';
