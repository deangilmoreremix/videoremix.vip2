import React from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import { Wordmark } from "./LandingNav";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { to: "/#apps", label: "App Library" },
      { to: "/#how-it-works", label: "How it Works" },
      { to: "/pricing", label: "Pricing" },
      { to: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { to: "/#teams", label: "Agent Teams" },
      { to: "/apps", label: "All Applications" },
      { to: "/courses", label: "Courses" },
    ],
  },
  {
    title: "Resources",
    links: [
      { to: "/faq", label: "FAQ" },
      { to: "/#faq", label: "Quick Answers" },
    ],
  },
  {
    title: "Account",
    links: [
      { to: "/signin", label: "Sign In" },
      { to: "/signup", label: "Create Account" },
      { to: "/settings", label: "Settings" },
    ],
  },
];

const FooterLink: React.FC<{ to: string; label: string }> = ({ to, label }) =>
  to.startsWith("/#") ? (
    <a href={to.slice(1)} className="text-[13px] text-lp-fg/55 transition hover:text-lp-fg">
      {label}
    </a>
  ) : (
    <Link to={to} className="text-[13px] text-lp-fg/55 transition hover:text-lp-fg">
      {label}
    </Link>
  );

const LandingFooter: React.FC = () => (
  <footer className="px-4 pt-10 sm:px-6">
    <div className="mx-auto max-w-[1180px]">
      <div className="grid gap-10 lg:grid-cols-[1fr_2.2fr]">
        <div>
          <Wordmark size="lg" />
          <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed text-lp-fg/55">
            VideoRemix VIP: the AI app platform to find, run and manage ready-made AI agents.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="https://videoremix.vip" aria-label="Website" className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-lp-fg/70 hover:text-lp-fg">
              <Globe size={13} />
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[15px] font-medium text-lp-fg">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-12 border-t border-white/10 py-6 text-center text-[9px] uppercase tracking-[0.2em] text-lp-fg/45">
        © {new Date().getFullYear()} VideoRemix VIP. All rights reserved.{" "}
        <span className="text-lp-amber">✦</span>
      </p>
    </div>
  </footer>
);

export default LandingFooter;
