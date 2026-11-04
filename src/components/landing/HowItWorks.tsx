import React from "react";
import Reveal from "./Reveal";
import { Eyebrow, Gold } from "./ui";

const STEPS = [
  { title: "Create your account", body: "Sign up free in under a minute. No credit card required." },
  { title: "Connect your keys", body: "Add the model providers you use once, and every app can use them." },
  { title: "Pick an app", body: "Choose from research agents, RAG pipelines, voice agents and full agent teams." },
  { title: "Run and review", body: "Run it, review the output and keep every result in your workspace." },
];

const HowItWorks: React.FC = () => (
  <section id="how-it-works" className="scroll-mt-20 px-4 py-20 sm:px-6 lg:py-24">
    <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
      <Reveal>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="lp-h2 text-lp-fg sm:text-[44px]">
          From first sign-up
          <br />
          to <Gold>real results.</Gold>
        </h2>
        <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-lp-fg/60">Your keys. Your workspace. Your AI apps.</p>
      </Reveal>
      <ol className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.05} className="lp-card flex min-h-[124px] gap-4 p-5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[11px] font-semibold text-lp-gold">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-[15px] font-medium text-lp-fg">{step.title}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-lp-fg/55">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);

export default HowItWorks;
