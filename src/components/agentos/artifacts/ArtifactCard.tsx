// src/components/agentos/artifacts/ArtifactCard.tsx
//
// One artifact, as a tile.
//
// WHY A TILE AND NOT A ROW
//   Artifacts are visual output (reports, images, generated media) and are
//   browsed by kind, so a grid reads better than a table. The card keeps the
//   same fields every time — kind, name, preview, size, age, worker — so two
//   artifacts are never described in two different ways.

import { Clapperboard, File, FileText, Image, Music, Newspaper } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Artifact, ArtifactKind } from "../../../types/agentos";
import { Pill } from "../ui";
import { formatBytes, relativeTime } from "../format";

/** The icon that stands for each artifact kind. */
const ARTIFACT_KIND_ICON: Record<ArtifactKind, LucideIcon> = {
  file: File,
  text: FileText,
  image: Image,
  audio: Music,
  video: Clapperboard,
  report: Newspaper,
};

export interface ArtifactCardProps {
  artifact: Artifact;
  /** The name of the worker that produced it, when it is known. */
  workerName?: string;
  onSelect?: (artifact: Artifact) => void;
}

/** The preview is a peek, not the artifact — it is cut to a readable length. */
const PREVIEW_LENGTH = 160;

export const ArtifactCard: React.FC<ArtifactCardProps> = ({
  artifact,
  workerName,
  onSelect,
}) => {
  const Icon = ARTIFACT_KIND_ICON[artifact.kind] ?? File;
  const preview = (artifact.preview ?? "").trim();
  const truncated =
    preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(artifact)}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-black/40 p-4 text-left transition hover:border-violet-400/30 hover:bg-black/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-violet-300">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="truncate text-sm font-medium text-white group-hover:text-violet-200">
            {artifact.name}
          </p>
        </div>
        <Pill tone="slate">{artifact.kind}</Pill>
      </div>

      <p className="mt-3 line-clamp-3 min-h-[3.75rem] text-xs text-white/50">
        {truncated || "No preview stored for this artifact."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
        <span className="tabular-nums">{formatBytes(artifact.size_bytes)}</span>
        <span aria-hidden="true">·</span>
        <span>{relativeTime(artifact.created_at)}</span>
        {artifact.worker_id ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="truncate">{workerName ?? "worker"}</span>
          </>
        ) : null}
      </div>
    </button>
  );
};

export default ArtifactCard;
