import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface PersonalizerDialogProps {
  open: boolean;
  onClose: () => void;
  appId?: string;
  mode?: string;
  userId?: string;
  projectId?: string;
  defaultOffer?: string;
  defaultGoal?: string;
  defaultTone?: string;
  defaultCTA?: string;
  initialTarget?: string;
  onComplete?: (output: any) => void;
  onSave?: (projectId: string) => void;
  theme?: any;
}

const STEPS = [
  { id: 1, name: 'Select App & Mode' },
  { id: 2, name: 'Target Info' },
  { id: 3, name: 'Public Scan (Optional)' },
  { id: 4, name: 'Manual Notes' },
  { id: 5, name: 'Generate' },
  { id: 6, name: 'Output' },
  { id: 7, name: 'Save' },
  { id: 8, name: 'Send to App' }
];

const MODES = [
  { id: 'cold-email', label: 'Cold Email' },
  { id: 'video-email', label: 'Video Email' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'sales-page', label: 'Sales Page' },
  { id: 'thumbnail', label: 'Thumbnail' },
  { id: 'content-campaign', label: 'Content Campaign' },
  { id: 'agency-pitch', label: 'Agency Pitch' },
  { id: 'lead-summary', label: 'Lead Summary' }
];

const APPS = [
  { id: 'videoremix-vip', label: 'VideoRemix.vip' },
  { id: 'sales-assistant-pro', label: 'Sales Assistant Pro' },
  { id: 'proposal-generator', label: 'Proposal Generator' },
  { id: 'sales-page-builder', label: 'Sales Page Builder' },
  { id: 'ai-personalized-content', label: 'AI Personalized Content' },
  { id: 'ai-personalizer', label: 'AI Personalizer' },
  { id: 'ai-video-transformer', label: 'AI Video Transformer' },
  { id: 'ai-screen-recorder', label: 'AI Screen Recorder' },
  { id: 'ai-thumbnail-generator', label: 'AI Thumbnail Generator' },
  { id: 'ai-video-agency', label: 'AI Video Agency' }
];

