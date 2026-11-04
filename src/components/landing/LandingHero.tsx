import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import HeroVisual from "./HeroVisual";
import { LANDING_APP_COUNT } from "./landingData";

const BADGES = ["Awesome LLM Apps", "Runs in browser", "BYOK", "No setup", "Multi-agent teams", "RAG", "Voice", "MCP"];

const TRIO = [
  { glyph: "◆", color: "text-lp-purple", title: "Instant apps", sub: "Nothing to install" },
  { glyph: "◎", color: "text-lp-red", title: "Saved workspaces", sub: "Your runs and results" },
  { glyph: "⬡", color: "text-lp-amber", title: "Your own keys", sub: "Any model provider" },
];

const LandingHero: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const reduce = useReducedMotion();
  const fade = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay } };

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1180px] items-center gap-6 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[1.05fr_1.15fr] lg:pb-14 lg:pt-10">
        <div className="relative z-10">
          <motion.p
            {...fade(0)}
            className="lp-eyebrow mb-4 inline-block rounded-full border border-lp-amber/50 px-3 py-1.5 text-[10px]"
          >
            AI App Platform
          </motion.p>

          <motion.h1 {...fade(0.08)} className="lp-display text-[46px] text-lp-fg min-[400px]:text-[52px] sm:text-[72px] lg:whitespace-nowrap lg:text-[78px]">
            {LANDING_APP_COUNT} AI apps.
            <br />
            <span className="text-lp-gold">One workspace.</span>
          </motion.h1>

          <motion.p {...fade(0.16)} className="mt-5 max-w-[340px] text-[15px] leading-relaxed text-lp-fg/75">
            Research, build, analyze and create with ready-to-run AI agents and teams.
          </motion.p>

          <motion.div {...fade(0.22)} className="lp-marquee lp-marquee-fast mt-5 max-w-[380px]">
            <div className="lp-marquee-track gap-2">
              {[...BADGES, ...BADGES].map((b, i) => (
                <span key={i} className="lp-pill">
                  {b}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div {...fade(0.28)} className="mt-6 flex flex-wrap gap-3">
            <Link to={isAuthenticated ? "/dashboard/apps" : "/signup"} className="lp-btn lp-btn-lg lp-btn-primary min-w-[200px]">
              Launch App Library <span aria-hidden>→</span>
            </Link>
            <a href="#apps" className="lp-btn lp-btn-lg lp-btn-ghost min-w-[150px]">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-white/40">
                <Play size={10} fill="currentColor" />
              </span>
              Browse Apps
            </a>
          </motion.div>

          <motion.ul {...fade(0.36)} className="mt-10 grid max-w-[460px] grid-cols-3 gap-4">
            {TRIO.map((t) => (
              <li key={t.title} className="flex gap-2.5">
                <span className={`mt-0.5 text-lg ${t.color}`} aria-hidden>
                  {t.glyph}
                </span>
                <div>
                  <p className="text-[13px] font-semibold leading-tight text-lp-fg">{t.title}</p>
                  <p className="mt-1 text-[10px] text-lp-fg/50">{t.sub}</p>
                </div>
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div {...(reduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1, delay: 0.2 } })}>
          <HeroVisual />
        </motion.div>
      </div>

      <a href="#workspace" aria-label="Scroll down" className="mx-auto mb-4 hidden h-8 w-5 justify-center rounded-full border border-white/40 pt-1.5 lg:flex">
        <span className="lp-scroll-dot h-1.5 w-0.5 rounded-full bg-white/80" />
      </a>
    </section>
  );
};

export default LandingHero;
