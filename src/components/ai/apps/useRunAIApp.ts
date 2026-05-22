import { useState, useCallback } from "react";
import { supabase } from "../../../utils/supabaseClient";
import type { UseRunAIAppOptions, UseRunAIAppReturn } from "./types";

/**
 * Reusable hook for running any of the 95 AI apps.
 *
 * Centralizes the duplicated ~25-35 lines of useState + supabase.functions.invoke + try/catch + onResult/onError
 * that previously lived in every app component (and GenericAIApp).
 *
 * Apps now only own their specific form fields and result rendering.
 * isRunning is returned so parents (AIAppRunnerPage) can disable shell actions and show global loading chrome.
 */
export function useRunAIApp(
  slug: string,
  options: UseRunAIAppOptions = {}
): UseRunAIAppReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (inputs: Record<string, any>) => {
      setIsRunning(true);
      setError(null);
      setOutput(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke("run-ai-app", {
          body: { appSlug: slug, inputs },
        });

        if (invokeError) throw invokeError;
        if (data && !data.success && data.error) {
          throw new Error(data.error);
        }

        const result = data?.output ?? data;
        setOutput(result);

        options.onResult?.({
          success: true,
          output: result,
          metadata: data?.metadata,
        });
      } catch (err: any) {
        const msg = err?.message || err?.error || "Failed to run AI app";
        setError(msg);
        options.onError?.(msg);
      } finally {
        setIsRunning(false);
      }
    },
    [slug, options.onResult, options.onError, options.onReset]
  );

  const reset = useCallback(() => {
    setOutput(null);
    setError(null);
    options.onReset?.();
  }, [options.onReset]);

  return { run, isRunning, output, error, reset };
}
