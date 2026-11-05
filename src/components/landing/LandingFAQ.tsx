import React, { useState } from "react";
import { Plus } from "lucide-react";
import Reveal from "./Reveal";
import { LANDING_APP_COUNT } from "./landingData";
import { Eyebrow, Gold } from "./ui";

const FAQS = [
  {
    q: "What is VideoRemix VIP?",
    a: `An app library of ${LANDING_APP_COUNT} ready-to-run AI apps: agents, multi-agent teams, RAG pipelines, voice agents, MCP agents and more. Each one runs in your browser.`,
  },
  { q: "Do I need to know how to code?", a: "No. Each app opens as a simple form or chat. Fill in what it asks for and run it." },
  {
    q: "Are AI model costs included?",
    a: "No. Apps run on your own provider API keys, such as OpenAI, Anthropic or Google Gemini, so model usage is billed by your provider. Your plan covers the apps and workspace.",
  },
  { q: "Do I need to install anything?", a: "No. There's nothing to install and no Python or servers to manage. Sign in and open an app." },
  { q: "Is my data private?", a: "Your keys and workspace data are tied to your account. Prompts go only to the model provider you pick for a run." },
  { q: "What does the Free plan include?", a: "Free lets you sign up and try the platform. Pro and Business unlock more of the library, storage and team seats." },
  { q: "Can I buy a single app?", a: "Yes. Individual apps are available as a one-time lifetime purchase." },
  { q: "Is there a lifetime option for plans?", a: "Yes. Pro and Business are available as one-time lifetime purchases as well as monthly or annual plans." },
];

const INITIAL = 4;

const LandingFAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const items = all ? FAQS : FAQS.slice(0, INITIAL);

  return (
    <section id="faq" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.6fr_1fr]">
        <Reveal>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="lp-h2 text-lp-fg sm:text-[44px]">
            The details that matter <Gold>before you start.</Gold>
          </h2>
        </Reveal>

        <div>
          <ul className="space-y-2.5">
            {items.map((item, i) => {
              const isOpen = open === i;
              const panelId = `landing-faq-${i}`;
              return (
                <li key={item.q} className="rounded-lg border border-white/15 bg-white/[0.02]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 px-4 py-3.5 text-left"
                  >
                    <span className="text-[13px] font-semibold text-lp-fg">{item.q}</span>
                    <Plus size={16} className={`shrink-0 text-lp-amber transition-transform ${isOpen ? "rotate-45" : ""}`} />
                  </button>
                  <div id={panelId} hidden={!isOpen} className="px-4 pb-4 text-[13px] leading-relaxed text-lp-fg/60">
                    {item.a}
                  </div>
                </li>
              );
            })}
          </ul>
          {!all && (
            <div className="mt-5 text-center">
              <button type="button" onClick={() => setAll(true)} className="lp-btn lp-btn-gold rounded-full">
                Show all {FAQS.length} questions <span aria-hidden>→</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;
