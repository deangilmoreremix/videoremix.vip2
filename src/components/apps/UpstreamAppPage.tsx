// src/components/apps/UpstreamAppPage.tsx
//
// One page that draws any Awesome LLM app the way upstream builds it
// (src/config/upstreamAppSpecs.ts): the Streamlit layout with its sidebar
// settings, inputs, tabs and run button; a chat for the chat agents (ADK web,
// Agno playground, CopilotKit); or the inputs an agent skill or tool asks for.
// Every app runs through run-ai-app on the user's own key (runViaRunner).

import { useMemo, useRef, useState } from "react";
import { Copy, Download, ExternalLink, Info, Loader2, Paperclip, Send, Sparkles } from "lucide-react";
import { runViaRunner } from "../../pages/agents/runViaRunner";
import { getStoredKey } from "../../lib/userApiKeys";
import { YourApiKeyField } from "../ai/YourApiKeyField";
import { Markdown } from "./Markdown";
import { UPSTREAM_REPO_URL, type UpstreamAppSpec, type UpstreamField } from "../../config/upstreamAppSpecs";
import { cn } from "../../lib/utils";

type FieldValue = string | number | boolean | string[] | File[];

const TEXT_FILE = /\.(txt|md|markdown|csv|json|ya?ml|toml|py|js|ts|tsx|html|xml|log)$/i;
const MAX_FILE_TEXT = 20_000;

function initialValue(field: UpstreamField): FieldValue {
  if (field.kind === "file") return [];
  if (field.kind === "multiselect") return Array.isArray(field.value) ? field.value : [];
  if (field.kind === "checkbox") return Boolean(field.value);
  if (field.kind === "number" || field.kind === "slider") {
    return typeof field.value === "number" ? field.value : field.min ?? 0;
  }
  return field.value === undefined || Array.isArray(field.value) ? "" : String(field.value);
}

/** Files become text the runner can read: the content of text files, the name of others. */
async function filesToInput(files: File[]): Promise<string> {
  const parts: string[] = [];
  for (const file of files) {
    if (TEXT_FILE.test(file.name) && file.size < 2_000_000) {
      const text = await file.text();
      parts.push(`### ${file.name}\n${text.slice(0, MAX_FILE_TEXT)}`);
    } else {
      parts.push(`(attached: ${file.name}, ${Math.round(file.size / 1024)} KB)`);
    }
  }
  return parts.join("\n\n");
}

async function collectInputs(fields: UpstreamField[], values: Record<string, FieldValue>) {
  const inputs: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.kind === "chat") continue;
    const value = values[field.name];
    if (field.kind === "file") {
      const files = (value as File[]) ?? [];
      if (files.length) inputs[field.name] = await filesToInput(files);
      continue;
    }
    if (value === "" || (Array.isArray(value) && value.length === 0)) continue;
    inputs[field.name] = Array.isArray(value) ? value.join(", ") : value;
  }
  return inputs;
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-agentos-brand/60 focus:outline-none";

