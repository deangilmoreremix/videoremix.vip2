// src/components/agentos/apps/AppPicker.tsx
//
// Choose which of the 117 Awesome LLM apps an agent may run. Replaces the old
// free-text "allowed app slugs" field, which needed slugs nobody knows.
// An empty selection means every app is allowed.

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { APP_REGISTRY } from "../../../config/appRegistry";

const APPS = APP_REGISTRY.filter((app) => app.family === "awesome-llm");
const NAME_BY_SLUG = new Map(APPS.map((app) => [app.slug, app.name]));

const titleCase = (value: string) =>
  value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export interface AppPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  id?: string;
}

export const AppPicker: React.FC<AppPickerProps> = ({ value, onChange, id = "app-picker" }) => {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(value), [value]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = APPS.filter(
      (app) =>
        !needle ||
        app.name.toLowerCase().includes(needle) ||
        app.description.toLowerCase().includes(needle) ||
        app.category.toLowerCase().includes(needle),
    );
    const byCategory = new Map<string, typeof APPS>();
    for (const app of matches) {
      const list = byCategory.get(app.category) ?? [];
      list.push(app);
      byCategory.set(app.category, list);
    }
    return [...byCategory.entries()];
  }, [query]);

  const toggle = (slug: string) =>
    onChange(selected.has(slug) ? value.filter((entry) => entry !== slug) : [...value, slug]);

  return (
    <div>
      {value.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Chosen apps">
          {value.map((slug) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => toggle(slug)}
                className="flex items-center gap-1 rounded-full border border-agentos-brand/40 bg-agentos-brand/15 px-2.5 py-0.5 text-[11px] text-white"
                aria-label={`Remove ${NAME_BY_SLUG.get(slug) ?? slug}`}
              >
                {NAME_BY_SLUG.get(slug) ?? slug}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-[11px] text-white/45">No apps chosen: this agent may run every app.</p>
      )}

      <label htmlFor={`${id}-search`} className="sr-only">
        Search apps
      </label>
      <input
        id={`${id}-search`}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search the 117 apps…"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-agentos-brand/60 focus:outline-none"
      />

      <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/10">
        {groups.length === 0 ? (
          <p className="p-3 text-xs text-white/45">No app matches.</p>
        ) : (
          groups.map(([category, apps]) => (
            <fieldset key={category} className="border-b border-white/[0.06] last:border-b-0">
              <legend className="sr-only">{titleCase(category)}</legend>
              <p className="bg-white/[0.02] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40">
                {titleCase(category)}
              </p>
              {apps.map((app) => (
                <label
                  key={app.slug}
                  className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-white/[0.03]"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(app.slug)}
                    onChange={() => toggle(app.slug)}
                    className="mt-0.5 accent-[hsl(var(--primary))]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-white">{app.name}</span>
                    <span className="block truncate text-[11px] text-white/40">{app.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          ))
        )}
      </div>
    </div>
  );
};

export default AppPicker;
