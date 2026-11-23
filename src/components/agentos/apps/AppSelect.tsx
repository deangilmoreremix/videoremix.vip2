// src/components/agentos/apps/AppSelect.tsx
//
// Choose one of the 117 Awesome LLM apps, grouped by category. A native select
// so it works with the keyboard, screen readers and phone pickers.

import { APP_REGISTRY } from "../../../config/appRegistry";

const APPS = APP_REGISTRY.filter((app) => app.family === "awesome-llm");
const GROUPS = (() => {
  const byCategory = new Map<string, typeof APPS>();
  for (const app of APPS) {
    const list = byCategory.get(app.category) ?? [];
    list.push(app);
    byCategory.set(app.category, list);
  }
  return [...byCategory.entries()];
})();

const titleCase = (value: string) =>
  value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const AppSelect: React.FC<{
  id: string;
  value: string;
  onChange: (slug: string) => void;
}> = ({ id, value, onChange }) => (
  <select
    id={id}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-agentos-brand/60 focus:outline-none"
  >
    <option value="">Choose an app…</option>
    {GROUPS.map(([category, apps]) => (
      <optgroup key={category} label={titleCase(category)}>
        {apps.map((app) => (
          <option key={app.slug} value={app.slug}>
            {app.name}
          </option>
        ))}
      </optgroup>
    ))}
  </select>
);

export default AppSelect;
