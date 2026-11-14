// src/pages/SapienXLandingPage.tsx
//
// Route: / — the landing page for SapienX AgentOS on VideoRemix.vip.
//
// The product is two things in one dashboard: 117 open-source AI apps (the
// awesome-llm-apps collection, converted to run in the browser) that anyone
// can run with their own OpenAI key, and an AI workforce (SapienX AgentOS)
// that runs those apps for you — on request, on a schedule, or chained in a
// mission. The page uses the dashboard's own design tokens
// (src/styles/agentos.css), so the site and the product look like one thing.
//
// App counts and categories are read from the live catalog, so the page never
// claims a number the library does not have.

import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Gauge,
  KeyRound,
  LayoutGrid,
  Play,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import "../styles/agentos.css";
import { APP_REGISTRY } from "../config/appRegistry";
import SpecialFooter from "../components/SpecialFooter";

const CATEGORY_LABELS: Record<string, string> = {
  "starter-ai-agents": "Starter AI Agents",
  "advanced-ai-agents": "Advanced AI Agents",
  "multi-agent-teams": "Multi-agent Teams",
  "rag-tutorials": "RAG: chat with your data",
  "chat-with-x": "Chat with X",
  "llm-apps-memory": "Apps with Memory",
  "mcp-ai-agents": "MCP Agents",
  "voice-ai-agents": "Voice Agents",
  "agent-skills": "Agent Skills",
  "generative-ui-agents": "Generative UI",
  "autonomous-game-playing-agents": "Game-playing Agents",
  "always-on-agents": "Always-on Agents",
  "ai-browser-tools": "Browser Tools",
  "llm-optimization-tools": "LLM Optimization",
  "llm-finetuning": "Fine-tuning",
  "ai-agent-framework-crash-course": "Framework Crash Courses",
};

const STEPS = [
  {
    icon: KeyRound,
    title: "Add your OpenAI key once",
    body: "It is saved on your device and pays only for your own runs. No credits to buy, no markup.",
  },
  {
    icon: LayoutGrid,
    title: "Pick an app, or hire an agent",
    body: "Open any of the apps and use it yourself, or turn it into an AI worker that uses it for you.",
  },
  {
    icon: Play,
    title: "Run it now, on a schedule, or in a mission",
    body: "Results land in your dashboard: tasks, files and a full history of what each agent did.",
  },
];

const WORKFORCE = [
  {
    icon: Gauge,
    title: "Mission Control",
    body: "See every agent, mission and model on one live canvas, and inspect any of them.",
  },
  {
    icon: Bot,
    title: "AI agents that use the apps",
    body: "Give an agent the apps it may use. Tell it what you want; it picks the app and runs it.",
  },
  {
    icon: Waypoints,
    title: "Missions that chain apps",
    body: "Research a topic, write the article, turn it into a podcast: one mission, three apps, handed off automatically.",
  },
  {
    icon: CalendarClock,
    title: "Schedules",
    body: "A Hacker News briefing every morning, a competitor sweep every Monday. Agents run while you are away.",
  },
  {
    icon: ShieldCheck,
    title: "Human Control",
    body: "Anything sensitive, like sending an email, waits for your approval before it happens.",
  },
  {
    icon: Sparkles,
    title: "Open-source apps, converted",
    body: "The awesome-llm-apps collection, rebuilt as React apps that run in your browser. No Python, no servers.",
  },
];

const FAQ = [
  {
    q: "Do I have to pay for the apps?",
    a: "No. Every app in the library is free once you are signed in. You run them with your own OpenAI API key, so OpenAI bills you directly for what you use.",
  },
  {
    q: "Where is my API key kept?",
    a: "When you run an app, the key stays in your browser and is sent only with your run; it is never written into a prompt. If you let your AI agents use it while you are away, it is stored encrypted and used only for your agents. You can remove it any time in Settings.",
  },
  {
    q: "What is SapienX AgentOS?",
    a: "The dashboard you get when you sign in: an operating system for a team of AI workers. You create agents, give them apps and instructions, and watch their work in Mission Control.",
  },
  {
    q: "Where do the apps come from?",
    a: "From the open-source awesome-llm-apps collection: starter agents, multi-agent teams, RAG apps, chat-with-your-data apps, MCP and voice agents. We converted them from Python Streamlit apps into React apps that run in the dashboard.",
  },
];

function useCatalog() {
  return useMemo(() => {
    const apps = APP_REGISTRY.filter((app) => app.family === "awesome-llm");
    const counts = new Map<string, number>();
    for (const app of apps) counts.set(app.category, (counts.get(app.category) ?? 0) + 1);
    const categories = [...counts.entries()]
      .map(([id, count]) => ({ id, count, label: CATEGORY_LABELS[id] ?? id.replace(/-/g, " ") }))
      .sort((a, b) => b.count - a.count);
    return { total: apps.length, categories };
  }, []);
}

