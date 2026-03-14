import React from "react";

interface FeatureThumbnailProps {
  featureId: string;
  icon?: React.ReactNode;
  className?: string;
}

interface FeatureConfig {
  accent: string;
  accentDim: string;
  bg: string;
  glow: string;
  ringColor: string;
}

const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  "ai-video-creator": {
    accent: "#22d3ee",
    accentDim: "rgba(34,211,238,",
    bg: "linear-gradient(145deg, #030d18 0%, #06182a 55%, #020b14 100%)",
    glow: "radial-gradient(ellipse at 52% 48%, rgba(34,211,238,0.28) 0%, rgba(34,211,238,0.1) 40%, transparent 68%)",
    ringColor: "rgba(34,211,238,",
  },
  "ai-editing": {
    accent: "#818cf8",
    accentDim: "rgba(129,140,248,",
    bg: "linear-gradient(145deg, #08061a 0%, #100d28 55%, #060413 100%)",
    glow: "radial-gradient(ellipse at 52% 48%, rgba(129,140,248,0.28) 0%, rgba(129,140,248,0.1) 40%, transparent 68%)",
    ringColor: "rgba(129,140,248,",
  },
  "smart-templates": {
    accent: "#fbbf24",
    accentDim: "rgba(251,191,36,",
    bg: "linear-gradient(145deg, #130e01 0%, #1e1604 55%, #0c0a02 100%)",
    glow: "radial-gradient(ellipse at 52% 48%, rgba(251,191,36,0.28) 0%, rgba(251,191,36,0.1) 40%, transparent 68%)",
    ringColor: "rgba(251,191,36,",
  },
  "content-repurposing": {
    accent: "#fb923c",
    accentDim: "rgba(251,146,60,",
    bg: "linear-gradient(145deg, #130700 0%, #1e0e02 55%, #0c0500 100%)",
    glow: "radial-gradient(ellipse at 52% 48%, rgba(251,146,60,0.28) 0%, rgba(251,146,60,0.1) 40%, transparent 68%)",
    ringColor: "rgba(251,146,60,",
  },
  "auto-captions": {
    accent: "#34d399",
    accentDim: "rgba(52,211,153,",
    bg: "linear-gradient(145deg, #011509 0%, #041f0d 55%, #020f06 100%)",
    glow: "radial-gradient(ellipse at 52% 48%, rgba(52,211,153,0.28) 0%, rgba(52,211,153,0.1) 40%, transparent 68%)",
    ringColor: "rgba(52,211,153,",
  },
  collaboration: {
    accent: "#38bdf8",
    accentDim: "rgba(56,189,248,",
    bg: "linear-gradient(145deg, #020f1d 0%, #041728 55%, #020a13 100%)",
    glow: "radial-gradient(ellipse at 52% 48%, rgba(56,189,248,0.28) 0%, rgba(56,189,248,0.1) 40%, transparent 68%)",
    ringColor: "rgba(56,189,248,",
  },
};

const FALLBACK_CONFIG: FeatureConfig = {
  accent: "#22d3ee",
  accentDim: "rgba(34,211,238,",
  bg: "linear-gradient(145deg, #030d18 0%, #06182a 55%, #020b14 100%)",
  glow: "radial-gradient(ellipse at 52% 48%, rgba(34,211,238,0.28) 0%, rgba(34,211,238,0.1) 40%, transparent 68%)",
  ringColor: "rgba(34,211,238,",
};

function getDotGridSvg(color: string): string {
  const encoded = encodeURIComponent(color);
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='2' cy='2' r='1.2' fill='${encoded}' fill-opacity='0.3'/%3E%3C/svg%3E")`;
}

export function FeatureThumbnail({
  featureId,
  icon,
  className = "",
}: FeatureThumbnailProps) {
  const config = FEATURE_CONFIG[featureId] ?? FALLBACK_CONFIG;
  const a = config.ringColor;

  const iconEl =
    icon && React.isValidElement(icon)
      ? React.cloneElement(
          icon as React.ReactElement<Record<string, unknown>>,
          {
            size: 56,
            color: config.accent,
            style: {
              filter: `drop-shadow(0 0 16px ${config.accent}bb)`,
            },
          }
        )
      : null;

  return (
    <div
      className={`relative overflow-hidden w-full h-full select-none ${className}`}
      style={{ background: config.bg }}
    >
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: getDotGridSvg(config.accent),
          backgroundSize: "32px 32px",
        }}
      />

      {/* Deep glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: config.glow }}
      />

      {/* Outer decorative ring */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: "60%",
          height: "75%",
          border: `1px solid ${a}0.12)`,
        }}
      />

      {/* Middle ring */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: "38%",
          height: "50%",
          border: `1px solid ${a}0.2)`,
        }}
      />

      {/* Corner brackets */}
      <div
        className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 rounded-tl pointer-events-none"
        style={{ borderColor: `${a}0.4)` }}
      />
      <div
        className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 rounded-tr pointer-events-none"
        style={{ borderColor: `${a}0.4)` }}
      />
      <div
        className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 rounded-bl pointer-events-none"
        style={{ borderColor: `${a}0.4)` }}
      />
      <div
        className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 rounded-br pointer-events-none"
        style={{ borderColor: `${a}0.4)` }}
      />

      {/* Floating accent dots */}
      <div
        className="absolute top-1/4 left-1/6 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: config.accent, opacity: 0.4 }}
      />
      <div
        className="absolute bottom-1/4 right-1/6 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: config.accent, opacity: 0.3 }}
      />
      <div
        className="absolute top-1/3 right-1/5 w-1 h-1 rounded-full pointer-events-none"
        style={{ background: config.accent, opacity: 0.25 }}
      />

      {/* Icon container */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 96,
            height: 96,
            background: `${a}0.1)`,
            border: `1px solid ${a}0.3)`,
            boxShadow: `0 0 40px ${a}0.25), 0 0 80px ${a}0.1), inset 0 1px 0 ${a}0.2)`,
          }}
        >
          {iconEl}
        </div>
      </div>

      {/* Subtle bottom gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: `linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}
