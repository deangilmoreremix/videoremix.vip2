import React from "react";
import { LayoutGrid, Bot, Activity, KeyRound, Settings, Search, Plus } from "lucide-react";
import { ACTIVE_GROUPS, LANDING_APPS, THUMBNAIL_APPS, groupInfo, resolveAppImage } from "./landingData";

// A static, decorative rendering of the dashboard's app library, built in HTML
// so it always matches the real catalog.

const NAV = [
  { icon: LayoutGrid, label: "App Library", active: true },
  { icon: Bot, label: "Agents" },
  { icon: Activity, label: "Activity" },
  { icon: KeyRound, label: "API Keys" },
  { icon: Settings, label: "Settings" },
];

const AppLibraryMock: React.FC<{ offset?: number; title?: string }> = ({ offset = 0, title = "App Library" }) => {
  const apps = (THUMBNAIL_APPS.length >= 6 ? THUMBNAIL_APPS : LANDING_APPS).slice(offset, offset + 6);
  return (
    <div aria-hidden className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0b10] text-left shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[9px] text-white/50">VideoRemix VIP · {title}</span>
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>
      <div className="flex">
        <div className="hidden w-[26%] shrink-0 border-r border-white/10 p-2.5 sm:block">
          <div className="mb-2.5 rounded-md border border-white/10 bg-white/[0.03] p-2">
            <p className="text-[9px] font-semibold text-white/85">My Workspace</p>
            <p className="text-[7px] text-emerald-400">● Online</p>
          </div>
          <div className="mb-3 flex items-center justify-center gap-1 rounded-md bg-lp-red/90 py-1.5 text-[8px] font-semibold text-white">
            <Plus size={9} /> New Run
          </div>
          <ul className="space-y-1">
            {NAV.map(({ icon: Icon, label, active }) => (
              <li
                key={label}
                className={`flex items-center gap-1.5 rounded px-1.5 py-1 text-[8px] ${active ? "bg-lp-red/20 text-white" : "text-white/45"}`}
              >
                <Icon size={9} /> {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-white">{title}</p>
            <div className="flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[7px] text-white/40">
              <Search size={8} /> Search {LANDING_APPS.length} apps
            </div>
          </div>
          <div className="mt-2 flex gap-1 overflow-hidden">
            {ACTIVE_GROUPS.slice(0, 5).map((g, i) => (
              <span
                key={g.key}
                className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] ${i === 0 ? "border-lp-red/60 text-white" : "border-white/10 text-white/45"}`}
              >
                {g.label}
              </span>
            ))}
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {apps.map((app) => (
              <div key={app.slug} className="overflow-hidden rounded-md border border-white/10 bg-white/[0.02]">
                <div className="aspect-[16/9] bg-gradient-to-br from-lp-amber/20 to-lp-purple/25">
                  {resolveAppImage(app) && (
                    <img
                      src={resolveAppImage(app) ?? ""}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={(e) => ((e.currentTarget.style.display = "none"))}
                    />
                  )}
                </div>
                <div className="p-1.5">
                  <p className="truncate text-[8px] font-semibold text-white/90">{app.name}</p>
                  <p className="truncate text-[6.5px] text-lp-amber/80">{groupInfo(app.group).label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLibraryMock;
