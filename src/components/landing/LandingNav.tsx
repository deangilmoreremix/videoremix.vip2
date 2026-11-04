import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const LINKS = [
  { href: "#apps", label: "Apps" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#teams", label: "Teams" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export const Wordmark: React.FC<{ size?: "md" | "lg" }> = ({ size = "md" }) => (
  <Link to="/" className="flex items-center gap-2" aria-label="VideoRemix home">
    <span
      aria-hidden
      className={`grid grid-cols-2 gap-[3px] rounded-[7px] bg-lp-red p-[5px] ${size === "lg" ? "h-9 w-9" : "h-8 w-8"}`}
    >
      <span className="rounded-[2px] bg-white" />
      <span className="rounded-[2px] bg-white/60" />
      <span className="rounded-[2px] bg-white/60" />
      <span className="rounded-[2px] bg-white" />
    </span>
    <span className={`font-bold tracking-tight text-lp-fg ${size === "lg" ? "text-2xl" : "text-xl"}`}>
      Video<span className="text-lp-red">Remix</span>
    </span>
  </Link>
);

const LandingNav: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cta = isAuthenticated ? { to: "/dashboard", label: "Open Dashboard" } : { to: "/signup", label: "Get Started" };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/[0.16] transition-colors duration-300 ${
        scrolled || open ? "bg-lp-bg/90 backdrop-blur-xl" : "bg-lp-bg/40"
      }`}
    >
      <nav className="mx-auto flex h-[61px] max-w-[1180px] items-center justify-between px-4 sm:px-6">
        <Wordmark />

        <ul className="hidden items-center gap-10 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-[13px] text-lp-fg/80 transition-colors hover:text-lp-fg">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-5 md:flex">
          {!isAuthenticated && (
            <Link to="/signin" className="text-[13px] text-lp-fg/70 transition-colors hover:text-lp-fg">
              Sign in
            </Link>
          )}
          <Link to={cta.to} className="lp-btn lp-btn-primary">
            {cta.label} <span aria-hidden>→</span>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-lp-fg md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 px-4 pb-5 pt-2 md:hidden">
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)} className="flex justify-between py-3 text-[15px] text-lp-fg">
                  {link.label} <span className="text-lp-amber">→</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            {!isAuthenticated && (
              <Link to="/signin" className="lp-btn lp-btn-ghost flex-1">
                Sign in
              </Link>
            )}
            <Link to={cta.to} className="lp-btn lp-btn-primary flex-1">
              {cta.label} →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
