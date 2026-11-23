// src/config/upstreamAppSpecs.ts
//
// Each Awesome LLM app's screen as upstream builds it
// (github.com/Shubhamsaboo/awesome-llm-apps), for UpstreamAppPage.
//
//   * Streamlit apps: extracted from their code (upstreamAppSpecs.generated.ts,
//     by scripts/conversion/extract-upstream-ui.py): title, intro, every input
//     with its label, options and default, sidebar placement, tabs, the run
//     button's text and the outputs.
//   * Other apps (agent skills, Google ADK and Agno chat agents, CopilotKit
//     apps, command-line tools): written by hand (upstreamAppSpecs.manual.ts).
//
// API-key fields are left out: every app runs on the key the user saved once
// (src/lib/userApiKeys.ts).

import { GENERATED_SPECS } from "./upstreamAppSpecs.generated";
import { MANUAL_SPECS } from "./upstreamAppSpecs.manual";
import type { UpstreamAppSpec, UpstreamField, UpstreamFieldKind } from "./upstreamAppSpecTypes";

export type { UpstreamAppSpec, UpstreamField } from "./upstreamAppSpecTypes";

/** Upstream labels carry emoji and trailing colons; the label text stays theirs. */
export function cleanLabel(label: string): string {
  return label
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/\s*:\s*$/, "")
    .trim();
}

