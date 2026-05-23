import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AIAppShell } from "../components/ai/AIAppShell";
import { appsData } from "../data/appsData";
import { isInternalAIApp } from "../config/internalAIApps";
import { getAIAppComponent, isAIAppImplemented } from "../components/ai/apps/registry";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { ErrorState } from "../components/ai/primitives/ErrorState";
import { ResultPanel } from "../components/ai/ResultPanel";

type TabType = "input" | "results";

const AIAppRunnerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const app = appsData.find((a) => a.id === slug);

  const [lastResult, setLastResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("input");
  const [usageData, setUsageData] = useState<{ used: number; limit: number }>({ used: 0, limit: 100 });

  // Fetch real usage on mount (graceful fallback if RPC not available)
  React.useEffect(() => {
    if (user) {
      supabase.rpc("get_ai_app_remaining_runs", { user_uuid: user.id, max_runs: 100 })
        .then(({ data, error }) => {
          if (error) {
            console.warn("Usage tracking not available:", error.message);
            return;
          }
          if (data !== null) {
            const remaining = data as number;
            setUsageData({ used: 100 - remaining, limit: 100 });
          }
        })
        .catch((err) => {
          console.warn("Usage tracking unavailable:", err);
        });
    }
  }, [user]);

  if (!slug || !isInternalAIApp(slug) || !app) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">App not found</h1>
          <p className="mt-2 text-gray-400">This AI app is not available or you don't have access yet.</p>
          <button onClick={() => navigate("/apps")} className="mt-4 rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-500">
            Browse all apps
          </button>
        </div>
      </div>
    );
  }

  const AppComponent = getAIAppComponent(slug);
  const isCustomUI = isAIAppImplemented(slug);

  const handleResult = useCallback((result: any) => {
    setLastResult(result);
    setLastError(null);
    setActiveTab("results");
  }, []);

  const handleError = useCallback((error: string) => {
    setLastError(error);
    // isRunning driven by child
  }, []);

  const handleRunningChange = useCallback((running: boolean) => {
    setIsRunning(running);
  }, []);

  const handleReset = useCallback(() => {
    setLastResult(null);
    setLastError(null);
    setActiveTab("input");
  }, []);

  /**
   * Save to Project
   * Stores result JSON in Supabase Storage at: user-workspaces/{userId}/ai-runs/{slug}/{ts}.json
   *
   * REQUIRED SUPABASE SETUP (see supabase/functions/run-ai-app/STORAGE-SETUP.md):
   * - Create private bucket "user-workspaces"
   * - Add RLS policies allowing authenticated users to manage objects under their own userId folder
   *
   * If bucket/policies are missing, we gracefully fall back to browser download
   * so the 10 Batch 1 apps remain fully usable for demos and early customers.
   */
  const handleSaveToProject = async () => {
    if (!lastResult || !user) {
      alert("Run the app first to generate a result, then save.");
      return;
    }

    const timestamp = Date.now();
    const fileName = `${slug}-${timestamp}.json`;
    const path = `user-workspaces/${user.id}/ai-runs/${slug}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("user-workspaces")
        .upload(path, new Blob([JSON.stringify(lastResult, null, 2)], { type: "application/json" }), {
          contentType: "application/json",
          upsert: true,
        });

      if (uploadError) {
        // Fallback: always allow local download
        console.warn("Storage upload failed (bucket may need creation + RLS):", uploadError);
        downloadResult(lastResult, fileName);
        alert("Saved locally (download). Create 'user-workspaces' bucket in Supabase with private policies for full cloud save.");
        return;
      }

      // Optional: also record metadata row (if table exists)
      // await supabase.from("ai_app_runs").insert({ user_id: user.id, app_slug: slug, storage_path: path, result_summary: ... });

      alert(`✅ Saved to your workspace!\nPath: ${path}\n(Cloud storage ready once bucket + policies are configured)`);
    } catch (e: any) {
      downloadResult(lastResult, fileName);
      alert("Cloud save unavailable — result downloaded locally instead.");
    }
  };

  const handleDownload = () => {
    if (!lastResult) {
      alert("Generate a result first before downloading.");
      return;
    }
    const fileName = `${slug}-result-${Date.now()}.json`;
    downloadResult(lastResult, fileName);
  };

  const downloadResult = (result: any, fileName: string) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AIAppShell
      appName={app.name}
      appSlug={slug}
      onSave={handleSaveToProject}
      onDownload={handleDownload}
      isRunning={isRunning}
      usage={usageData}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      hasResults={!!lastResult}
    >
      <div className="mb-4 flex items-center gap-2 text-xs">
        {isCustomUI ? (
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-400">Enhanced UI • Production Ready</span>
        ) : (
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400">Base Template</span>
        )}
        {lastError && <span className="text-red-400">Last run failed</span>}
      </div>

      {isRunning && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary-900 bg-primary-950/20 px-4 py-2.5 text-sm text-primary-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Running {app.name}… (10-30s) — form inputs are disabled</span>
        </div>
      )}

      <div className="min-h-[400px]">
        {activeTab === "input" ? (
          <>
            <AppComponent
              appId={slug}
              appName={app.name}
              onResult={handleResult}
              onError={handleError}
              onRunningChange={handleRunningChange}
              onReset={handleReset}
            />
            {lastError && <ErrorState error={lastError} />}
          </>
        ) : (
          <div className="space-y-6">
            {lastResult ? (
              <ResultPanel
                result={lastResult}
                onSave={handleSaveToProject}
                appSlug={slug}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <p className="text-lg mb-2">No results yet</p>
                <p className="text-sm">Run the app to see results here</p>
                <button
                  onClick={() => setActiveTab("input")}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                >
                  Go to Input Form
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AIAppShell>
  );
};

export default AIAppRunnerPage;
