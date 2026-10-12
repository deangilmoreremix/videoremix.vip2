// src/components/agentos/mission-control/inspector/ModelInspector.tsx
//
// Inspector for a model node: pricing and capabilities straight from the
// catalog, so the canvas and the bill can never disagree.

import { Cpu } from "lucide-react";
import { Pill, Section } from "../../ui";
import type { ModelCatalogEntry } from "../../../../types/agentos";

export interface ModelInspectorProps {
  model: ModelCatalogEntry;
}

export const ModelInspector: React.FC<ModelInspectorProps> = ({ model }) => (
  <div className="p-4">
    <Section>
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-emerald-300">
          <Cpu className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-white">{model.display_name}</p>
          <p className="text-xs text-white/45">{model.id}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(model.capabilities ?? []).map((capability) => (
          <Pill key={capability} tone="sky">
            {capability}
          </Pill>
        ))}
      </div>
    </Section>

    <Section title="Limits and pricing">
      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Provider</dt>
          <dd className="text-white/75">{model.provider}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Family</dt>
          <dd className="text-white/75">{model.family}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Context</dt>
          <dd className="tabular-nums text-white/75">{model.context_window.toLocaleString()}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Input credits / 1K</dt>
          <dd className="tabular-nums text-white/75">{model.credit_rate_in}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Output credits / 1K</dt>
          <dd className="tabular-nums text-white/75">{model.credit_rate_out}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-white/40">Status</dt>
          <dd className="text-white/75">{model.status}</dd>
        </div>
      </dl>
    </Section>

    <p className="px-1 text-xs text-white/35">
      Workers route here through their primary and fallback model settings.
    </p>
  </div>
);

export default ModelInspector;