const Shot: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => (
  <figure
    className={`agentos-panel overflow-hidden rounded-2xl ${className ?? ""}`}
    style={{ boxShadow: "var(--shadow-glow)" }}
  >
    <img src={src} alt={alt} width={1440} height={900} loading="lazy" className="block h-auto w-full" />
  </figure>
);

const SapienXLandingPage: React.FC = () => {
  const { total, categories } = useCatalog();

  return (
    <div className="agentos-root relative overflow-hidden pt-16">
      <Helmet>
        <title>SapienX AgentOS: {String(total)} AI apps and the AI workforce that runs them | VideoRemix.vip</title>
        <meta
          name="description"
          content={`Run ${total} open-source AI apps with your own OpenAI key, or let SapienX AgentOS agents run them for you: on request, on a schedule, or chained in missions.`}
        />
      </Helmet>

      <div className="mission-canvas-backdrop" aria-hidden="true">
        <div className="mission-canvas-pattern opacity-60" />
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-agentos-brand" aria-hidden="true" />
          SapienX AgentOS on VideoRemix.vip
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
          {total} AI apps.
          <br />
          <span className="text-agentos-brand">An AI workforce</span> to run them.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
          Use the best open-source AI apps yourself, or hand them to AI agents that work while you
          don&apos;t. One dashboard, your own OpenAI key, nothing to buy per app.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="bg-agentos-brand inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-glow)] hover:brightness-110"
          >
            Start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/apps"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/85 hover:bg-white/[0.06]"
          >
            Browse the {total} apps
          </Link>
        </div>
        <p className="mt-4 text-xs text-white/45">Free to sign up · Runs on your own OpenAI key</p>

        <Shot
          src="/landing/mission-control.jpg"
          alt="SapienX AgentOS Mission Control: agents linked to the missions they work on"
          className="mx-auto mt-14 max-w-5xl"
        />
      </section>

      {/* How it works */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how-h">
        <h2 id="how-h" className="font-display text-3xl font-semibold text-white sm:text-4xl">
          How it works
        </h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="agentos-card rounded-2xl p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-agentos-brand/15 text-agentos-brand">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-white/40">Step {index + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* The apps */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="apps-h">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 id="apps-h" className="font-display text-3xl font-semibold text-white sm:text-4xl">
              The awesome-llm-apps collection, ready to run
            </h2>
            <p className="mt-4 text-white/60">
              {total} open-source AI apps, converted from Python into React apps that run right in
              your dashboard. Research agents, multi-agent teams, chat with your PDFs, YouTube or
              GitHub, voice agents and more.
            </p>
            <Link
              to="/apps"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-agentos-brand-soft hover:underline"
            >
              See every app <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <Shot src="/landing/app-youtube.jpg" alt="The Chat with YouTube Videos app running in the dashboard" />
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map(({ id, label, count }) => (
            <li key={id} className="agentos-card flex items-center justify-between gap-3 rounded-xl px-4 py-3">
              <span className="min-w-0 truncate text-sm text-white/80">{label}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-white/45">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* The workforce */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="workforce-h">
        <h2 id="workforce-h" className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Run it like a company
        </h2>
        <p className="mt-4 max-w-2xl text-white/60">
          SapienX AgentOS turns the apps into a team. Agents get the apps they need, take
          instructions, hand work to each other, and ask you before anything sensitive.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFORCE.map(({ icon: Icon, title, body }) => (
            <li key={title} className="agentos-card rounded-2xl p-6">
              <Icon className="h-5 w-5 text-agentos-brand" aria-hidden="true" />
              <h3 className="mt-4 font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
            </li>
          ))}
        </ul>
        <Shot
          src="/landing/dashboard-home.jpg"
          alt="The SapienX AgentOS home: agents, approvals waiting on you, task health and missions"
          className="mt-10"
        />
      </section>

      {/* Your key */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="key-h">
        <div className="agentos-panel grid gap-6 rounded-3xl p-8 sm:p-10 md:grid-cols-[auto,1fr] md:items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-agentos-brand/15 text-agentos-brand">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 id="key-h" className="font-display text-2xl font-semibold text-white sm:text-3xl">
              Your key, your runs, your bill
            </h2>
            <p className="mt-3 max-w-3xl text-white/60">
              Apps run on your own OpenAI API key, so you pay OpenAI&apos;s price and nothing more.
              The key is never written into a prompt, stays on your device when you run an app, and
              is stored encrypted only if you let your agents work while you are away.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6" aria-labelledby="faq-h">
        <h2 id="faq-h" className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Questions
        </h2>
        <div className="mt-8 space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="agentos-card group rounded-2xl p-5">
              <summary className="cursor-pointer list-none font-semibold text-white">
                <span className="flex items-center justify-between gap-4">
                  {q}
                  <span className="text-white/40 transition group-open:rotate-45" aria-hidden="true">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-white sm:text-5xl">
          Put your AI workforce to work
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Sign up, add your OpenAI key, and run your first app in under a minute.
        </p>
        <Link
          to="/signup"
          className="bg-agentos-brand mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)] hover:brightness-110"
        >
          Start free <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      <SpecialFooter />
    </div>
  );
};

export default SapienXLandingPage;
