/**
 * Shared types for all AI App runner components.
 * This ensures consistency across the 95 apps.
 *
 * Error handling strategy (enforced): runner-only.
 * - App components receive onError to forward, but MUST NOT render {error} locally (prevents dups).
 * - Runner (AIAppRunnerPage) displays errors using the ErrorState primitive.
 * - Apps use reset() + onReset for clearing results (never window.location.reload).
 */

export interface AIAppProps {
  /** The app slug (e.g. "ai-sales-intelligence-pro") */
  appId: string;
  /** Human-friendly name */
  appName: string;
  /** Called when the app produces a successful result */
  onResult?: (result: AIAppResult) => void;
  /** Called on error */
  onError?: (error: string) => void;
  /** Called when the internal running state changes (enables parent to disable Save/Download during execution) */
  onRunningChange?: (isRunning: boolean) => void;
  /** Called when child invokes reset() (from "New XXX" or clear buttons) so runner can clear lastResult / lastError */
  onReset?: () => void;
}

export interface AIAppResult {
  success: boolean;
  output: string | object;
  metadata?: Record<string, any>;
  /** Optional files or assets returned */
  files?: Array<{ name: string; url: string; type: string }>;
}

export type AIAppComponent = React.ComponentType<AIAppProps>;

/**
 * Standard shape every specific AI app component should follow.
 * This is the "contract" for the template system.
 */
export interface AIAppDefinition {
  slug: string;
  name: string;
  /** Short description for the runner header */
  description?: string;
  /** The actual React component */
  Component: AIAppComponent;
  /** Whether this app has a fully custom UI or is still using the generic fallback */
  isFullyImplemented?: boolean;
}

/**
 * Options for the useRunAIApp hook.
 */
export interface UseRunAIAppOptions {
  onResult?: (result: AIAppResult) => void;
  onError?: (error: string) => void;
  onReset?: () => void;
}

/**
 * Return value from useRunAIApp hook.
 * Provides the clean runner API so individual apps only contain form + result UI.
 */
export interface UseRunAIAppReturn {
  /** Invoke the run-ai-app Edge Function with the app-specific inputs */
  run: (inputs: Record<string, any>) => Promise<void>;
  isRunning: boolean;
  output: any;
  error: string | null;
  /** Clear output and error (e.g. "New Analysis" button) */
  reset: () => void;
}
