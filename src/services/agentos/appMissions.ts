// src/services/agentos/appMissions.ts
//
// Missions built from apps: "research this → write an article from it → turn
// it into social posts". Each step runs one app on the owner's own key, in
// order, and receives the results of the steps before it (the executor does
// that hand-off server-side, see supabase/functions/_shared/mission-steps.ts).
//
// Every step is created by the agentos-tasks function with its mission and
// its dependency in the same call, so a step can never start before the step
// it waits for exists.

import { getAppMeta } from "../../config/appRegistry";
import { createMission, createTask } from "./missions";
import { err, ok, type AgentOSResult, type Mission } from "../../types/agentos";

export interface AppMissionStep {
  app_slug: string;
  request: string;
}

export interface AppMissionTemplate {
  id: string;
  title: string;
  goal: string;
  steps: AppMissionStep[];
}

/** Ready-made chains. Every slug is checked against the catalog by a test. */
export const APP_MISSION_TEMPLATES: AppMissionTemplate[] = [
  {
    id: "research-article-social",
    title: "Research → article → social posts",
    goal: "Turn a topic into a researched article and a set of social posts.",
    steps: [
      { app_slug: "ai-deep-research-agent", request: "Research this topic in depth, with sources: " },
      { app_slug: "ai-journalist-agent", request: "Write a clear, well-structured article from the research." },
      {
        app_slug: "ai-social-media-news-and-podcast-agent",
        request: "Turn the article into posts for X, LinkedIn and Instagram.",
      },
    ],
  },
  {
    id: "competitor-sales",
    title: "Competitor intelligence → sales brief",
    goal: "Understand a competitor and turn it into talking points for sales.",
    steps: [
      { app_slug: "ai-competitor-intelligence-agent-team", request: "Analyse this competitor: " },
      {
        app_slug: "ai-sales-intelligence-agent-team",
        request: "Write a sales brief: where we win, objections to expect and how to answer them.",
      },
    ],
  },
  {
    id: "launch-post",
    title: "Product launch → launch posts",
    goal: "Study a product launch and draft the posts to announce ours.",
    steps: [
      { app_slug: "ai-product-launch-intelligence-agent", request: "Analyse the launch of this product: " },
      {
        app_slug: "ai-social-media-news-and-podcast-agent",
        request: "Draft launch-day posts that use what worked in that launch.",
      },
    ],
  },
  {
    id: "research-teaching",
    title: "Deep research → teaching plan",
    goal: "Learn a subject properly: research it, then turn it into a study plan.",
    steps: [
      { app_slug: "ai-deep-research-agent", request: "Research this subject for a beginner: " },
      { app_slug: "ai-teaching-agent-team", request: "Turn the research into a week-by-week learning plan with exercises." },
    ],
  },
];

export function appName(slug: string): string {
  return getAppMeta(slug)?.name ?? slug;
}

/** The step titles a mission shows: "1. AI Deep Research Agent". */
export function stepTitle(index: number, slug: string): string {
  return `${index + 1}. ${appName(slug)}`;
}

/** Problems that stop the mission from being created, in plain words. */
export function validateAppMission(title: string, steps: AppMissionStep[]): string | null {
  if (!title.trim()) return "Give the mission a name.";
  if (steps.length === 0) return "Add at least one step.";
  const missing = steps.findIndex((step) => !step.app_slug);
  if (missing >= 0) return `Choose an app for step ${missing + 1}.`;
  const unknown = steps.find((step) => !getAppMeta(step.app_slug));
  if (unknown) return `${unknown.app_slug} is not an app.`;
  if (!steps[0].request.trim()) return "Tell step 1 what to do.";
  return null;
}

export async function createAppMission(input: {
  title: string;
  goal?: string;
  steps: AppMissionStep[];
  workspace_id?: string | null;
}): Promise<AgentOSResult<Mission>> {
  const problem = validateAppMission(input.title, input.steps);
  if (problem) return err("validation", problem);

  const mission = await createMission({
    title: input.title,
    goal: input.goal ?? "",
    description: input.steps.map((step, index) => stepTitle(index, step.app_slug)).join(" → "),
    workspace_id: input.workspace_id ?? null,
  });
  if (mission.error || !mission.data) return mission;

  let previous: string | null = null;
  for (const [index, step] of input.steps.entries()) {
    const created = await createTask({
      title: stepTitle(index, step.app_slug),
      description: step.request.trim(),
      mission_id: mission.data.id,
      workspace_id: input.workspace_id ?? null,
      trigger: "mission",
      input: { app_step: { app_slug: step.app_slug, request: step.request.trim() } },
      depends_on: previous ? [previous] : [],
    });
    if (created.error || !created.data) {
      return err(
        created.error?.code ?? "unknown",
        `The mission was created, but step ${index + 1} could not be added: ${
          created.error?.message ?? "unknown error"
        }`,
      );
    }
    previous = created.data.id;
  }

  return ok(mission.data);
}
