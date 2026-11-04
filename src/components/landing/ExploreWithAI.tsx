import React from "react";
import Reveal from "./Reveal";
import { EXPLORE_PROMPT } from "./landingData";
import { Eyebrow, Gold } from "./ui";

const q = encodeURIComponent(EXPLORE_PROMPT);

// Each tile opens the assistant with a question about VideoRemix pre-filled.
const ASSISTANTS = [
  { name: "ChatGPT", mark: "◍", href: `https://chatgpt.com/?q=${q}` },
  { name: "Claude", mark: "✳", href: `https://claude.ai/new?q=${q}` },
  { name: "Gemini", mark: "✦", href: `https://www.google.com/search?udm=50&q=${q}` },
  { name: "Perplexity", mark: "✲", href: `https://www.perplexity.ai/search?q=${q}` },
  { name: "Grok", mark: "⨯", href: `https://grok.com/?q=${q}` },
];

const ExploreWithAI: React.FC = () => (
  <section className="px-4 py-12 sm:px-6">
    <div className="mx-auto grid max-w-[1180px] items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <Reveal>
        <Eyebrow>Explore with AI</Eyebrow>
        <h2 className="lp-h2 text-lp-fg">
          Understand VideoRemix with <Gold>your favorite AI</Gold>
        </h2>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-lp-fg/60">
          Ask your preferred AI assistant what VideoRemix can do, which apps fit your work and how it compares.
        </p>
      </Reveal>
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {ASSISTANTS.map((a) => (
          <li key={a.name}>
            <a
              href={a.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-white/15 bg-white/[0.02] transition hover:border-lp-amber/60"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-lp-amber/40 bg-lp-amber/10 text-xl text-lp-gold" aria-hidden>
                {a.mark}
              </span>
              <span className="text-[11px] font-semibold text-lp-fg">{a.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default ExploreWithAI;
