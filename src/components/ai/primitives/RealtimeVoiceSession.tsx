/**
 * RealtimeVoiceSession
 *
 * Production-grade live voice component for OpenAI Realtime API via our existing
 * Supabase Edge Function (run-ai-app?mode=realtime). No additional servers required.
 *
 * Features:
 * - Browser mic → 24kHz PCM16 base64 → Edge Function proxy → OpenAI Realtime
 * - OpenAI audio deltas streamed back and played in real time
 * - Live transcript + special json_delta support (our Edge Function parses structured JSON from voice responses)
 * - Speech activity indicators, interruption support, clean connect/disconnect
 * - Fully self-contained (uses only Web Audio API + native WebSocket)
 *
 * Usage in an app:
 *   <RealtimeVoiceSession
 *     appId="ai-intake-voice-agent"
 *     voice="shimmer"
 *     onStructuredResult={(json) => setOutput(json)}
 *     onEnd={() => setVoiceMode(false)}
 *   />
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2, X } from "lucide-react";
import { supabase } from "../../../utils/supabaseClient";
import { Button } from "../../ui/button";

interface RealtimeVoiceSessionProps {
  appId: string;
  voice?: string;
  onStructuredResult?: (result: any) => void;
  onTranscriptUpdate?: (text: string) => void;
  onEnd?: () => void;
  className?: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-ai-app`;

export const RealtimeVoiceSession: React.FC<RealtimeVoiceSessionProps> = ({
  appId,
  voice = "alloy",
  onStructuredResult,
  onTranscriptUpdate,
  onEnd,
  className = "",
}) => {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "listening" | "speaking" | "error">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastJson, setLastJson] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  // Get current access token for authenticated WS connection (query param because browser WS can't set custom headers easily)
  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const stopEverything = useCallback(() => {
    // Close WS
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }

    // Stop mic
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    playQueueRef.current = [];
    isPlayingRef.current = false;

    setStatus("idle");
    setLiveTranscript("");
  }, []);

  const playAudioChunk = useCallback((pcm16: Int16Array) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }

    playQueueRef.current.push(float32);

    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      drainPlayQueue(ctx);
    }
  }, []);

  const drainPlayQueue = (ctx: AudioContext) => {
    if (playQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setStatus("listening");
      return;
    }

    const chunk = playQueueRef.current.shift()!;
    const buffer = ctx.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => drainPlayQueue(ctx);
    source.start();
    setStatus("speaking");
  };

  const connect = async () => {
    if (wsRef.current) return;

    setStatus("connecting");
    setErrorMsg(null);

    const token = await getAccessToken();
    if (!token) {
      setErrorMsg("You must be logged in to use voice mode.");
      setStatus("error");
      return;
    }

    const wsUrl = `${FUNCTION_URL.replace("https://", "wss://")}?mode=realtime&appSlug=${encodeURIComponent(appId)}&voice=${encodeURIComponent(voice)}&access_token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[RealtimeVoice] Connected to Edge Function realtime proxy");
      setStatus("connected");

      // Start microphone immediately
      startMicrophone();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // Our Edge Function forwards a special json_delta when it detects complete JSON in the response text
        if (msg.type === "json_delta" && msg.data) {
          setLastJson(msg.data);
          onStructuredResult?.(msg.data);
          setLiveTranscript(prev => prev + "\n\n[Structured result captured]");
          return;
        }

        // Text deltas for live transcript
        if (msg.type === "response.output_text.delta" || msg.type === "response.text.delta") {
          const delta = msg.delta?.text || msg.text || "";
          if (delta) {
            setLiveTranscript(prev => (prev + delta).slice(-2000));
            onTranscriptUpdate?.(delta);
          }
          return;
        }

        // Audio output from assistant
        if (msg.type === "response.audio.delta" && msg.delta) {
          const b64 = msg.delta;
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

          // Convert to PCM16 Int16Array (little endian)
          const pcm16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
          playAudioChunk(pcm16);
          setStatus("speaking");
          return;
        }

        // Session / speech events (nice UX)
        if (msg.type === "input_audio_buffer.speech_started") {
          setStatus("listening");
        }
        if (msg.type === "response.done") {
          setStatus("listening");
        }
      } catch (e) {
        console.warn("[RealtimeVoice] Non-JSON message or parse error", e);
      }
    };

    ws.onerror = (err) => {
      console.error("[RealtimeVoice] WS error", err);
      setErrorMsg("Connection error. Please try again.");
      setStatus("error");
      stopEverything();
    };

    ws.onclose = () => {
      console.log("[RealtimeVoice] Disconnected");
      stopEverything();
      onEnd?.();
    };
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ScriptProcessor for chunking (works in all modern browsers; AudioWorklet is better but more boilerplate)
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0); // Float32 -1..1

        // Convert to 16-bit PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary);

        wsRef.current.send(JSON.stringify({
          type: "input_audio_buffer.append",
          audio: b64,
        }));
      };

      source.connect(processor);
      processor.connect(ctx.destination); // required to keep the processor running

      setStatus("listening");
    } catch (err: any) {
      console.error("Microphone error:", err);
      setErrorMsg("Microphone access denied or unavailable.");
      setStatus("error");
      stopEverything();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const endSession = () => {
    // Send a commit so the model knows the turn is over
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      // Give the model a moment to finish speaking the final answer
      setTimeout(() => {
        stopEverything();
        if (lastJson && onStructuredResult) {
          onStructuredResult(lastJson);
        }
        onEnd?.();
      }, 800);
    } else {
      stopEverything();
      onEnd?.();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, [stopEverything]);

  return (
    <div className={`rounded-2xl border border-gray-800 bg-[#0a0a0a] p-6 space-y-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/10">
            <Mic className="h-5 w-5 text-primary-400" />
          </div>
          <div>
            <div className="font-semibold text-lg">Live Voice Session</div>
            <div className="text-xs text-gray-500">Powered by OpenAI Realtime via our Edge Function (no extra servers)</div>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={endSession} className="text-gray-400 hover:text-white">
          <X className="mr-1 h-4 w-4" /> End Session
        </Button>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 text-sm">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
          status === "error" ? "bg-red-500/10 text-red-400" :
          status === "speaking" ? "bg-emerald-500/10 text-emerald-400" :
          status === "listening" ? "bg-primary-500/10 text-primary-400" :
          "bg-gray-800 text-gray-400"
        }`}>
          {status === "connecting" && <Loader2 className="h-3 w-3 animate-spin" />}
          {status === "connected" && "Connected — starting mic..."}
          {status === "listening" && "Listening — speak naturally"}
          {status === "speaking" && "AI is speaking"}
          {status === "idle" && "Idle"}
          {status === "error" && "Error"}
        </div>

        {status === "listening" || status === "speaking" ? (
          <Button variant="outline" size="sm" onClick={toggleMute} className="border-gray-700">
            {isMuted ? <VolumeX className="mr-1 h-4 w-4" /> : <Volume2 className="mr-1 h-4 w-4" />}
            {isMuted ? "Unmute Mic" : "Mute Mic"}
          </Button>
        ) : null}
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400">{errorMsg}</div>
      )}

      {/* Big action button when idle */}
      {status === "idle" && (
        <Button
          onClick={connect}
          className="w-full bg-primary-600 hover:bg-primary-500 py-8 text-lg"
        >
          <Mic className="mr-3 h-6 w-6" />
          Start Live Voice Conversation
        </Button>
      )}

      {/* Live transcript / conversation log */}
      {(status !== "idle" || liveTranscript) && (
        <div className="rounded-xl border border-gray-800 bg-black/60 p-4 min-h-[120px] text-sm text-gray-200 whitespace-pre-wrap font-mono">
          {liveTranscript || "Conversation will appear here in real time..."}
        </div>
      )}

      {/* Result capture notice */}
      {lastJson && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
          ✓ Structured result captured from voice. It will be available when you end the session.
        </div>
      )}

      {status === "listening" || status === "speaking" ? (
        <div className="text-center text-xs text-gray-500 pt-2">
          Tip: Speak naturally. The AI follows the app instructions and will try to return structured data at the end.
        </div>
      ) : null}
    </div>
  );
};