export default function PersonalizerDialog({
  open,
  onClose,
  appId: initialAppId,
  mode: initialMode,
  userId,
  projectId,
  defaultOffer,
  defaultGoal,
  defaultTone = 'professional',
  defaultCTA,
  initialTarget,
  onComplete,
  onSave,
  theme
}: PersonalizerDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [appId, setAppId] = useState(initialAppId || 'videoremix-vip');
  const [mode, setMode] = useState(initialMode || 'cold-email');
  const [targetName, setTargetName] = useState(initialTarget || '');
  const [targetCompany, setTargetCompany] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (open && projectId) {
      loadProject(projectId);
    }
  }, [open, projectId]);

  const loadProject = async (id: string) => {
    const { data } = await supabase
      .from('personalization_projects')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      setProject(data);
      setAppId(data.app_id);
      setMode(data.mode);
      setTargetName(data.target_name);
      setTargetCompany(data.target_company || '');
      setManualNotes(data.manual_notes || '');
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/personalizer/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ targetName, targetCompany })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setProject((prev: any) => ({ ...prev, scan_id: data.scanId }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/personalizer/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          appId,
          mode,
          targetName,
          targetCompany,
          manualNotes,
          offer: defaultOffer,
          goal: defaultGoal,
          tone: defaultTone,
          cta: defaultCTA
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setOutput(data.output);
      setProject(data.project);
      setCurrentStep(6);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/personalizer/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ projectId: project?.id, output })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSave?.(project?.id);
      setCurrentStep(7);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleNext = () => {
    if (currentStep < 8) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
            <div>
              <h2 className="text-2xl font-bold text-white">AI Creative Personalizer</h2>
              <p className="text-sm text-gray-400">Step {currentStep} of 8 • {STEPS[currentStep - 1].name}</p>
            </div>
            <button onClick={onClose} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Left Sidebar */}
            <div className="w-64 bg-gray-800/50 border-r border-purple-500/20 p-4 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-purple-300 font-semibold text-sm">AI Creative Personalizer</h3>
                <p className="text-xs text-gray-400 mt-1">App: {APPS.find(a => a.id === appId)?.label || appId}</p>
                <p className="text-xs text-gray-400">Mode: {MODES.find(m => m.id === mode)?.label || mode}</p>
              </div>
              <div className="space-y-2">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`p-2 rounded-lg text-sm ${
                      currentStep === step.id
                        ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50'
                        : currentStep > step.id
                        ? 'bg-emerald-600/20 text-emerald-200'
                        : 'bg-gray-700/30 text-gray-400'
                    }`}
                  >
                    {step.id}. {step.name}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-purple-500/20">
                <p className="text-xs text-gray-400">Scan: {project?.scan_id ? 'Complete' : 'Not run'}</p>
                <p className="text-xs text-gray-400">Project: {project?.id ? 'Active' : 'New'}</p>
              </div>
            </div>

            {/* Main Panel */}
            <div className="flex-1 p-6 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Step 1: Select App & Mode */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">App</label>
                    <select
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg p-2 text-white"
                    >
                      {APPS.map(app => (
                        <option key={app.id} value={app.id}>{app.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Mode</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg p-2 text-white"
                    >
                      {MODES.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Target Info */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Target Name</label>
                    <input
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg p-2 text-white"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Target Company</label>
                    <input
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="w-full bg-gray-800/50 border border-purple-500/30 rounded-lg p-2 text-white"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Public Scan */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <p className="text-gray-300">Optional: Scan public profiles for {targetName}</p>
                  <button
                    onClick={handleScan}
                    disabled={isScanning || !targetName}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white flex items-center gap-2"
                  >
                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isScanning ? 'Scanning...' : 'Run Public Scan'}
                  </button>
                  <p className="text-xs text-gray-400">Uses GitHub API only. LinkedIn/Twitter checks coming soon.</p>
                </div>
              )}

              {/* Step 4: Manual Notes */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <label className="block text-sm text-gray-300 mb-1">Manual Notes</label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full h-32 bg-gray-800/50 border border-purple-500/30 rounded-lg p-2 text-white"
                    placeholder="Add any additional context about the target..."
                  />
                </div>
              )}

              {/* Step 5: Generate */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg text-white">Ready to Generate</h3>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-300">Target: {targetName}</p>
                    <p className="text-sm text-gray-300">Mode: {MODES.find(m => m.id === mode)?.label}</p>
                    <p className="text-sm text-gray-300">Tone: {defaultTone}</p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !targetName}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-lg text-white font-semibold flex items-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isGenerating ? 'Generating...' : 'Generate Content'}
                  </button>
                </div>
              )}

              {/* Step 6: Output */}
              {currentStep === 6 && output && (
                <div className="space-y-4">
                  <h3 className="text-lg text-white">Generated Output</h3>
                  <div className="bg-gray-800/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-200 whitespace-pre-wrap">{JSON.stringify(output, null, 2)}</pre>
                  </div>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Save Output
                  </button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded-lg text-white flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                {currentStep < 6 && (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-8 p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-400">
                  *This tool uses public or user-provided information to help generate business-relevant personalization. Results may include possible matches and should be reviewed before use. Do not use this tool for harassment, surveillance, sensitive profiling, or unlawful purposes.
                </p>
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-72 bg-gray-800/50 border-l border-purple-500/20 p-4 overflow-y-auto">
              <h3 className="text-purple-300 font-semibold mb-4">AI Suggestions</h3>
              <div className="space-y-3">
                <button className="w-full p-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm text-purple-200">
                  Refine Tone
                </button>
                <button className="w-full p-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-sm text-purple-200">
                  Add Offer
                </button>
              </div>
              {output && (
                <div className="mt-6 pt-4 border-t border-purple-500/20">
                  <h4 className="text-sm text-gray-300 mb-2">Send to App</h4>
                  <button className="w-full p-2 bg-cyan-600/30 hover:bg-cyan-600/40 rounded-lg text-sm text-cyan-200">
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
