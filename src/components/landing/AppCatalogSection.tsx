import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import type { AppMeta } from "../../config/appRegistry";
import { dashboardAppTarget } from "../../config/appTargets";
import { Eyebrow, Gold } from "./ui";
import Reveal from "./Reveal";
import { ACTIVE_GROUPS, LANDING_APPS, countInGroup, groupInfo, resolveAppImage } from "./landingData";

const INITIAL_VISIBLE = 12;

const AppCard: React.FC<{ app: AppMeta; onOpen: (app: AppMeta) => void }> = ({ app, onOpen }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const group = groupInfo(app.group);
  const image = resolveAppImage(app);

  return (
    <button
      type="button"
      onClick={() => onOpen(app)}
      className="lp-card group flex h-full w-full flex-col overflow-hidden text-left transition duration-200 hover:-translate-y-0.5 hover:border-lp-amber/60"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
        {image && !imageFailed ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-lp-amber/20 via-black to-lp-purple/25">
            <span className="font-mono text-4xl text-lp-gold/70" aria-hidden>
              {group.glyph}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur">
          {group.emoji} {group.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[14px] font-medium leading-snug text-lp-fg">{app.name}</h3>
          <span
            aria-hidden
            className="mt-0.5 text-lp-fg/40 transition group-hover:translate-x-0.5 group-hover:text-lp-gold"
          >
            →
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-lp-fg/55">{app.description}</p>
      </div>
    </button>
  );
};

const AppCatalogSection: React.FC = () => {
  const navigate = useNavigate();
  const [group, setGroup] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LANDING_APPS.filter((app) => {
      if (group !== "all" && app.group !== group) return false;
      if (!q) return true;
      return `${app.name} ${app.description} ${groupInfo(app.group).label}`.toLowerCase().includes(q);
    });
  }, [group, query]);

  // A filter or search narrows the list, so show all of it.
  const showAll = expanded || group !== "all" || query.trim() !== "";
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);

  const openApp = (app: AppMeta) => {
    const target = dashboardAppTarget(app);
    if (target.kind === "external") {
      window.open(target.destination, "_blank", "noopener,noreferrer");
    } else {
      navigate(target.destination);
    }
  };

  const chip = (key: string, label: string, count: number) => {
    const active = group === key;
    return (
      <button
        key={key}
        type="button"
        aria-pressed={active}
        onClick={() => setGroup(key)}
        className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs transition ${
          active
            ? "border-transparent bg-gradient-to-r from-[#9d2342] to-[#d42955] text-white"
            : "border-white/15 text-lp-fg/60 hover:border-lp-amber/50 hover:text-lp-fg"
        }`}
      >
        {label} <span className="ml-1 tabular-nums opacity-60">{count}</span>
      </button>
    );
  };

  return (
    <section id="apps" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1180px]">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>The app library</Eyebrow>
          <h2 className="lp-h2 text-lp-fg sm:text-[44px]">
            Every agent you need. <Gold>Ready to run.</Gold>
          </h2>
          <p className="mt-4 text-[14px] text-lp-fg/60">
            Every app in the VideoRemix VIP library, from starter agents to multi-agent teams. Pick one and run it.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4">
          <label className="relative mx-auto w-full max-w-md">
            <span className="sr-only">Search apps</span>
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lp-fg/40" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${LANDING_APPS.length} apps…`}
              className="w-full rounded-full border border-white/15 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-lp-fg placeholder:text-lp-fg/40 focus:border-lp-amber/60 focus:outline-none"
            />
          </label>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
            {chip("all", "All", LANDING_APPS.length)}
            {ACTIVE_GROUPS.map((g) => chip(g.key, `${g.emoji} ${g.label}`, countInGroup(g.key)))}
          </div>
        </div>

        {visible.length > 0 ? (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((app) => (
              <li key={app.slug}>
                <AppCard app={app} onOpen={openApp} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-16 text-center text-lp-fg/50">No apps match “{query}”.</p>
        )}

        {!showAll && filtered.length > INITIAL_VISIBLE && (
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="lp-btn lp-btn-gold rounded-full"
            >
              Show all {filtered.length} apps →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AppCatalogSection;
