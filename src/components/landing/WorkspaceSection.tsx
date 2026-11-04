import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppLibraryMock from "./AppLibraryMock";
import Reveal from "./Reveal";
import { Eyebrow, Gold } from "./ui";

const PLATFORMS = ["⌘ Browser", "▭ Desktop", "▯ Mobile"];
const VALUES = [
  { glyph: "◎", text: "Bring your own models" },
  { glyph: "●", text: "Private workspaces" },
  { glyph: "◆", text: "Regular app updates" },
  { glyph: "◇", text: "Open-source foundation" },
  { glyph: "⌁", text: "One-click launch" },
  { glyph: "▦", text: "16 app categories" },
];

const WorkspaceSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <section id="workspace" className="scroll-mt-20 px-4 sm:px-6">
        <Reveal className="lp-panel mx-auto grid max-w-[1180px] items-center gap-10 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:p-12">
          <div>
            <Eyebrow>VideoRemix Workspace</Eyebrow>
            <h2 className="lp-h2 text-lp-fg">
              Your AI app library,
              <br />
              <Gold>in one dashboard.</Gold>
            </h2>
            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-lp-fg/65">
              Open any agent from the same workspace in your browser, on desktop or on mobile.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={isAuthenticated ? "/dashboard/apps" : "/signup"} className="lp-btn lp-btn-primary">
                Open the Library <span aria-hidden>→</span>
              </Link>
              <a href="#apps" className="lp-btn lp-btn-ghost">
                Browse Apps <span aria-hidden>→</span>
              </a>
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <li key={p} className="rounded-md border border-white/15 px-2.5 py-1 text-[10px] text-lp-fg/70">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <AppLibraryMock />
        </Reveal>
      </section>

      <section className="py-12" aria-label="What you get">
        <p className="mb-5 text-center text-[9px] font-semibold uppercase tracking-[0.4em] text-lp-fg/35">
          Built for creators and teams
        </p>
        <div className="lp-marquee">
          <ul className="lp-marquee-track gap-14 pr-14">
            {[...VALUES, ...VALUES].map((v, i) => (
              <li key={i} className="flex shrink-0 items-center gap-2 text-[13px] text-lp-fg/55">
                <span className="text-lp-amber" aria-hidden>
                  {v.glyph}
                </span>
                {v.text}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

export default WorkspaceSection;