const FieldControl: React.FC<{
  field: UpstreamField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  slug: string;
}> = ({ field, value, onChange, slug }) => {
  const id = `${slug}-${field.name}`;
  const label = (
    <label htmlFor={id} className="mb-1.5 block text-sm text-white/80">
      {field.label}
    </label>
  );
  const help = field.help ? <p className="mt-1 text-xs text-white/40">{field.help}</p> : null;

  switch (field.kind) {
    case "textarea":
      return (
        <div>
          {label}
          <textarea
            id={id}
            rows={5}
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
          {help}
        </div>
      );
    case "number":
      return (
        <div>
          {label}
          <input
            id={id}
            type="number"
            value={Number(value)}
            min={field.min}
            max={field.max}
            step={field.step}
            onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
            className={inputClass}
          />
          {help}
        </div>
      );
    case "slider":
      return (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm text-white/80">
            <label htmlFor={id}>{field.label}</label>
            <span className="tabular-nums text-white/60">{String(value)}</span>
          </div>
          <input
            id={id}
            type="range"
            value={Number(value)}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            onChange={(event) => onChange(Number(event.target.value))}
            className="w-full accent-[hsl(var(--primary))]"
          />
          {help}
        </div>
      );
    case "select":
      return (
        <div>
          {label}
          <select id={id} value={String(value)} onChange={(event) => onChange(event.target.value)} className={inputClass}>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {help}
        </div>
      );
    case "radio":
      return (
        <fieldset>
          <legend className="mb-1.5 text-sm text-white/80">{field.label}</legend>
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((option) => (
              <label
                key={option}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-xs",
                  value === option ? "border-agentos-brand/60 bg-agentos-brand/15 text-white" : "border-white/10 text-white/60",
                )}
              >
                <input
                  type="radio"
                  name={id}
                  value={option}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  className="sr-only"
                />
                {option}
              </label>
            ))}
          </div>
          {help}
        </fieldset>
      );
    case "multiselect":
      return (
        <fieldset>
          <legend className="mb-1.5 text-sm text-white/80">{field.label}</legend>
          <div className="flex flex-wrap gap-2">
            {(field.options ?? []).map((option) => {
              const chosen = (value as string[]).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={chosen}
                  onClick={() =>
                    onChange(chosen ? (value as string[]).filter((entry) => entry !== option) : [...(value as string[]), option])
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    chosen ? "border-agentos-brand/60 bg-agentos-brand/15 text-white" : "border-white/10 text-white/60 hover:bg-white/[0.04]",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {help}
        </fieldset>
      );
    case "checkbox":
      return (
        <label htmlFor={id} className="flex items-center gap-2 text-sm text-white/80">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="accent-[hsl(var(--primary))]"
          />
          {field.label}
        </label>
      );
    case "file":
      return (
        <div>
          {label}
          <input
            id={id}
            type="file"
            multiple={field.multiple}
            accept={field.accept?.join(",")}
            onChange={(event) => onChange(Array.from(event.target.files ?? []))}
            className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white hover:file:bg-white/15"
          />
          <p className="mt-1 text-xs text-white/40">Text files are read in full; for other files the app gets the file name.</p>
        </div>
      );
    case "date":
    case "time":
    case "color":
      return (
        <div>
          {label}
          <input id={id} type={field.kind} value={String(value)} onChange={(event) => onChange(event.target.value)} className={inputClass} />
          {help}
        </div>
      );
    default:
      return (
        <div>
          {label}
          <input
            id={id}
            type="text"
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
            className={inputClass}
          />
          {help}
        </div>
      );
  }
};

const ResultPanel: React.FC<{ title: string; text: string; slug: string }> = ({ title, text, slug }) => {
  const [copied, setCopied] = useState(false);
  return (
    <section aria-label={title} className="agentos-card mt-6 rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(text).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/70 hover:bg-white/[0.06]"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" /> {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => {
              const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
              const link = document.createElement("a");
              link.href = url;
              link.download = `${slug}.md`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/70 hover:bg-white/[0.06]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
          </button>
        </div>
      </div>
      <Markdown source={text} />
    </section>
  );
};

interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export const UpstreamAppPage: React.FC<{ spec: UpstreamAppSpec }> = ({ spec }) => {
  const [values, setValues] = useState<Record<string, FieldValue>>(() =>
    Object.fromEntries(spec.fields.map((field) => [field.name, initialValue(field)])),
  );
  const [activeTab, setActiveTab] = useState(spec.tabs[0] ?? "");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const threadEnd = useRef<HTMLDivElement | null>(null);
  const hasKey = Boolean(getStoredKey("openai") || getStoredKey("xai"));

  const isChat = spec.layout === "chat" || spec.fields.some((field) => field.kind === "chat");
  const chatField = spec.fields.find((field) => field.kind === "chat");
  const settings = spec.fields.filter((field) => field.kind !== "chat" && field.sidebar);
  const tabbed = spec.tabs.length > 0 && spec.fields.some((field) => field.tab);
  const main = spec.fields.filter(
    (field) => field.kind !== "chat" && !field.sidebar && (!tabbed || !field.tab || field.tab === activeTab),
  );
  const resultTitle = spec.panel ?? "Result";

  const setValue = (name: string, value: FieldValue) => setValues((current) => ({ ...current, [name]: value }));

  const run = async (extra: Record<string, unknown> = {}) => {
    setRunning(true);
    setError(null);
    try {
      const inputs = { ...(await collectInputs(spec.fields, values)), ...extra };
      const response = await runViaRunner(spec.slug, inputs);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The app could not run.");
      return String(data.result ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setRunning(false);
    }
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = await run();
    if (text !== null) setResult(text);
  };

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || running) return;
    const history = turns.slice(-10).map((turn) => `${turn.role === "user" ? "User" : "Assistant"}: ${turn.text}`).join("\n\n");
    setTurns((current) => [...current, { role: "user", text: content }]);
    setMessage("");
    const extra: Record<string, unknown> = { message: content };
    if (history) extra.conversation_so_far = history;
    if (attachments.length) extra.attachments = await filesToInput(attachments);
    const answer = await run(extra);
    if (answer !== null) {
      setTurns((current) => [...current, { role: "assistant", text: answer }]);
      window.setTimeout(() => threadEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
    }
  };

  const header = useMemo(
    () => (
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{spec.title}</h1>
        {spec.intro ? <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-white/55">{spec.intro}</p> : null}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/35">
          <span>From awesome-llm-apps · {spec.framework}</span>
          <a
            href={`${UPSTREAM_REPO_URL}/${spec.upstreamPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-agentos-brand-soft hover:underline"
          >
            Source <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
        {spec.note ? (
          <p className="mt-3 flex max-w-3xl items-start gap-2 rounded-lg border border-sky-400/20 bg-sky-500/[0.06] px-3 py-2 text-xs leading-5 text-sky-100/80">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {spec.note}
          </p>
        ) : null}
      </header>
    ),
    [spec],
  );

  const settingsPanel =
    settings.length > 0 ? (
      <aside aria-label="Settings" className="agentos-card h-fit space-y-4 rounded-2xl p-4 lg:sticky lg:top-20">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Settings</p>
        {settings.map((field) => (
          <FieldControl key={field.name} field={field} value={values[field.name]} onChange={(value) => setValue(field.name, value)} slug={spec.slug} />
        ))}
      </aside>
    ) : null;

  const errorBox = error ? (
    <p role="alert" className="mt-4 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
      {error}
    </p>
  ) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {header}
      {!hasKey ? (
        <div className="mb-5 max-w-3xl">
          <YourApiKeyField />
        </div>
      ) : null}

      <div className={cn("grid gap-6", settingsPanel && "lg:grid-cols-[280px_minmax(0,1fr)]")}>
        {settingsPanel}

        <div className="min-w-0">
          {isChat ? (
            <section aria-label="Chat" className="agentos-card flex min-h-[420px] flex-col rounded-2xl">
              {main.length > 0 ? (
                <div className="space-y-4 border-b border-white/[0.06] p-4">
                  {main.map((field) => (
                    <FieldControl key={field.name} field={field} value={values[field.name]} onChange={(value) => setValue(field.name, value)} slug={spec.slug} />
                  ))}
                </div>
              ) : null}
              <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
                {turns.length === 0 ? (
                  <div className="py-6 text-center">
                    <Sparkles className="mx-auto h-6 w-6 text-agentos-brand" aria-hidden="true" />
                    <p className="mt-2 text-sm text-white/55">{chatField?.label ?? "Ask anything to get started."}</p>
                    {spec.examples?.length ? (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {spec.examples.map((example) => (
                          <button
                            key={example}
                            type="button"
                            onClick={() => void sendMessage(example)}
                            className="max-w-full rounded-xl border border-white/10 px-3 py-1.5 text-left text-xs text-white/70 hover:border-agentos-brand/40 hover:bg-white/[0.03]"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  turns.map((turn, index) =>
                    turn.role === "user" ? (
                      <div key={index} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-agentos-brand/20 px-3.5 py-2.5 text-sm text-white">
                        {turn.text}
                      </div>
                    ) : (
                      <div key={index} className="max-w-full rounded-2xl rounded-bl-sm border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
                        {spec.panel ? <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">{spec.panel}</p> : null}
                        <Markdown source={turn.text} />
                      </div>
                    ),
                  )
                )}
                {running ? (
                  <p className="flex items-center gap-2 text-sm text-white/50">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Thinking…
                  </p>
                ) : null}
                <div ref={threadEnd} />
              </div>
              <form
                className="border-t border-white/[0.06] p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(message);
                }}
              >
                {spec.attachments ? (
                  <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-white/55 hover:text-white">
                    <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                    {attachments.length ? attachments.map((file) => file.name).join(", ") : spec.attachments.label}
                    <input
                      type="file"
                      className="sr-only"
                      accept={spec.attachments.accept.join(",")}
                      multiple={spec.attachments.multiple}
                      onChange={(event) => setAttachments(Array.from(event.target.files ?? []))}
                    />
                  </label>
                ) : null}
                <div className="flex items-end gap-2">
                  <label htmlFor={`${spec.slug}-message`} className="sr-only">
                    {chatField?.label ?? "Message"}
                  </label>
                  <textarea
                    id={`${spec.slug}-message`}
                    rows={2}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage(message);
                      }
                    }}
                    placeholder={chatField?.label ?? "Message"}
                    className={cn(inputClass, "resize-none")}
                  />
                  <button
                    type="submit"
                    disabled={running || !message.trim()}
                    className="bg-agentos-brand inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only">Send</span>
                  </button>
                </div>
              </form>
              {errorBox ? <div className="px-4 pb-4">{errorBox}</div> : null}
            </section>
          ) : (
            <>
              <form onSubmit={(event) => void submitForm(event)} className="agentos-card space-y-5 rounded-2xl p-5">
                {tabbed ? (
                  <div role="tablist" aria-label="Sections" className="-mt-1 flex flex-wrap gap-1 border-b border-white/[0.06] pb-3">
                    {spec.tabs.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-sm",
                          activeTab === tab ? "bg-white/10 text-white" : "text-white/55 hover:text-white",
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                ) : null}
                {main.length === 0 && settings.length === 0 ? (
                  <p className="text-sm text-white/55">This app needs no input. Press the button to run it.</p>
                ) : null}
                {main.map((field) => (
                  <FieldControl key={field.name} field={field} value={values[field.name]} onChange={(value) => setValue(field.name, value)} slug={spec.slug} />
                ))}
                <button
                  type="submit"
                  disabled={running}
                  className="bg-agentos-brand inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
                >
                  {running ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  {running ? "Running…" : spec.runLabel}
                </button>
                {spec.examples?.length ? (
                  <p className="text-xs text-white/40">Try: {spec.examples.join(" · ")}</p>
                ) : null}
              </form>
              {errorBox}
              {result !== null ? <ResultPanel title={resultTitle} text={result} slug={spec.slug} /> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpstreamAppPage;
