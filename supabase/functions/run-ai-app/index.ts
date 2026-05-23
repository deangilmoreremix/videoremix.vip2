// supabase/functions/run-ai-app/index.ts
// OpenAI Responses API Integration with Streaming & Tool Support
// Supports: web_search_preview, file_search, vision, code_execution, realtime

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAppConfig, type ToolType } from "./app-configs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, upgrade",
};

// Tool definitions for OpenAI Responses API
const TOOL_DEFINITIONS: Record<ToolType, any> = {
  web_search_preview: {
    type: "web_search_preview" as const,
  },
  file_search: {
    type: "file_search" as const,
  },
  vision: {
    type: "vision" as const,
  },
  code_execution: {
    type: "code_execution" as const,
  },
  realtime: {
    type: "realtime" as const,
  },
};

interface RunAIAppRequest {
  appSlug: string;
  inputs: Record<string, any>;
  context?: string;
  userId?: string;
  stream?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.headers.get("upgrade") === "websocket") {
    return handleWebSocket(req);
  }

  try {
    const { appSlug, inputs, context, userId, stream = true }: RunAIAppRequest = await req.json();

    if (!appSlug) {
      return new Response(JSON.stringify({ error: "appSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const config = getAppConfig(appSlug);
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!config || !openaiKey) {
      const fallback = {
        success: true,
        appSlug,
        output: {
          summary: `Demo mode for ${appSlug}. Connect OPENAI_API_KEY and add config for full AI.`,
          message: "Add your OpenAI key in Supabase Edge secrets",
        },
        metadata: { model: "fallback", demo: true, timestamp: new Date().toISOString() },
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build tools array based on app config
    const tools: any[] = [];

    if (config.tools && config.tools.length > 0) {
      for (const toolType of config.tools) {
        if (TOOL_DEFINITIONS[toolType]) {
          tools.push(TOOL_DEFINITIONS[toolType]);
        }
      }
    }

    // Build the input content from user inputs
    let inputContent = "";

    if (context) {
      inputContent += context + "\n\n";
    }

    inputContent += `${config.systemPrompt}\n\n`;

    if (typeof inputs === "object" && inputs !== null) {
      // Add each input as a separate line for clarity
      for (const [key, value] of Object.entries(inputs)) {
        if (value !== undefined && value !== null && value !== "") {
          const formattedValue = typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value);
          inputContent += `\n${key}: ${formattedValue}`;
        }
      }
    } else {
      inputContent += String(inputs);
    }

    // Prepare the request body for Responses API
    const requestBody: any = {
      model: config.model || "gpt-4o-mini",
      input: inputContent,
      stream: stream !== false,
    };

    // Add tools if needed
    if (tools.length > 0) {
      requestBody.tools = tools;
    }

    // Add parsing instructions
    requestBody.instruction = `Return valid JSON matching the expected output structure. No additional text outside JSON. Expected keys: ${config.expectedOutputKeys.join(", ")}`;

    // Make the API call
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      throw new Error(`OpenAI error ${response.status}: ${errText}`);
    }

    // Handle streaming response
    if (stream !== false) {
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        // Return streaming response directly to client
        return new Response(response.body, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      }
    }

    // Non-streaming response processing
    const openaiData = await response.json();

    // Parse output from Responses API format
    let parsedOutput = parseResponseOutput(openaiData);

    const result = {
      success: true,
      appSlug,
      output: parsedOutput,
      metadata: {
        model: openaiData.model || config.model,
        tokensUsed: openaiData.usage?.total_tokens || 0,
        latencyMs: openaiData.latency?.total_ms || 0,
        timestamp: new Date().toISOString(),
        userId: userId || null,
        toolsUsed: config.tools || [],
      },
    };

    // Record usage for billing
    if (userId) {
      const tokensUsed = openaiData.usage?.total_tokens || 0;
      try {
        await supabase.rpc("record_ai_app_run", {
          user_uuid: userId,
          app_slug: appSlug,
          tokens: tokensUsed,
        });
      } catch (usageErr) {
        console.error("Failed to record usage:", usageErr);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("run-ai-app error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleWebSocket(req: Request): Promise<Response> {
  const upgrader = Deno.upgradeWebSocket(req);

  const { socket, response } = upgrader;

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      const { appSlug, inputs, context, userId, stream = true } = data;

      if (!appSlug) {
        socket.send(JSON.stringify({ error: "appSlug is required" }));
        socket.close();
        return;
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const config = getAppConfig(appSlug);
      const openaiKey = Deno.env.get("OPENAI_API_KEY");

      if (!config || !openaiKey) {
        socket.send(JSON.stringify({
          success: true,
          appSlug,
          output: {
            summary: `Demo mode for ${appSlug}. Connect OPENAI_API_KEY and add config for full AI.`,
            message: "Add your OpenAI key in Supabase Edge secrets",
          },
          metadata: { model: "fallback", demo: true, timestamp: new Date().toISOString() },
        }));
        socket.close();
        return;
      }

      const tools: any[] = [];
      if (config.tools && config.tools.length > 0) {
        for (const toolType of config.tools) {
          if (TOOL_DEFINITIONS[toolType]) {
            tools.push(TOOL_DEFINITIONS[toolType]);
          }
        }
      }

      let inputContent = "";
      if (context) {
        inputContent += context + "\n\n";
      }
      inputContent += `${config.systemPrompt}\n\n`;

      if (typeof inputs === "object" && inputs !== null) {
        for (const [key, value] of Object.entries(inputs)) {
          if (value !== undefined && value !== null && value !== "") {
            const formattedValue = typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : String(value);
            inputContent += `\n${key}: ${formattedValue}`;
          }
        }
      } else {
        inputContent += String(inputs);
      }

      const requestBody: any = {
        model: config.model || "gpt-4o-mini",
        input: inputContent,
        stream: stream !== false,
      };

      if (tools.length > 0) {
        requestBody.tools = tools;
      }

      requestBody.instruction = `Return valid JSON matching the expected output structure. No additional text outside JSON. Expected keys: ${config.expectedOutputKeys.join(", ")}`;

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("OpenAI API error:", response.status, errText);
        socket.send(JSON.stringify({ error: `OpenAI error ${response.status}: ${errText}` }));
        socket.close();
        return;
      }

      if (stream !== false && response.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                socket.send(JSON.stringify({ type: "done" }));
              } else {
                socket.send(JSON.stringify({ type: "chunk", data }));
              }
            }
          }
        }

        socket.send(JSON.stringify({ type: "done" }));
      } else {
        const openaiData = await response.json();
        const parsedOutput = parseResponseOutput(openaiData);
        socket.send(JSON.stringify({
          success: true,
          appSlug,
          output: parsedOutput,
          metadata: {
            model: openaiData.model || config.model,
            tokensUsed: openaiData.usage?.total_tokens || 0,
            latencyMs: openaiData.latency?.total_ms || 0,
            timestamp: new Date().toISOString(),
            userId: userId || null,
            toolsUsed: config.tools || [],
          },
        }));
      }

      socket.close();
    } catch (error: any) {
      console.error("WebSocket error:", error);
      socket.send(JSON.stringify({ error: error.message || "Internal error" }));
      socket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket closed");
  };

  return response;
}

/**
 * Parse the OpenAI Responses API output into a structured format
 */
function parseResponseOutput(data: any): any {
  // Handle error responses
  if (data.error) {
    throw new Error(data.error.message || "API Error");
  }

  // Handle output items
  if (data.output && Array.isArray(data.output)) {
    const textParts: string[] = [];
    const toolCalls: any[] = [];
    const outputTexts: any[] = [];

    for (const item of data.output) {
      switch (item.type) {
        case "message":
          if (item.content) {
            for (const content of item.content) {
              if (content.type === "output_text") {
                textParts.push(content.text);
              }
            }
          }
          break;

        case "output_text":
          if (item.text) {
            textParts.push(item.text);
          }
          if (item.annotations) {
            // Include citations/annotations
            outputTexts.push({ type: "text_with_annotations", content: item.text, annotations: item.annotations });
          } else {
            outputTexts.push(item.text);
          }
          break;

        case "function_call":
          toolCalls.push({
            id: item.id,
            name: item.name,
            arguments: item.arguments,
            callId: item.call_id,
          });
          break;

        case "function_call_output":
          toolCalls.push({
            id: item.id,
            output: item.output,
            callId: item.call_id,
          });
          break;

        case "reasoning":
          // If there's reasoning, include it
          if (item.summary) {
            outputTexts.push({ type: "reasoning", content: item.summary });
          }
          break;

        default:
          // Store unknown types
          if (item.text) {
            textParts.push(item.text);
          }
      }
    }

    // If we have tool calls, return them
    if (toolCalls.length > 0) {
      return {
        response: textParts.join("\n"),
        toolCalls: toolCalls,
        usage: "Tool execution completed",
      };
    }

    // If we have text, try to parse as JSON
    const combinedText = textParts.join("\n").trim();

    if (!combinedText) {
      return { message: "No output generated" };
    }

    // Try to parse as JSON
    try {
      return JSON.parse(combinedText);
    } catch {
      // If not valid JSON, return as text content
      return {
        content: combinedText,
        formatted: outputTexts.length > 0 ? outputTexts : undefined,
      };
    }
  }

  // Handle direct output_text
  if (data.output_text) {
    try {
      return JSON.parse(data.output_text);
    } catch {
      return { content: data.output_text };
    }
  }

  // Handle error
  if (data.error) {
    throw new Error(data.error.message || "Unknown error");
  }

  return data;
}