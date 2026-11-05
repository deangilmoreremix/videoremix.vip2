import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Reveal from "./Reveal";
import { THUMBNAIL_APPS, resolveAppImage } from "./landingData";

const ClosingCTA: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const strip = THUMBNAIL_APPS.slice(0, 4);
  return (
    <section className="px-4 py-10 sm:px-6">
      <Reveal className="lp-panel relative mx-auto grid max-w-[1180px] items-center overflow-hidden lg:grid-cols-[1fr_0.5fr_1.1fr]">
        <div className="relative z-10 p-7 sm:p-9">
          <h2 className="lp-h2 text-lp-fg">
            Ready to build your
            <br />
            AI workforce?
          </h2>
          <p className="mt-3 max-w-xs text-[12px] text-lp-fg/60">Own the apps, keys and workspace behind your AI team.</p>
        </div>
        <div className="relative z-10 px-7 pb-7 sm:px-9 lg:p-0">
          <Link to={isAuthenticated ? "/dashboard/apps" : "/signup"} className="lp-btn lp-btn-lg lp-btn-primary">
            Get Started Free <span aria-hidden>→</span>
          </Link>
        </div>
        <div aria-hidden className="relative hidden h-full min-h-[150px] lg:block">
          <div className="lp-rings absolute inset-[-40%] opacity-70" />
          <div className="absolute inset-0 flex items-end justify-center gap-3 px-4">
            {strip.map((app, i) => (
              <div
                key={app.slug}
                className="w-[22%] overflow-hidden rounded-t-lg border border-b-0 border-lp-amber/40"
                style={{ height: `${70 + (i % 2) * 15}%` }}
              >
                <img src={resolveAppImage(app) ?? ""} alt="" loading="lazy" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget.style.visibility = "hidden"))} />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default ClosingCTA;
