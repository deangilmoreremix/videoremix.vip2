import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getAppMeta, type AppMeta } from "../../config/appRegistry";
import { dashboardAppTarget } from "../../config/appTargets";
import Reveal from "./Reveal";
import { groupInfo } from "./landingData";

const TEAM = [
  { slug: "ai-deep-research-agent", role: "Researcher", tag: "Research", glyph: "◎", color: "text-lp-amber" },
  { slug: "ai-vc-due-diligence-agent-team", role: "Analyst", tag: "Finance", glyph: "▦", color: "text-lp-red" },
  { slug: "ai-competitor-intelligence-agent-team", role: "Strategist", tag: "Marketing", glyph: "⌁", color: "text-lp-amber" },
  { slug: "ai-sales-intelligence-agent-team", role: "Closer", tag: "Sales", glyph: "⬡", color: "text-lp-gold" },
];

const Portrait: React.FC<{ app: AppMeta }> = ({ app }) => {
  const [failed, setFailed] = useState(false);
  if (!app.thumbnail || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-b from-lp-amber/20 to-black">
        <span className="font-mono text-4xl text-lp-gold/70">{groupInfo(app.group).glyph}</span>
      </div>
    );
  }
  return <img src={app.thumbnail} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />;
};

const TeamSection: React.FC = () => {
  const team = TEAM.map((t) => ({ ...t, app: getAppMeta(t.slug) })).filter((t): t is typeof t & { app: AppMeta } => Boolean(t.app));
  if (team.length === 0) return null;

  return (
    <section id="teams" className="scroll-mt-20 px-4 pb-10 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <p className="lp-eyebrow mb-10 text-center">Meet your new team</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {team.map(({ app, role, tag, glyph, color }, i) => (
            <Reveal key={app.slug} delay={i * 0.05}>
              <Link
                to={dashboardAppTarget(app).destination}
                className="lp-card group flex h-full overflow-hidden border-lp-amber/30 transition hover:border-lp-amber/70"
              >
                <div className="relative w-[42%] shrink-0 overflow-hidden" aria-hidden>
                  <Portrait app={app} />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0b0a09]" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="flex items-center gap-2 text-[20px] font-normal text-lp-fg">
                    <span className={color} aria-hidden>
                      {glyph}
                    </span>
                    {role}
                  </p>
                  <span className="mt-2 w-fit rounded-full border border-lp-amber/50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-lp-gold">
                    {tag}
                  </span>
                  <p className="mt-3 text-[12px] font-medium text-lp-fg/85">{app.name}</p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-lp-fg/55">{app.description}</p>
                  <span className="mt-auto ml-auto grid h-8 w-8 place-items-center rounded-full border border-lp-amber/60 text-lp-gold transition group-hover:bg-lp-amber/15">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
