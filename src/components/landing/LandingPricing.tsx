import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { defaultPlans, type PricingPlan } from "../../data/pricingPlans";
import Reveal from "./Reveal";
import { LANDING_APP_COUNT } from "./landingData";
import { Eyebrow, Gold } from "./ui";

type Cycle = "monthly" | "yearly" | "lifetime";

const CYCLES: Array<{ value: Cycle; label: string }> = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Annual" },
  { value: "lifetime", label: "Lifetime" },
];

const SUFFIX: Record<Cycle, string> = { monthly: "/month", yearly: "/year", lifetime: "one-time" };

function priceFor(plan: PricingPlan, cycle: Cycle): number {
  if (cycle === "monthly") return plan.price_monthly;
  if (cycle === "yearly") return plan.price_yearly;
  return plan.price_lifetime;
}

/** Single apps are sold individually at a lifetime price (see AGENTS.md). */
const SINGLE_APP = {
  name: "Single App",
  price: 97,
  description: "Own one app for life.",
  features: ["Lifetime access to one app", "All future updates", "Bring your own keys", "Saved runs and history"],
};

// Featured plan first, as in the design.
const ORDERED = [...defaultPlans].sort((a, b) => Number(b.is_popular) - Number(a.is_popular));

const LandingPricing: React.FC = () => {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <section id="pricing" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>AI app plans</Eyebrow>
          <h2 className="lp-h2 text-lp-fg sm:text-[44px]">
            Start free. Scale your <Gold>AI workforce.</Gold>
          </h2>
          <p className="mt-4 text-[14px] text-lp-fg/65">
            Run your first AI app today, then unlock more as your work grows.
          </p>
        </Reveal>

        <div className="mt-8 flex justify-center">
          <div role="radiogroup" aria-label="Billing cycle" className="inline-flex rounded-full border border-white/15 bg-white/[0.03] p-1">
            {CYCLES.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={cycle === c.value}
                onClick={() => setCycle(c.value)}
                className={`rounded-full px-6 py-2 text-[12px] font-semibold transition ${
                  cycle === c.value ? "bg-gradient-to-r from-[#9d2342] to-[#d42955] text-white" : "text-lp-fg/60 hover:text-lp-fg"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-lp-fg/50">
          Every plan includes access to the <b className="font-semibold text-lp-fg/85">{LANDING_APP_COUNT}-app library</b>, saved
          workspaces and bring-your-own-keys.
        </p>
        <p className="mx-auto mt-4 max-w-2xl rounded-md border border-lp-amber/25 bg-lp-amber/[0.04] px-4 py-2.5 text-center text-[11px] text-lp-fg/60">
          <b className="font-semibold text-lp-fg">Clear costs, separate layers.</b> Plans cover the apps and workspace. Model
          usage is billed by your provider on your own keys.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {ORDERED.map((plan, i) => {
            const amount = priceFor(plan, cycle);
            const featured = plan.is_popular;
            return (
              <Reveal
                key={plan.name}
                delay={i * 0.05}
                className={`relative flex flex-col rounded-[15px] border p-6 ${
                  featured
                    ? "border-lp-magenta/80 bg-[radial-gradient(circle_at_65%_0,rgba(164,61,219,0.24),transparent_39%),radial-gradient(circle_at_10%_0,rgba(229,42,100,0.16),transparent_38%),linear-gradient(145deg,rgba(128,33,90,0.18),rgba(255,255,255,0.02))] shadow-[0_18px_42px_rgba(113,35,165,0.18)]"
                    : "border-white/15 bg-white/[0.02]"
                }`}
              >
                {featured && (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-lp-magenta to-lp-purple px-3 py-1 text-[10px] font-bold leading-tight text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-[26px] font-light text-lp-fg">{plan.name}</h3>
                <p className="mt-2 min-h-[36px] text-[12px] text-lp-fg/60">{plan.description}</p>
                <p className="mt-6 flex items-start gap-1">
                  <span className="mt-2 text-lg text-lp-fg/80">$</span>
                  <span className="text-[52px] font-semibold leading-none tabular-nums text-lp-fg">{amount}</span>
                  <span className="mt-auto pb-1 text-[11px] text-lp-fg/55">{amount === 0 ? "forever" : SUFFIX[cycle]}</span>
                </p>
                <p className="mt-3 text-[10px] text-lp-fg/45">
                  {amount === 0 ? "No card required" : cycle === "lifetime" ? "Pay once" : `Billed ${cycle === "monthly" ? "monthly" : "annually"}`}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-[12px] text-lp-fg/80">
                      <Check size={13} className="mt-0.5 shrink-0 text-lp-fg/60" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-8">
                  <Link
                    to="/signup"
                    className={`lp-btn w-full ${featured ? "text-white shadow-[0_10px_30px_rgba(164,61,219,0.3)]" : "lp-btn-ghost"}`}
                    style={featured ? { backgroundImage: "linear-gradient(110deg,#e1306c,#8a31d8)" } : undefined}
                  >
                    {amount === 0 ? "Start Free" : `Choose ${plan.name}`} <span aria-hidden>→</span>
                  </Link>
                </div>
              </Reveal>
            );
          })}

          <Reveal delay={0.15} className="relative flex flex-col rounded-[15px] border border-white/15 bg-white/[0.02] p-6">
            <h3 className="text-[26px] font-light text-lp-fg">{SINGLE_APP.name}</h3>
            <p className="mt-2 min-h-[36px] text-[12px] text-lp-fg/60">{SINGLE_APP.description}</p>
            <p className="mt-6 flex items-start gap-1">
              <span className="mt-2 text-lg text-lp-fg/80">$</span>
              <span className="text-[52px] font-semibold leading-none tabular-nums text-lp-fg">{SINGLE_APP.price}</span>
              <span className="mt-auto pb-1 text-[11px] text-lp-fg/55">per app</span>
            </p>
            <p className="mt-3 text-[10px] text-lp-fg/45">Lifetime, pay once</p>
            <ul className="mt-6 space-y-2.5">
              {SINGLE_APP.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-[12px] text-lp-fg/80">
                  <Check size={13} className="mt-0.5 shrink-0 text-lp-fg/60" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <a href="#apps" className="lp-btn lp-btn-ghost w-full">
                Pick an App <span aria-hidden>→</span>
              </a>
            </div>
          </Reveal>
        </div>

        <ul className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[11px] text-lp-fg/55">
          <li>▣ No credit card required</li>
          <li>⬡ Bring your own keys</li>
          <li>◈ Upgrade as your work grows</li>
        </ul>

        <Reveal className="lp-panel mt-8 flex flex-col items-start justify-between gap-4 px-6 py-6 sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="text-[15px] font-semibold text-lp-fg">Need team rollouts, white-label or custom apps?</p>
            <p className="mt-1 text-[12px] text-lp-fg/55">Bring VideoRemix into your agency or company with a tailored plan.</p>
          </div>
          <Link to="/pricing" className="lp-btn lp-btn-gold">
            Compare all plans <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
};

export default LandingPricing;
