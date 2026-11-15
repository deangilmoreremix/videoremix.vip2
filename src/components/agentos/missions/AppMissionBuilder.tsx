// src/components/agentos/missions/AppMissionBuilder.tsx
//
// Build a mission from apps: pick the apps in order and say what each one
// should do. Each step runs on the owner's own key and receives the results of
// the steps before it.

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, KeyRound, Plus, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Section } from "../ui";
import { AppSelect } from "../apps/AppSelect";
import { getAppMeta } from "../../../config/appRegistry";
import {
  APP_MISSION_TEMPLATES,
  createAppMission,
  validateAppMission,
  type AppMissionStep,
} from "../../../services/agentos/appMissions";
import { getAgentKeyStatus } from "../../../services/agentos/agentKeys";
import { cn } from "../../../lib/utils";

interface DraftStep extends AppMissionStep {
  key: number;
}

let stepCounter = 0;
const draft = (step: AppMissionStep): DraftStep => ({ ...step, key: stepCounter++ });

export const AppMissionBuilder: React.FC<{ initialApp?: string }> = ({ initialApp }) => {
  const navigate = useNavigate();
  const startApp = initialApp && getAppMeta(initialApp) ? initialApp : "";
  const [title, setTitle] = useState(startApp ? `${getAppMeta(startApp)?.name} mission` : "");
  const [goal, setGoal] = useState("");
  const [steps, setSteps] = useState<DraftStep[]>(() => [
    draft({ app_slug: startApp, request: "" }),
    draft({ app_slug: "", request: "" }),
  ]);
  const [template, setTemplate] = useState<string | null>(null);
  const [agentKey, setAgentKey] = useState<"unknown" | "saved" | "missing">("unknown");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAgentKeyStatus().then((result) => {
      if (!cancelled) setAgentKey(result.ok ? (result.status.saved ? "saved" : "missing") : "unknown");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const applyTemplate = (id: string) => {
    const chosen = APP_MISSION_TEMPLATES.find((entry) => entry.id === id);
    if (!chosen) return;
    setTemplate(id);
    setTitle(chosen.title);
    setGoal(chosen.goal);
    setSteps(chosen.steps.map(draft));
    setError(null);
  };

  const patch = (key: number, change: Partial<AppMissionStep>) =>
    setSteps((current) => current.map((step) => (step.key === key ? { ...step, ...change } : step)));

  const move = (index: number, by: -1 | 1) =>
    setSteps((current) => {
      const next = [...current];
      const target = index + by;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const submit = async () => {
    const cleaned = steps.map(({ app_slug, request }) => ({ app_slug, request }));
    const problem = validateAppMission(title, cleaned);
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await createAppMission({ title, goal, steps: cleaned });
    setSubmitting(false);
    if (result.error || !result.data) {
      setError(result.error?.message ?? "Could not create the mission.");
      return;
    }
    navigate(`/dashboard/missions/${result.data.id}`);
  };

  return (
    <div className="space-y-5">
      {agentKey === "missing" ? (
        <p className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
          Missions run on your own OpenAI key while you are away.
          <Link to="/dashboard/settings" className="font-medium underline">
            Add it under Settings → Let my agents use this key
          </Link>
        </p>
      ) : null}

      <Section title="Start from a template" description="Or build your own chain below.">
        <div className="grid gap-3 sm:grid-cols-2">
          {APP_MISSION_TEMPLATES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => applyTemplate(entry.id)}
              aria-pressed={template === entry.id}
              className={cn(
                "rounded-xl border px-4 py-3 text-left transition",
                template === entry.id
                  ? "border-agentos-brand/60 bg-agentos-brand/10"
                  : "border-white/10 hover:bg-white/[0.04]",
              )}
            >
              <span className="block text-sm font-medium text-white">{entry.title}</span>
              <span className="mt-1 block text-xs text-white/45">
                {entry.steps.map((step) => getAppMeta(step.app_slug)?.name ?? step.app_slug).join(" → ")}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Mission">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50" htmlFor="app-mission-title">
              Name
            </label>
            <Input
              id="app-mission-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Weekly competitor brief"
            />
          </div>
          <div>
            <label className="text-xs text-white/50" htmlFor="app-mission-goal">
              Goal (optional)
            </label>
            <Textarea
              id="app-mission-goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              rows={2}
              placeholder="What you want at the end."
            />
          </div>
        </div>
      </Section>

      <Section
        title="Steps"
        description="The apps run in this order. Each step gets the results of the steps before it."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSteps((current) => [...current, draft({ app_slug: "", request: "" })])}
          >
            <Plus className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Add step
          </Button>
        }
      >
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step.key} className="rounded-xl border border-white/5 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-white/50">Step {index + 1}</p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-white/40 hover:text-white disabled:opacity-30"
                    aria-label={`Move step ${index + 1} up`}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === steps.length - 1}
                    className="rounded p-1 text-white/40 hover:text-white disabled:opacity-30"
                    aria-label={`Move step ${index + 1} down`}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {steps.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setSteps((current) => current.filter((entry) => entry.key !== step.key))}
                      className="rounded p-1 text-white/40 hover:text-rose-300"
                      aria-label={`Remove step ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-white/50" htmlFor={`step-app-${step.key}`}>
                    App
                  </label>
                  <AppSelect
                    id={`step-app-${step.key}`}
                    value={step.app_slug}
                    onChange={(app_slug) => patch(step.key, { app_slug })}
                  />
                  {step.app_slug ? (
                    <p className="mt-1 line-clamp-2 text-[11px] text-white/40">
                      {getAppMeta(step.app_slug)?.description}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="text-xs text-white/50" htmlFor={`step-request-${step.key}`}>
                    What should this step do?
                  </label>
                  <Textarea
                    id={`step-request-${step.key}`}
                    value={step.request}
                    onChange={(event) => patch(step.key, { request: event.target.value })}
                    rows={2}
                    placeholder={
                      index === 0
                        ? "The job, with any links or details: Research the market for…"
                        : "Optional. It already gets the earlier results, e.g. Turn this into a one-page brief."
                    }
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/dashboard/missions")}>
          Cancel
        </Button>
        <Button disabled={submitting} onClick={() => void submit()}>
          {submitting ? "Starting…" : "Start mission"}
        </Button>
      </div>
    </div>
  );
};

export default AppMissionBuilder;
