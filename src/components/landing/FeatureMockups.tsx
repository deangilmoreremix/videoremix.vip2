import React from "react";
import Reveal from "./Reveal";

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div aria-hidden className="mt-4 h-[110px] overflow-hidden rounded-md border border-lp-amber/20 bg-black/50 p-3">
    {children}
  </div>
);

const ITEMS = [
  {
    title: "One-click launch",
    sub: "Open any app straight from the library.",
    mock: (
      <Frame>
        <div className="flex items-center justify-between rounded border border-white/10 px-2 py-1.5 text-[9px] text-white/60">
          <span>
            <span className="text-lp-amber">◆</span> AI Deep Research Agent
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
        <p className="mt-2 text-[8px] text-white/35">research / ready</p>
        <div className="mt-1.5 rounded border border-lp-amber/70 bg-lp-amber/10 px-2 py-1.5 text-[9px] font-semibold text-lp-gold">
          Run agent
        </div>
      </Frame>
    ),
  },
  {
    title: "Bring your own keys",
    sub: "Use the model providers you already trust.",
    mock: (
      <Frame>
        <div className="grid grid-cols-2 gap-1.5 text-[8px]">
          {["OpenAI", "Anthropic", "Gemini", "xAI"].map((p, i) => (
            <span
              key={p}
              className={`rounded border px-2 py-1 ${i === 1 ? "border-lp-amber/70 text-lp-gold" : "border-white/10 text-white/55"}`}
            >
              {p}
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-1.5">
          <span className="flex-1 rounded border border-white/10 px-2 py-1 font-mono text-[8px] text-white/40">sk-••••••••••</span>
          <span className="rounded bg-white/10 px-2 py-1 text-[8px] text-white/80">Save</span>
        </div>
      </Frame>
    ),
  },
  {
    title: "Private workspace",
    sub: "Your runs, outputs and history stay yours.",
    mock: (
      <Frame>
        <div className="rounded border border-white/15 px-2 py-1.5 text-[9px] text-white/70">Marketing Workspace ▾</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-[8px] text-white/50">
          {["Research", "Content", "Sales"].map((w) => (
            <span key={w} className="rounded border border-white/10 px-1.5 py-1">
              <span className="text-lp-amber">●</span> {w}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[8px] text-white/35">12 saved runs · 3 agents</p>
      </Frame>
    ),
  },
  {
    title: "Open foundation",
    sub: "Built on the open-source Awesome LLM Apps.",
    mock: (
      <Frame>
        <div className="relative h-full">
          <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-lp-amber/70 text-lp-gold shadow-[0_0_24px_rgba(240,173,67,0.4)]">
            ✦
          </span>
          {[
            "left-[8%] top-[6%]",
            "right-[10%] top-[10%]",
            "right-[18%] bottom-[2%]",
            "left-[16%] bottom-[4%]",
          ].map((pos) => (
            <span key={pos} className={`absolute h-5 w-5 rounded-full border border-lp-amber/40 bg-black ${pos}`} />
          ))}
        </div>
      </Frame>
    ),
  },
];

const FeatureMockups: React.FC = () => (
  <section className="px-4 sm:px-6">
    <Reveal className="lp-card mx-auto grid max-w-[1180px] divide-y divide-white/10 p-4 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
      {ITEMS.map((item) => (
        <div key={item.title} className="p-3 lg:px-4">
          <h3 className="text-[14px] font-medium text-lp-fg">{item.title}</h3>
          <p className="mt-1 text-[11px] text-lp-fg/50">{item.sub}</p>
          {item.mock}
        </div>
      ))}
    </Reveal>
  </section>
);

export default FeatureMockups;
