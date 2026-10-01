import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../../../utils/supabaseClient";
import { getClerkTokenGetter } from "../../../utils/supabase";
import type { UseRunAIAppOptions, UseRunAIAppReturn, ConversationMessage } from "./types";

/**
 * Reusable hook for running SapienX AI apps through the shared Responses API backend.
 * Supports streaming responses via WebSocket (with SSE fallback), multi-turn conversation context, and auto-retry.
 *
 * Centralizes the duplicated ~25-35 lines of useState + supabase.functions.invoke + try/catch + onResult/onError
 * that previously lived in every ai-design-studio component (and GenericAIApp).
 */
export function useRunAIApp(
  slug: string,
  options: UseRunAIAppOptions = {}
): UseRunAIAppReturn {
  const {
    enableMultiTurn = false,
    maxHistoryItems = 20,
    autoRetry = false,
    maxRetries = 3,
  } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [errorSuggestion, setErrorSuggestion] = useState<string | undefined>(undefined);

  const fullResponseRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const parseErrorSuggestion = useCallback((errorMsg: string): string | undefined => {
    const msg = errorMsg.toLowerCase();

    if (msg.includes("rate_limit") || msg.includes("rate limit") || msg.includes("429")) {
      return "Rate limit exceeded. Please wait a few seconds before trying again, or reduce request frequency.";
    }
    if (msg.includes("timeout") || msg.includes("timed out")) {
      return "Request timed out. The operation may be taking too long. Try with smaller inputs or wait and retry.";
    }
    if (msg.includes("invalid_api_key") || msg.includes("unauthorized") || msg.includes("401")) {
      return "Authentication failed. Please check your API credentials and try again.";
    }
    if (msg.includes("invalid_request") || msg.includes("400")) {
      return "Invalid request. Please check your inputs and try again.";
    }
    if (msg.includes("internal_server_error") || msg.includes("500")) {
      return "Server error. Please try again in a few moments.";
    }
    if (msg.includes("network") || msg.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }
    if (msg.includes("quota") || msg.includes("exceeded")) {
      return "Usage quota exceeded. Please upgrade your plan or wait until your quota resets.";
    }

    return undefined;
  }, []);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  // Clerk is the single source of truth for authentication. The canonical
  // Supabase client is configured with a Clerk accessToken callback, so its
  // auth namespace is intentionally disabled. Read the same Clerk token getter
  // that AuthContext wires into Supabase instead of trying to read a Supabase session.
  const getAccessToken = useCallback(async (): Promise<string> => {
    try {
      return (await getClerkTokenGetter()()) ?? "";
    } catch {
      return "";
    }
  }, []);

  const buildMultiTurnContext = useCallback((): string => {
    if (!enableMultiTurn || conversationHistory.length === 0) {
      return "";
    }

    const historyText = conversationHistory
      .slice(-maxHistoryItems)
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    return `Conversation history:\n${historyText}\n\nContinue the conversation based on the above context.`;
  }, [enableMultiTurn, conversationHistory, maxHistoryItems]);

  const runSSE = useCallback(
    async (finalInputs: Record<string, any>): Promise<void> => {
      setIsStreaming(true);
      setStreamingContent("");

      abortControllerRef.current = new AbortController();

      const accessToken = await getAccessToken();
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/run-ai-app`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ appSlug: slug, inputs: finalInputs, stream: true }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      let accumulatedText = "";

      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (!reader) throw new Error("No reader available");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          setStreamingContent(buffer);

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setIsStreaming(false);
                continue;
              }
              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "response.output_text.delta" && typeof parsed.delta === "string") {
                  accumulatedText += parsed.delta;
                  setStreamingContent(accumulatedText);
                } else if (parsed.type === "response.completed") {
                  fullResponseRef.current = parsed.response ?? parsed;
                } else if (parsed.type === "error") {
                  throw new Error(parsed.message || parsed.error?.message || "OpenAI streaming error");
                }
              } catch (eventError) {
                // Ignore malformed SSE fragments, but preserve actual Error instances.
                if (eventError instanceof Error && eventError.message !== "Unexpected end of JSON input") {
                  console.warn("[useRunAIApp] stream event parse warning:", eventError.message);
                }
              }
            }
          }
        }

        if (accumulatedText) {
          try {
            setOutput(JSON.parse(accumulatedText));
          } catch {
            setOutput(accumulatedText);
          }
        }

        setStreamingContent(accumulatedText);
      } else {
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const result = data.output ?? data;
        setOutput(result);
        fullResponseRef.current = data;
      }
    },
    [slug]
  );

  const run = useCallback(
    async (inputs: Record<string, any>) => {
      setIsRunning(true);
      setError(null);
      setOutput(null);
      setStreamingContent("");
      setErrorSuggestion(undefined);
      fullResponseRef.current = null;

      const contextPreamble = buildMultiTurnContext();
      const finalInputs = contextPreamble
        ? { ...inputs, _context: contextPreamble }
        : inputs;

      // Use authenticated HTTP/SSE for normal app runs. Browser WebSockets cannot
      // attach the Authorization header used by our Clerk/Supabase integration,
      // so the old WebSocket-first path silently lost user identity.
      const attemptRun = async (): Promise<void> => {
        return runSSE(finalInputs);
      };

      try {
        await attemptRun();

        const finalOutput = fullResponseRef.current?.output ?? output;
        options.onResult?.({
          success: true,
          output: finalOutput,
          metadata: fullResponseRef.current?.metadata ?? {},
        });
      } catch (err: any) {
        const msg =
          err?.message || err?.error || "Failed to run AI app";
        const suggestion = parseErrorSuggestion(msg);

        if (autoRetry && retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          setError(`Attempt ${retryCountRef.current} failed: ${msg}. Retrying...`);

          await new Promise((r) => setTimeout(r, 1000 * retryCountRef.current));
          return run(inputs);
        }

        setError(msg);
        setErrorSuggestion(suggestion);
        options.onError?.(msg);
      } finally {
        setIsRunning(false);
        setIsStreaming(false);
        if (!autoRetry) {
          retryCountRef.current = 0;
        }
      }
    },
    [
      slug,
      options,
      buildMultiTurnContext,
      runSSE,
      parseErrorSuggestion,
      autoRetry,
      maxRetries,
      enableMultiTurn,
      output,
    ]
  );

  const reset = useCallback(() => {
    setOutput(null);
    setError(null);
    setStreamingContent("");
    setErrorSuggestion(undefined);
    fullResponseRef.current = null;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    options.onReset?.();
  }, [options.onReset]);

  return {
    run,
    isRunning,
    output,
    error,
    reset,
    isStreaming,
    streamingContent,
    conversationHistory,
    clearHistory,
    errorSuggestion,
  };
}