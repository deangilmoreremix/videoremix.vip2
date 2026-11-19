// src/config/upstreamAppSpecs.manual.ts
//
// The screens of the upstream apps that are not Streamlit apps, written by
// hand from their README, UI and skill files in
// github.com/Shubhamsaboo/awesome-llm-apps (the Streamlit apps are extracted
// from their code: scripts/conversion/extract-upstream-ui.py).
//
// Upstream, these run as:
//   * a chat in Google ADK web, the Agno playground or a CopilotKit sidebar
//     (layout "chat"; a CopilotKit app's canvas or report becomes the result
//     panel), or
//   * an agent skill or command-line tool that takes specific inputs
//     (layout "tool").
// Here every one runs on the user's OpenAI key through run-ai-app; `note`
// says so where upstream needs something else (a local model, a wallet, a
// browser extension, a GPU).

import type { ManualSpec } from "./upstreamAppSpecTypes";

const chat = (spec: Omit<ManualSpec, "layout">): ManualSpec => ({ layout: "chat", ...spec });
const tool = (spec: Omit<ManualSpec, "layout">): ManualSpec => ({ layout: "tool", ...spec });

export const MANUAL_SPECS: Record<string, ManualSpec> = {
  // Agent skills (Claude Code / coding-agent skills): a form with the inputs
  // the skill asks for, and the report it writes.
  "advisor-orchestrator-worker": tool({
    title: "Advisor Orchestrator Worker",
    intro:
      "One model is a bottleneck. Big tasks are split into self-contained briefs, run by parallel workers, verified one by one, and judged by a stronger advisor before work starts and before it ships.",
    framework: "Agent skill",
    fields: [
      { name: "task", kind: "textarea", label: "The big task", placeholder: "Research all 12 competitors in parallel and synthesize a positioning brief." },
      { name: "budget", kind: "text", label: "Budget (optional)", placeholder: "e.g. 20 worker calls" },
    ],
    runLabel: "Orchestrate",
    examples: [
      "This is too big for one pass. Orchestrate it across a model team.",
      "Fan this out: research all 12 competitors in parallel and synthesize.",
    ],
    note: "Upstream runs a three-model team inside your coding agent. Here the plan, briefs, verification and advisor review are produced by one run on your OpenAI key.",
  }),
  "project-graveyard": tool({
    title: "Project Graveyard",
    intro:
      "Autopsies your abandoned side projects from their git history: why each one died, your personal death patterns, and the one most worth finishing.",
    framework: "Agent skill",
    fields: [
      {
        name: "projects",
        kind: "textarea",
        label: "Your abandoned projects",
        placeholder: "Paste `git log --oneline -20` (and the README) of each project, or describe each: name, what it was, when you stopped and why.",
      },
    ],
    runLabel: "Run the graveyard",
    examples: ["What should I finish?", "Why do I never finish anything?"],
    note: "Upstream scans the git repos on your machine. Here you paste the history or describe the projects.",
  }),
  "first-reader": tool({
    title: "First Reader",
    intro:
      "Readers before you publish. Simulated readers go through your draft moment by moment and report where they lose interest, where they would stop, and what they remember. Your words are never rewritten.",
    framework: "Agent skill",
    fields: [
      { name: "draft", kind: "textarea", label: "Your draft", placeholder: "Paste the post, essay, email or doc." },
      { name: "audience", kind: "text", label: "Who is it for? (optional)", placeholder: "e.g. engineering managers skimming LinkedIn" },
    ],
    runLabel: "Read it",
  }),
  "scope-creep-detector": tool({
    title: "Scope Creep Detector",
    intro:
      "Checks a diff against a one-line intent. Flags unrelated paths, new dependencies, public API renames, config or CI edits, oversized hunks and formatting-only files, and says what to keep, split or justify.",
    framework: "Agent skill",
    fields: [
      { name: "intent", kind: "text", label: "What this change is meant to do", placeholder: "Fix the null check in the login form" },
      { name: "diff", kind: "textarea", label: "The diff", placeholder: "Paste the output of `git diff` or `git diff --staged`." },
    ],
    runLabel: "Check scope",
  }),
  "commit-archaeologist": tool({
    title: "Commit Archaeologist",
    intro:
      "git blame tells you who last changed a line. Commit Archaeologist reconstructs why the line exists: the introducing commit, later changes, companion files and likely intent.",
    framework: "Agent skill",
    fields: [
      { name: "code", kind: "textarea", label: "The code you are asking about", placeholder: "Paste the function or block." },
      {
        name: "history",
        kind: "textarea",
        label: "Its history",
        placeholder: "Paste `git log -L <start>,<end>:<file>` or `git log -p --follow <file>`.",
      },
    ],
    runLabel: "Dig",
    note: "Upstream reads your local git history. Here you paste it.",
  }),
  "dependency-doctor": tool({
    title: "Dependency Doctor",
    intro:
      "Inspects one dependency manifest for direct-dependency footguns: unpinned versions, standard-library shadowing, obsolete backports, duplicate constraints and obvious conflicts.",
    framework: "Agent skill",
    fields: [
      {
        name: "manifest",
        kind: "textarea",
        label: "Your manifest",
        placeholder: "Paste requirements.txt, pyproject.toml or package.json.",
      },
    ],
    runLabel: "Diagnose",
  }),
  "thinking-out-loud": tool({
    title: "Thinking Out Loud",
    intro:
      "Ramble at your agent by voice. Before it acts, it echoes back a brief: your mission, locked decisions, open questions and flips, with its own guesses kept apart from your words.",
    framework: "Agent skill",
    fields: [
      {
        name: "ramble",
        kind: "textarea",
        label: "Your ramble",
        placeholder: "Paste the dictated, stream-of-consciousness version. Typos are fine.",
      },
    ],
    runLabel: "Echo it back",
  }),
  "self-improving-agent-skills": tool({
    title: "Self-Improving Agent Skills",
    intro:
      "Upload a skill, and agents generate test scenarios, evaluate the skill against them, and rewrite it until it scores better.",
    framework: "Google ADK",
    fields: [
      { name: "skill", kind: "textarea", label: "Your SKILL.md", placeholder: "Paste the skill file." },
      { name: "goal", kind: "text", label: "What should it get better at? (optional)" },
    ],
    runLabel: "Improve skill",
  }),

  // Google ADK web and Agno playground agents: a chat.
  "ai-consultant-agent": chat({
    title: "AI Consultant Agent",
    intro: "A business consultant that gives market analysis, strategy and actionable recommendations, with research on current market data.",
    framework: "Google ADK",
    examples: [
      "I want to launch a SaaS startup for small businesses",
      "Should I expand my retail business to e-commerce?",
      "What are the market opportunities in healthcare technology?",
    ],
  }),
  "ai-finance-agent-team": chat({
    title: "AI Finance Agent Team",
    intro: "A web agent and a finance agent work as a team to answer financial questions with current market data.",
    framework: "Agno playground",
    examples: ["Summarize analyst recommendations and share the latest news for NVDA", "Compare AAPL and MSFT on valuation"],
  }),
  "ai-investment-agent": chat({
    title: "AI Investment Agent",
    intro: "Compare two stocks and get company information, the latest news and analyst recommendations in an investment report.",
    framework: "Agno AgentOS",
    examples: ["Compare NVDA and AMD for a 3-year hold", "What are analysts saying about TSLA?"],
  }),
  "xai-finance-agent": chat({
    title: "AI Finance Agent with xAI Grok",
    intro: "Financial analysis that combines stock data with web search, with structured insights.",
    framework: "Agno playground",
    examples: ["Give me a quick analysis of META", "How did the S&P 500 do this week?"],
    note: "Upstream runs on xAI Grok. Here it runs on your OpenAI key, or your xAI key if you saved one.",
  }),
  "ai-home-renovation-agent": chat({
    title: "AI Home Renovation Planner",
    intro: "Upload photos of your space and inspiration, and get a renovation plan with a budget breakdown, timeline and contractor checklist.",
    framework: "Google ADK",
    attachments: { label: "Room photos and inspiration images", accept: ["image/*"], multiple: true },
    examples: [
      "I want to renovate my small galley kitchen. It's 8x12 feet, has oak cabinets from the 90s. I love modern farmhouse style. Budget: $25k",
      "My master bathroom is tiny (5x8) with a cramped tub. I want a spa-like retreat with walk-in shower. Budget: $15k",
    ],
    note: "Upstream also generates photorealistic renderings with Gemini image models. Here you get the written plan.",
  }),
  "ai-sales-intelligence-agent-team": chat({
    title: "AI Sales Intelligence Agent Team",
    intro: "A multi-agent pipeline that researches a competitor and builds a competitive sales battle card.",
    framework: "Google ADK",
    examples: ["Build a battle card for us (Linear) against Jira", "We sell Notion. Battle card vs Confluence."],
  }),
  "ai-vc-due-diligence-agent-team": chat({
    title: "AI VC Due Diligence Agent Team",
    intro: "A multi-agent pipeline for startup investment analysis: company, market, financials and risks, ending in an investment memo.",
    framework: "Google ADK",
    examples: ["Run due diligence on Perplexity AI", "Analyze Ramp as a Series D investment"],
  }),
  "ai-self-evolving-agent": chat({
    title: "Self-Evolving AI Agent",
    intro: "Turns one natural-language goal into a working program by generating and refining a multi-agent workflow.",
    framework: "EvoAgentX",
    examples: ["Build a CLI that summarizes my unread GitHub notifications"],
  }),
  "ai-social-media-news-and-podcast-agent": chat({
    title: "AI News and Podcast Agents",
    intro: "Curates your trusted sources into a news brief, and turns it into a podcast script.",
    framework: "Beifong",
    examples: ["Brief me on this week's AI agent news", "Make a 5-minute podcast script from today's top tech stories"],
    note: "Upstream also generates the podcast audio. Here you get the brief and the script.",
  }),
  "ai-travel-planner-agent-team": chat({
    title: "TripCraft AI",
    intro: "A multi-agent team that turns a simple trip request into a full itinerary: flights, stays, days and budget.",
    framework: "Agno",
    examples: ["5 days in Lisbon in May for two, mid-range budget, we love food and walking"],
  }),
  "always-on-hacker-news-briefing-agent": tool({
    title: "Always-on Hacker News Briefing Agent",
    intro: "Scans Hacker News for high-signal stories on the topics you follow and ships a ranked daily brief.",
    framework: "Google ADK",
    fields: [
      { name: "topics", kind: "text", label: "Topics to watch", value: "AI agents, MCP, coding agents, workflow automation, LLM apps" },
      { name: "stories", kind: "number", label: "Stories in the brief", value: 5, min: 1, max: 20 },
    ],
    runLabel: "Brief me",
    note: "Upstream runs on a schedule and posts to Slack or email. Use Schedules here to run it every morning.",
  }),
  "release-radar-agent": tool({
    title: "Release Radar Agent",
    intro: "Reads your dependency file, checks the dependencies against their GitHub releases, and reports only the changes that matter to you.",
    framework: "Google ADK",
    fields: [
      { name: "manifest", kind: "textarea", label: "requirements.txt or package.json", placeholder: "Paste the file." },
    ],
    runLabel: "Check releases",
    note: "Upstream runs always-on. Use Schedules here to run it every week.",
  }),
  "earnings-call-analyst-agent": tool({
    title: "Earnings Call Analyst Agent",
    intro: "Paste an earnings call and get the numbers, guidance, tone shifts and the questions analysts pushed on.",
    framework: "Google ADK",
    fields: [
      { name: "call_url", kind: "text", label: "Earnings call YouTube URL", placeholder: "https://www.youtube.com/watch?v=…" },
      { name: "transcript", kind: "textarea", label: "Transcript (optional, gives better results)", placeholder: "Paste the transcript if you have it." },
    ],
    runLabel: "Analyze call",
    note: "Upstream syncs the analysis to the video's playback. Here you get the written analysis.",
  }),
  "ai-x402-paying-agent": chat({
    title: "AI x402 Paying Agent",
    intro: "An agent with its own crypto wallet that pays for the data it needs per request, with no API keys or subscriptions.",
    framework: "x402",
    examples: ["What's the current weather in Tokyo?", "Get me the latest price of ETH"],
    note: "Upstream pays for data with a crypto wallet. Here the agent answers on your OpenAI key and does not make payments.",
  }),
  "insurance-claim-live-agent-team": tool({
    title: "Insurance Claim Live Agent Team",
    intro: "An insurance claim agent that listens to what happened, looks at the damage, and drafts the claim and an incident sketch description.",
    framework: "Gemini Live",
    fields: [
      { name: "what_happened", kind: "textarea", label: "What happened?", placeholder: "Describe the incident: when, where, who was involved." },
      { name: "photos", kind: "file", label: "Photos of the damage", accept: ["image/*"], multiple: true },
    ],
    runLabel: "Start claim",
    note: "Upstream is a live voice and camera conversation. Here you describe it in writing.",
  }),
  "llm-panel-agent-team": tool({
    title: "LLM Panel Agent Team",
    intro: "Several models review the same thing independently, then argue about it anonymously, so you see where they agree and where they don't.",
    framework: "Python",
    fields: [
      { name: "subject", kind: "textarea", label: "What should the panel review?", placeholder: "Paste a diff, a design doc or a decision." },
      { name: "question", kind: "text", label: "The question", value: "What is wrong with this, and what would you change?" },
    ],
    runLabel: "Convene the panel",
    note: "Upstream asks three vendors' models. Here the panel runs on your OpenAI key.",
  }),
  "headroom-context-optimization": tool({
    title: "Headroom: Context Optimization",
    intro: "Compresses tool outputs and long context, removing the redundant boilerplate while keeping what the model needs.",
    framework: "Python",
    fields: [
      { name: "context", kind: "textarea", label: "Context to compress", placeholder: "Paste a tool output, log or document." },
      { name: "task", kind: "text", label: "What will the model use it for?", placeholder: "Answer questions about failing tests" },
    ],
    runLabel: "Compress",
  }),
  "rag-failure-diagnostics-clinic": tool({
    title: "RAG Failure Diagnostics Clinic",
    intro: "Give it a question, what your retriever returned and the answer you got, and it diagnoses where the RAG pipeline failed.",
    framework: "Python",
    fields: [
      { name: "question", kind: "text", label: "Question" },
      { name: "retrieved", kind: "textarea", label: "Retrieved chunks", placeholder: "Paste what the retriever returned." },
      { name: "answer", kind: "textarea", label: "Answer you got" },
    ],
    runLabel: "Diagnose",
  }),
  "local-rag-agent": tool({
    title: "Local RAG Agent with Llama 3.2",
    intro: "Ask questions about your documents with retrieval-augmented generation.",
    framework: "Agno",
    fields: [
      { name: "documents", kind: "file", label: "Your documents", accept: [".pdf", ".txt", ".md"], multiple: true },
      { name: "content", kind: "textarea", label: "Or paste text", placeholder: "Paste the content to search." },
      { name: "question", kind: "text", label: "Question" },
    ],
    runLabel: "Ask",
    note: "Upstream runs Llama 3.2 locally with Ollama and Qdrant. Here it runs on your OpenAI key.",
  }),
  "gemma-3-fine-tuning": tool({
    title: "Finetune Gemma 3 with Unsloth",
    intro: "Plan a 4-bit LoRA fine-tune of a Gemma 3 Instruct model with Unsloth, and get the training script for your dataset.",
    framework: "Python (GPU)",
    fields: [
      { name: "model", kind: "select", label: "Model", options: ["gemma-3-1b-it", "gemma-3-4b-it", "gemma-3-12b-it", "gemma-3-27b-it"], value: "gemma-3-4b-it" },
      { name: "dataset", kind: "text", label: "Dataset (Hugging Face name or description)" },
      { name: "goal", kind: "textarea", label: "What should the fine-tuned model do?" },
    ],
    runLabel: "Get the script",
    note: "Training needs a CUDA GPU and does not run here. You get a ready-to-run script and settings.",
  }),
  "llama-3-2-fine-tuning": tool({
    title: "Finetune Llama 3.2",
    intro: "Plan a fine-tune of Llama 3.2 with Unsloth, and get the training script for your dataset.",
    framework: "Python (GPU)",
    fields: [
      { name: "model", kind: "select", label: "Model", options: ["Llama-3.2-1B-Instruct", "Llama-3.2-3B-Instruct"], value: "Llama-3.2-3B-Instruct" },
      { name: "dataset", kind: "text", label: "Dataset (Hugging Face name or description)", value: "mlabonne/FineTome-100k" },
      { name: "goal", kind: "textarea", label: "What should the fine-tuned model do?" },
    ],
    runLabel: "Get the script",
    note: "Training needs a GPU and does not run here. You get a ready-to-run script and settings.",
  }),
  "notion-mcp-agent": chat({
    title: "Notion MCP Agent",
    intro: "Work with your Notion pages in plain language.",
    framework: "MCP",
    examples: ["What's on my Notion page?", "Add a new paragraph saying 'Meeting notes for today'", "Create a bullet list with three items: Apple, Banana, Orange"],
    note: "Upstream connects to your Notion workspace through the Notion MCP server. Here it drafts the content and the changes for you.",
  }),
  "openai-remote-mcp-tool-bridge": chat({
    title: "OpenAI Remote MCP Tool Bridge",
    intro: "Connects a plain OpenAI function-calling loop to a hosted Streamable HTTP MCP server, without an agent framework.",
    framework: "MCP",
    examples: ["List the tools this MCP server exposes and call the search tool for 'agents'"],
    note: "Upstream calls a remote MCP server. Here the model explains and plans the tool calls.",
  }),
  "multimodal-ui-ux-feedback-agent-team": chat({
    title: "Multimodal UI/UX Feedback Agent Team",
    intro: "Upload a landing page screenshot to get expert UI/UX feedback and a description of the improved version.",
    framework: "Google ADK",
    attachments: { label: "Landing page screenshot", accept: ["image/*"], multiple: false },
    examples: ["Review this landing page and list the top 5 fixes", "Make the CTA button 20% larger with vibrant orange color"],
    note: "Upstream also generates the improved design as an image. Here you get the written feedback and changes.",
  }),

  // A course of lessons: upstream is a folder of tutorials, each its own
  // small app. The page lets you pick a lesson and try it.
  "openai-agents-sdk-crash-course": tool({
    title: "OpenAI Agents SDK Crash Course",
    intro:
      "Learn the OpenAI Agents SDK lesson by lesson: a starter agent, structured outputs, tools, running agents, context, guardrails, memory, handoffs, multi-agent orchestration, tracing and voice.",
    framework: "OpenAI Agents SDK",
    fields: [
      {
        name: "lesson",
        kind: "select",
        label: "Lesson",
        options: [
          "1. Starter agent",
          "2. Structured output agent",
          "3. Tool-using agent",
          "4. Running agents",
          "5. Context management",
          "6. Guardrails and validation",
          "7. Sessions and memory",
          "8. Handoffs and delegation",
          "9. Multi-agent orchestration",
          "10. Tracing and observability",
          "11. Voice agents",
        ],
        value: "1. Starter agent",
      },
      { name: "message", kind: "textarea", label: "Your message", placeholder: "Explain synchronous execution in simple terms" },
    ],
    runLabel: "Run lesson",
  }),

  // CopilotKit / Next.js generative-UI apps: a chat beside a canvas, a
  // workspace or a report, which becomes the result panel.
  "ai-dashboard-canvas-agent": chat({
    title: "AI Dashboard Canvas Agent",
    intro: "Ask for metrics and charts, and the agent fills a dashboard canvas instead of just streaming text.",
    framework: "CopilotKit + Google ADK",
    panel: "Canvas",
    examples: ["Show monthly revenue for 2025 as a line chart with a KPI for growth", "Add a pie chart of traffic sources"],
  }),
  "ai-deep-research-agent": chat({
    title: "AI Deep Research Agent",
    intro: "A deep research assistant that plans, searches the web, writes notes and files, and shows each step in a workspace.",
    framework: "CopilotKit + LangGraph",
    panel: "Workspace",
    examples: ["Research the state of solid-state EV batteries in 2026", "Compare the top 5 vector databases for a startup"],
  }),
  "ai-financial-coach-agent": chat({
    title: "AI Financial Coach Agent",
    intro: "Tell it about your money, and it analyzes your budget, plans your savings and builds a debt-payoff strategy as report cards.",
    framework: "CopilotKit + Google ADK",
    panel: "Report",
    examples: ["My income is $8k a month, rent is $2.5k, I have $12k of credit card debt at 22%", "Run the full budget, savings and debt plan"],
  }),
  "ai-mcp-app-builder": chat({
    title: "AI MCP App Builder",
    intro: "Describe an MCP app in chat and get the app back.",
    framework: "CopilotKit + Mastra",
    panel: "App",
    examples: ["Build an MCP app that shows a weather card for any city", "A todo list MCP app with add and complete actions"],
    note: "Upstream returns a live, sandboxed instance. Here you get the app's code and setup.",
  }),
  "ai-shadcn-component-generator": chat({
    title: "AI Shadcn Component Generator",
    intro: "Describe a UI and get it built from shadcn/ui components.",
    framework: "CopilotKit",
    panel: "Component",
    examples: ["A pricing page with three tiers and a monthly/yearly toggle", "A settings form with profile, notifications and danger zone"],
  }),
  "generative-ui-starter-project": chat({
    title: "Generative UI Starter",
    intro: "A chat-driven kanban board where you and the agent work the same task list.",
    framework: "CopilotKit + LangGraph",
    panel: "Board",
    examples: ["Plan a product launch as a kanban board", "Move the design tasks to In progress and add a QA column"],
  }),
  "mcp-apps-generative-ui-showcase": chat({
    title: "MCP Apps Generative UI Showcase",
    intro: "Ask for something and the agent answers with an interactive app card instead of plain text.",
    framework: "CopilotKit + MCP Apps",
    panel: "App",
    examples: ["Show me a flight search card for SFO to JFK next Friday", "Make a color palette picker for a coffee brand"],
  }),
  "multimodal-agentic-rag": tool({
    title: "Multimodal Agentic RAG",
    intro: "Add text, URLs, PDFs, images, audio or video, ask a question, and get a grounded answer with citations.",
    framework: "Google ADK",
    fields: [
      { name: "sources", kind: "file", label: "Sources", accept: [".pdf", "image/*", "audio/*", "video/*", ".txt", ".md"], multiple: true },
      { name: "urls", kind: "textarea", label: "URLs or text", placeholder: "One URL per line, or paste text." },
      { name: "question", kind: "text", label: "Question" },
    ],
    runLabel: "Ask",
  }),
  "needle-a-new-way-to-find": tool({
    title: "Needle",
    intro: "A new way to find: ask in plain words and get the exact passages in a document that answer it.",
    framework: "Browser extension",
    fields: [
      { name: "query", kind: "text", label: "What are you looking for?" },
      { name: "document", kind: "textarea", label: "Document", placeholder: "Paste the page or document text." },
    ],
    runLabel: "Find",
    note: "Upstream is a browser extension that reads the current page. Here you paste the text.",
  }),
  "ripple-change-one-thing-find-what-else-needs-to-change": tool({
    title: "Ripple",
    intro: "Change one fact, and Ripple finds everything else in the document that needs to change with it.",
    framework: "Browser extension",
    fields: [
      { name: "before", kind: "text", label: "Before", placeholder: "The launch is on March 3" },
      { name: "after", kind: "text", label: "After", placeholder: "The launch is on March 17" },
      { name: "document", kind: "textarea", label: "Document", placeholder: "Paste the document." },
    ],
    runLabel: "Find ripples",
    note: "Upstream is a Google Docs extension. Here you paste the document.",
  }),
};
