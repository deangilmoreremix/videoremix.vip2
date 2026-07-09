import React, { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { AIAppShell } from "../components/ai/AIAppShell";
import { appsData } from "../data/appsData";
import { isInternalAIApp } from "../config/internalAIApps";
import { getAIAppComponent, isAIAppImplemented } from "../components/ai/apps/registry";
import { useAuth } from "../context/AuthContext";
import { useUserAccess } from "../hooks/useUserAccess";
import { supabase } from "../utils/supabaseClient";
import { ErrorState } from "../components/ai/primitives/ErrorState";
import { ResultPanel } from "../components/ai/ResultPanel";
import PurchaseModal from "../components/PurchaseModal";
import { getEnhancedAppData } from "../data/enhancedAppsData";
import { getAppUrl } from "../config/appUrls";
import { Button } from "../components/ui/button";

type TabType = "input" | "results";

const AIAppRunnerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccessToApp, loading: accessLoading, accessData } = useUserAccess();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const app = appsData.find((a) => a.id === slug);
  const enhancedApp = app ? getEnhancedAppData(slug || "", app) : null;
  const mergedApp = enhancedApp ? { ...enhancedApp, url: enhancedApp.url || getAppUrl(slug || "") } : null;

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
          <p className="mt-2 text-gray-400">This AI app is not available.</p>
          <button onClick={() => navigate("/apps")} className="mt-4 rounded-lg bg-primary-600 px-6 py-2 text-white hover:bg-primary-500">
            Browse all apps
          </button>
        </div>
      </div>
    );
  }

  // ACCESS CONTROL: Block users who haven't paid for this app
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="max-w-md text-center">
          <Lock className="mx-auto h-16 w-16 text-gray-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Sign in and purchase <span className="text-white font-semibold">{mergedApp?.name || slug}</span> to use this AI app.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/signin")} className="bg-primary-600 hover:bg-primary-500">Sign In</Button>
            <Button onClick={() => navigate("/apps")} variant="outline" className="border-gray-700">Browse All Apps</Button>
          </div>
        </div>
      </div>
    );
  }

  const hasAccess = hasAccessToApp(slug);

  // Show loading while checking access
  if (accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
          <div className="max-w-lg text-center p-8">
            <div className="relative mx-auto mb-6 h-24 w-24">
              <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-primary-500/30 flex items-center justify-center">
                <Lock className="h-10 w-10 text-primary-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{mergedApp?.name || slug}</h1>
            <p className="text-gray-400 mb-2">This is a premium AI app. Purchase to unlock the full experience.</p>
            {mergedApp?.description && (
              <p className="text-gray-500 text-sm mb-6">{mergedApp.description}</p>
            )}
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-400" /> What you'll get
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 mt-0.5">✓</span>
                  Full access to {mergedApp?.name || "this app"} with all features
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 mt-0.5">✓</span>
                  Unlimited runs powered by OpenAI
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 mt-0.5">✓</span>
                  Save and download all your results
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 mt-0.5">✓</span>
                  Priority support and future updates
                </li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowPurchaseModal(true)} className="bg-primary-600 hover:bg-primary-500 py-6 px-8 text-lg">
                Unlock for ${mergedApp?.price || 97}
              </Button>
              <Button onClick={() => navigate("/apps")} variant="outline" className="border-gray-700 py-6 px-8 text-lg">
                Browse All Apps
              </Button>
            </div>
          </div>
        </div>
        {showPurchaseModal && (
          <PurchaseModal
            app={{
              id: mergedApp?.id || app.id,
              name: mergedApp?.name || app.name,
              description: mergedApp?.description || app.description || "",
              image: mergedApp?.image || app.image || "",
              icon: mergedApp?.icon || app.icon,
              price: mergedApp?.price || app.price,
              features: mergedApp?.benefits,
            }}
            isOpen={showPurchaseModal}
            onClose={() => setShowPurchaseModal(false)}
          />
        )}
      </>
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
      alert("Run the ai-design-studio first to generate a result, then save.");
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
      appName={mergedApp?.name || app.name}
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
          <span>Running {mergedApp?.name || app.name}… (10-30s) — form inputs are disabled</span>
        </div>
      )}

      <div className="min-h-[400px]">
        {activeTab === "input" ? (
          <>
            <AppComponent
              appId={slug}
              appName={mergedApp?.name || app.name}
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
                <p className="text-sm">Run the ai-design-studio to see results here</p>
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
