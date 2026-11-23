import React from "react";
import type { AppMeta } from "../../config/appRegistry";
import { GROUP_ACCENT, groupInfo } from "./landingData";

/** Small deterministic string hash, so each app always gets the same poster. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * A poster drawn in code for apps with no real screenshot: dark panel, the
 * category's accent glow, a faint glyph and a line pattern unique to the app.
 * Fills its parent, so the parent sets the size and aspect ratio.
 */
const AppPoster: React.FC<{ app: AppMeta; label?: boolean; className?: string }> = ({ app, label = false, className = "" }) => {
  const group = groupInfo(app.group);
  const [main, second] = GROUP_ACCENT[app.group] ?? GROUP_ACCENT["agent-skills"];
  const h = hash(app.slug);
  const angle = h % 180;
  const gap = 14 + (h % 9);
  const glowX = 20 + ((h >> 3) % 60);
  const glowY = 15 + ((h >> 9) % 55);
  const glyphX = 40 + ((h >> 5) % 24);
  const glyphY = 50 + ((h >> 11) % 12);

  return (
    <div
      aria-hidden
      className={`relative h-full w-full overflow-hidden bg-[#08080b] ${className}`}
      style={{
        containerType: "size",
        backgroundImage: [
          `radial-gradient(circle at ${glowX}% ${glowY}%, rgb(${main} / 0.34), transparent 55%)`,
          `radial-gradient(circle at ${100 - glowX}% ${100 - glowY}%, rgb(${second} / 0.22), transparent 60%)`,
          `repeating-linear-gradient(${angle}deg, rgb(${main} / 0.07) 0 1px, transparent 1px ${gap}px)`,
        ].join(","),
      }}
    >
      <span
        className="absolute select-none font-mono leading-none"
        style={{
          left: `${glyphX}%`,
          top: `${glyphY}%`,
          transform: "translate(-50%, -50%)",
          fontSize: "min(7rem, 46cqh)",
          color: `rgb(${main} / 0.5)`,
          textShadow: `0 0 40px rgb(${main} / 0.5)`,
        }}
      >
        {group.glyph}
      </span>
      {label && (
        <span
          className="absolute bottom-2 left-3 text-[9px] font-bold uppercase tracking-[0.2em]"
          style={{ color: `rgb(${main})` }}
        >
          {group.label}
        </span>
      )}
      <span className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]" />
    </div>
  );
};

export default AppPoster;
