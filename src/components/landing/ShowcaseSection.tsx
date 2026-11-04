import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import AppLibraryMock from "./AppLibraryMock";
import Reveal from "./Reveal";
import { ACTIVE_GROUPS } from "./landingData";
import { Eyebrow, Gold } from "./ui";

const SLIDES = [
  { title: "App Library", offset: 0 },
  { title: "Research Agents", offset: 20 },
  { title: "Agent Teams", offset: 40 },
  { title: "RAG Pipelines", offset: 70 },
  { title: "Voice & MCP", offset: 55 },
];

const ShowcaseSection: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (next: number) => setIndex((next + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <section className="px-4 py-10 sm:px-6">
      <Reveal className="lp-panel mx-auto grid max-w-[1180px] items-center gap-10 p-6 sm:p-10 lg:grid-cols-[0.6fr_1.4fr]">
        <div>
          <Eyebrow>See it in action</Eyebrow>
          <h2 className="lp-h2 text-lp-fg">
            One library.
            <br />
            Every agent.
            <br />
            <Gold>Total control.</Gold>
          </h2>
          <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-lp-fg/60">
            Find, run and manage {ACTIVE_GROUPS.length} categories of AI apps in one workspace.
          </p>
          <a href="#apps" className="lp-btn lp-btn-gold mt-7">
            <span className="grid h-5 w-5 place-items-center rounded-full border border-lp-amber/70 text-lp-gold">
              <Play size={8} fill="currentColor" />
            </span>
            Explore the Apps <span aria-hidden>→</span>
          </a>
        </div>

        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="relative">
            <AppLibraryMock key={slide.title} title={slide.title} offset={slide.offset} />
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous screen"
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur hover:border-lp-amber"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next screen"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur hover:border-lp-amber"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-lp-fg/70">{slide.title}</p>
            <div className="flex gap-1.5">
              {SLIDES.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  aria-label={`Show ${s.title}`}
                  aria-current={i === index}
                  onClick={() => go(i)}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-lp-amber" : "w-1.5 bg-white/30"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default ShowcaseSection;
