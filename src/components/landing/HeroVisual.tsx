import React, { useState } from "react";
import type { AppMeta } from "../../config/appRegistry";
import { THUMBNAIL_APPS, groupInfo, resolveAppImage } from "./landingData";

// The hero artwork: a fan of real app cards in front of glowing amber rings,
// with floating role labels — our take on the reference's character lineup.

const PICKS = [
  "ai-fraud-investigation-agent",
  "project-graveyard",
  "insurance-claim-live-agent-team",
  "self-improving-agent-skills",
];
const LABELS = [
  { text: "Researcher", className: "left-[4%] top-[30%]" },
  { text: "Analyst", className: "left-[36%] top-[8%]" },
  { text: "Narrator", className: "right-[22%] top-[16%]" },
  { text: "Strategist", className: "right-[0%] top-[44%]" },
];

const Thumb: React.FC<{ app: AppMeta }> = ({ app }) => {
  const [failed, setFailed] = useState(false);
  const g = groupInfo(app.group);
  const image = resolveAppImage(app);
  return failed || !image ? (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-lp-amber/25 via-black to-lp-purple/30">
      <span className="font-mono text-5xl text-lp-gold/80" aria-hidden>
        {g.glyph}
      </span>
    </div>
  ) : (
    <img src={image} alt="" loading="eager" onError={() => setFailed(true)} className="h-full w-full object-cover" />
  );
};

const HeroVisual: React.FC = () => {
  const apps = PICKS.map((slug) => THUMBNAIL_APPS.find((a) => a.slug === slug)).filter(Boolean) as AppMeta[];
  const fan = apps.length === 4 ? apps : THUMBNAIL_APPS.slice(0, 4);

  return (
    <div className="relative mx-auto aspect-[5/4] w-full max-w-[720px]" aria-hidden>
      <div className="lp-rings lp-spin absolute inset-[-12%] rounded-full" />
      <div className="absolute inset-x-[10%] bottom-[6%] h-24 rounded-full bg-lp-amber/25 blur-[60px]" />

      <div className="absolute inset-0 flex items-end justify-center pb-[8%]">
        {fan.map((app, i) => {
          const rotate = [-12, -4, 4, 12][i];
          const lift = [6, 0, 0, 6][i];
          return (
            <div
              key={app.slug}
              className="lp-float relative -mx-[5%] w-[36%] overflow-hidden rounded-xl border border-lp-amber/40 bg-black shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
              style={{ transform: `rotate(${rotate}deg) translateY(${lift}%)`, animationDelay: `${i * 0.6}s`, zIndex: i === 1 || i === 2 ? 2 : 1 }}
            >
              <div className="aspect-[4/3]">
                <Thumb app={app} />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-10">
                <p className="text-[11px] font-semibold leading-tight text-white">{app.name}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-lp-amber">{groupInfo(app.group).label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {LABELS.map((label, i) => (
        <span
          key={label.text}
          className={`lp-float absolute hidden rounded-md border border-lp-amber/60 bg-black/60 px-3 py-1.5 text-sm font-semibold text-lp-gold shadow-[0_0_24px_rgba(240,173,67,0.25)] backdrop-blur sm:block ${label.className}`}
          style={{ animationDelay: `${i * 0.9}s` }}
        >
          {label.text}
        </span>
      ))}
    </div>
  );
};

export default HeroVisual;