export function fieldName(label: string, taken: Set<string>): string {
  const base =
    cleanLabel(label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "input";
  let name = base;
  for (let index = 2; taken.has(name); index += 1) name = `${base}_${index}`;
  taken.add(name);
  return name;
}

const SECONDARY_BUTTON = /clear|reset|delete|remove|new chat|new session|stop|logout|log out|refresh|example|sample/i;
const ENV_FIELD = /^(model|base url|ollama|endpoint|host)\b/i;
/** Settings for upstream's own infrastructure (a local model, a database), which run differently here. */
const INFRA_FIELD = /(model path|embedder|database url|db url|qdrant|endpoint|base url|ollama|host url|port\b|collection name|vector store url|server url|mcp server)/i;

interface GeneratedField {
  kind: UpstreamFieldKind;
  widget: string;
  label: string | null;
  sidebar: boolean;
  tab: string | null;
  options?: string[];
  value?: unknown;
  index?: number;
  placeholder?: string;
  help?: string;
  min_value?: number;
  max_value?: number;
  step?: number;
  default?: unknown;
  accept?: string[];
  multiple?: boolean;
  is_api_key: boolean;
}

function fromGenerated(slug: string, raw: Record<string, any>): UpstreamAppSpec {
  const taken = new Set<string>();
  const fields: UpstreamField[] = [];
  let droppedInfra = false;
  for (const field of (raw.fields ?? []) as GeneratedField[]) {
    if (field.is_api_key || !field.label) continue;
    const label = cleanLabel(field.label);
    if (!label) continue;
    if (INFRA_FIELD.test(label)) {
      droppedInfra = true;
      continue;
    }
    const spec: UpstreamField = {
      name: fieldName(label, taken),
      kind: field.kind,
      label,
      sidebar: field.sidebar,
      tab: field.tab ?? null,
    };
    if (field.options?.length) spec.options = field.options.map((option) => cleanLabel(String(option)) || String(option));
    if (typeof field.placeholder === "string") spec.placeholder = field.placeholder;
    if (typeof field.help === "string") spec.help = field.help;
    if (typeof field.min_value === "number") spec.min = field.min_value;
    if (typeof field.max_value === "number") spec.max = field.max_value;
    if (typeof field.step === "number") spec.step = field.step;
    if (field.accept) spec.accept = field.accept.map((type) => (type.includes("/") || type.startsWith(".") ? type : `.${type}`));
    if (field.multiple) spec.multiple = true;
    // The default: an explicit value, a select's index, or a multiselect's default list.
    if (field.value !== undefined && field.value !== null && typeof field.value !== "object") {
      spec.value = field.value as string | number | boolean;
    } else if (typeof field.index === "number" && spec.options?.[field.index] !== undefined) {
      spec.value = spec.options[field.index];
    } else if (Array.isArray(field.default)) {
      spec.value = (field.default as unknown[]).map((entry) => cleanLabel(String(entry)));
    } else if ((field.kind === "select" || field.kind === "radio") && spec.options?.length) {
      spec.value = spec.options[0];
    }
    fields.push(spec);
  }

  const texts = (raw.texts ?? []) as Array<{ kind: string; text: string; sidebar: boolean }>;
  const mainTexts = texts.filter((text) => !text.sidebar);
  const titleText = mainTexts.find((text) => text.kind === "title")?.text ?? raw.title ?? slug;
  const intro = mainTexts
    // Captions and markdown introduce the app; st.info / st.text are usually
    // runtime status ("Answering from general knowledge.").
    .filter((text) => ["caption", "markdown", "write", "subheader"].includes(text.kind))
    .map((text) => text.text.replace(/<[^>]+>/g, "").replace(/[#*_`>]/g, "").trim())
    .filter((text) => text.length > 30 && !/api key/i.test(text))[0];

  const buttons = (raw.buttons ?? []) as Array<{ label: string; sidebar: boolean }>;
  const primary =
    buttons.find((button) => !button.sidebar && !SECONDARY_BUTTON.test(button.label)) ??
    buttons.find((button) => !SECONDARY_BUTTON.test(button.label));

  const chat = Boolean(raw.chat);
  return {
    slug,
    layout: chat ? "chat" : "form",
    title: cleanLabel(String(titleText)) || slug,
    intro: intro ? intro.slice(0, 400) : raw.readme_summary ?? undefined,
    framework: "Streamlit",
    fields,
    runLabel: primary ? cleanLabel(primary.label) || "Run" : "Run",
    tabs: (raw.tabs ?? []).map((tab: string) => cleanLabel(tab)),
    outputs: raw.outputs ?? [],
    upstreamPath: raw.upstream_path,
    note:
      droppedInfra ||
      /ollama|locally|local model|llama 3|qwen|deepseek|gemma/i.test(`${titleText} ${intro ?? ""} ${raw.readme_summary ?? ""}`) ||
      fields.some((field) => ENV_FIELD.test(field.label) && field.options?.some((option) => /llama|ollama|qwen|mistral|deepseek|gemma|phi/i.test(option)))
        ? "Upstream runs this with a local model or its own database. Here the app runs on your OpenAI key, with the same inputs."
        : undefined,
  };
}

function build(): Record<string, UpstreamAppSpec> {
  const specs: Record<string, UpstreamAppSpec> = {};
  for (const [slug, raw] of Object.entries(GENERATED_SPECS)) {
    const manual = MANUAL_SPECS[slug];
    if (manual) {
      specs[slug] = {
        slug,
        layout: manual.layout,
        title: manual.title,
        intro: manual.intro,
        framework: manual.framework,
        fields: manual.fields ?? [],
        runLabel: manual.runLabel ?? "Send",
        tabs: [],
        outputs: [],
        examples: manual.examples,
        panel: manual.panel,
        attachments: manual.attachments,
        note: manual.note,
        upstreamPath: (raw as { upstream_path: string }).upstream_path,
      };
    } else {
      specs[slug] = fromGenerated(slug, raw as Record<string, any>);
    }
  }
  return specs;
}

export const UPSTREAM_APP_SPECS: Record<string, UpstreamAppSpec> = build();

export function getUpstreamSpec(slug: string): UpstreamAppSpec | undefined {
  return UPSTREAM_APP_SPECS[slug];
}

export const UPSTREAM_REPO_URL = "https://github.com/Shubhamsaboo/awesome-llm-apps/tree/main";
