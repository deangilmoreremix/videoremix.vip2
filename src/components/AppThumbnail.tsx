import React from "react";

interface AppThumbnailProps {
  id: string;
  name: string;
  category: string;
  icon?: React.ReactNode;
  className?: string;
  locked?: boolean;
}

interface CategoryConfig {
  accent: string;
  accentDim: string;
  bg: string;
  glow: string;
  label: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  video: {
    accent: "#22d3ee",
    accentDim: "rgba(34,211,238,",
    bg: "linear-gradient(145deg, #04111e 0%, #071828 60%, #020a12 100%)",
    glow: "radial-gradient(ellipse at 50% 45%, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0.06) 45%, transparent 70%)",
    label: "Video",
  },
  branding: {
    accent: "#fbbf24",
    accentDim: "rgba(251,191,36,",
    bg: "linear-gradient(145deg, #130e01 0%, #1c1503 60%, #0c0a02 100%)",
    glow: "radial-gradient(ellipse at 50% 45%, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.06) 45%, transparent 70%)",
    label: "Branding",
  },
  "lead-gen": {
    accent: "#fb923c",
    accentDim: "rgba(251,146,60,",
    bg: "linear-gradient(145deg, #130700 0%, #1c0e02 60%, #0c0601 100%)",
    glow: "radial-gradient(ellipse at 50% 45%, rgba(251,146,60,0.22) 0%, rgba(251,146,60,0.06) 45%, transparent 70%)",
    label: "Lead Gen",
  },
  "ai-image": {
    accent: "#34d399",
    accentDim: "rgba(52,211,153,",
    bg: "linear-gradient(145deg, #011509 0%, #021e0c 60%, #010d06 100%)",
    glow: "radial-gradient(ellipse at 50% 45%, rgba(52,211,153,0.22) 0%, rgba(52,211,153,0.06) 45%, transparent 70%)",
    label: "AI Image",
  },
  personalizer: {
    accent: "#38bdf8",
    accentDim: "rgba(56,189,248,",
    bg: "linear-gradient(145deg, #02111d 0%, #031928 60%, #020c14 100%)",
    glow: "radial-gradient(ellipse at 50% 45%, rgba(56,189,248,0.22) 0%, rgba(56,189,248,0.06) 45%, transparent 70%)",
    label: "Personalizer",
  },
  creative: {
    accent: "#f87171",
    accentDim: "rgba(248,113,113,",
    bg: "linear-gradient(145deg, #130404 0%, #1c0606 60%, #0c0303 100%)",
    glow: "radial-gradient(ellipse at 50% 45%, rgba(248,113,113,0.22) 0%, rgba(248,113,113,0.06) 45%, transparent 70%)",
    label: "Creative",
  },
};

function hashId(id: string): number {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function getDotGridSvg(color: string): string {
  const encoded = encodeURIComponent(color);
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Ccircle cx='2' cy='2' r='1' fill='${encoded}' fill-opacity='0.35'/%3E%3C/svg%3E")`;
}

function getLineGridSvg(color: string): string {
  const encoded = encodeURIComponent(color);
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36'%3E%3Cpath d='M 36 0 L 0 0 0 36' fill='none' stroke='${encoded}' stroke-opacity='0.14' stroke-width='0.6'/%3E%3C/svg%3E")`;
}

function getDiagonalSvg(color: string): string {
  const encoded = encodeURIComponent(color);
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M 0 24 L 24 0' stroke='${encoded}' stroke-opacity='0.12' stroke-width='0.6'/%3E%3C/svg%3E")`;
}

export function AppThumbnail({
  id,
  name,
  category,
  icon,
  className = "",
  locked = false,
}: AppThumbnailProps) {
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["video"];
  const hash = hashId(id);
  const variant = hash % 3;

  const patternFns = [getDotGridSvg, getLineGridSvg, getDiagonalSvg];
  const patternSizes = ["28px 28px", "36px 36px", "24px 24px"];
  const bgPattern = patternFns[variant](config.accent);
  const patternSize = patternSizes[variant];

  const accentHex = config.accent;
  const a = config.accentDim;

  const iconEl =
    icon && React.isValidElement(icon)
      ? React.cloneElement(icon as React.ReactElement<Record<string, unknown>>, {
          size: 44,
          color: accentHex,
          style: { filter: `drop-shadow(0 0 10px ${accentHex}99)` },
        })
      : null;

  return (
    <div
      className={`relative overflow-hidden w-full h-full select-none ${className}`}
      style={{ background: config.bg }}
    >
      {/* Pattern layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: bgPattern,
          backgroundSize: patternSize,
          opacity: locked ? 0.5 : 1,
        }}
      />

      {/* Central glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: config.glow }}
      />

      {/* Top-left corner bracket */}
      <div
        className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 rounded-tl pointer-events-none"
        style={{ borderColor: `${a}0.35)` }}
      />
      {/* Bottom-right corner bracket */}
      <div
        className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 rounded-br pointer-events-none"
        style={{ borderColor: `${a}0.35)` }}
      />

      {/* Decorative variant shapes */}
      {variant === 0 && (
        <>
          <div
            className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{ background: accentHex, opacity: 0.5 }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-1 h-1 rounded-full pointer-events-none"
            style={{ background: accentHex, opacity: 0.35 }}
          />
          <div
            className="absolute top-2/3 left-1/3 w-1 h-1 rounded-full pointer-events-none"
            style={{ background: accentHex, opacity: 0.25 }}
          />
        </>
      )}
      {variant === 1 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
          style={{ border: `1px solid ${a}0.15)` }}
        />
      )}
      {variant === 2 && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rotate-45 pointer-events-none"
          style={{ border: `1px solid ${a}0.18)` }}
        />
      )}

      {/* Category badge */}
      <div
        className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-semibold tracking-wider uppercase pointer-events-none"
        style={{
          background: `${a}0.18)`,
          color: accentHex,
          border: `1px solid ${a}0.3)`,
          fontSize: "9px",
        }}
      >
        {config.label}
      </div>

      {/* Icon container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 76,
            height: 76,
            background: `${a}0.12)`,
            border: `1px solid ${a}0.28)`,
            boxShadow: `0 0 28px ${a}0.2), inset 0 1px 0 ${a}0.15)`,
            opacity: locked ? 0.4 : 1,
          }}
        >
          {iconEl}
        </div>
      </div>

      {/* App name gradient overlay + text */}
      <div
        className="absolute bottom-0 left-0 right-0 px-3 py-2 pointer-events-none"
        style={{
          background: `linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)`,
        }}
      >
        <p
          className="text-xs font-medium truncate"
          style={{ color: "rgba(255,255,255,0.65)", fontSize: "10px" }}
        >
          {name}
        </p>
      </div>
    </div>
  );
}
