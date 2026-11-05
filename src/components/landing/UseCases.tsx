import React from "react";
import Reveal from "./Reveal";
import { Eyebrow, Gold } from "./ui";

const CASES = [
  { title: "Creators", body: "Turn blogs into podcasts, research topics and draft content faster." },
  { title: "Marketing agencies", body: "Run competitor research, sales intel and client reporting at scale." },
  { title: "Founders", body: "Due diligence, product launches and market research on demand." },
  { title: "Analysts & researchers", body: "Deep research, RAG over your documents and cited answers." },
];

const UseCases: React.FC = () => (
  <section className="px-4 py-20 sm:px-6">
    <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <Reveal>
        <Eyebrow>Real work, not demos</Eyebrow>
        <h2 className="lp-h2 text-lp-fg sm:text-[44px]">
          AI apps for the work
          <br />
          already on <Gold>your plate.</Gold>
        </h2>
        <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-lp-fg/60">
          VideoRemix VIP gives creators and teams one place to run the AI apps that keep their work moving.
        </p>
        <a href="#pricing" className="lp-btn lp-btn-gold mt-7">
          Explore plans <span aria-hidden>→</span>
        </a>
      </Reveal>
      <div className="grid gap-3 sm:grid-cols-2">
        {CASES.map((c, i) => (
          <Reveal key={c.title} delay={i * 0.05} className="lp-card relative min-h-[120px] overflow-hidden p-5">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-lp-amber">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-lp-fg/50" aria-hidden>
                ↗
              </span>
            </div>
            <h3 className="mt-5 text-[16px] font-normal text-lp-fg">{c.title}</h3>
            <p className="mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-lp-fg/55">{c.body}</p>
            <span aria-hidden className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full bg-lp-amber/25 blur-2xl" />
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default UseCases;
