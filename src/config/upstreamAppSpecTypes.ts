// src/config/upstreamAppSpecTypes.ts
//
// The shape of an upstream app's screen (see upstreamAppSpecs.ts).

export type UpstreamFieldKind =
  | "text"
  | "textarea"
  | "number"
  | "slider"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "file"
  | "date"
  | "time"
  | "color"
  | "chat";

export interface UpstreamField {
  /** The input name sent to the runner. */
  name: string;
  kind: UpstreamFieldKind;
  label: string;
  options?: string[];
  value?: string | number | boolean | string[];
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  accept?: string[];
  multiple?: boolean;
  sidebar?: boolean;
  tab?: string | null;
}

export interface UpstreamAppSpec {
  slug: string;
  /** "form": Streamlit inputs and a run button; "chat": a conversation; "tool": a form with named inputs. */
  layout: "form" | "chat" | "tool";
  title: string;
  intro?: string;
  framework: string;
  fields: UpstreamField[];
  runLabel: string;
  tabs: string[];
  outputs: string[];
  examples?: string[];
  /** A CopilotKit app's canvas or report: the result is shown as this panel. */
  panel?: string;
  attachments?: { label: string; accept: string[]; multiple: boolean };
  /** What differs from upstream here, in plain words. */
  note?: string;
  upstreamPath: string;
}

export interface ManualSpec {
  layout: "chat" | "tool";
  title: string;
  intro?: string;
  framework: string;
  fields?: UpstreamField[];
  runLabel?: string;
  examples?: string[];
  panel?: string;
  attachments?: { label: string; accept: string[]; multiple: boolean };
  note?: string;
}
