import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlatformCard from './PlatformCard';
import IdentityGraphView from './IdentityGraphView';
import ScanProgressTracker from './ScanProgressTracker';
import { calculateConfidence, analyzePersonality } from '../../../personalization-module/shared-client/analysisEngine';
import type { PersonalizationProfile, PlatformProfile, IdentityGraphNode, IdentityGraphEdge, GeneratedAsset, ScanJob, ScanEvent } from '../../types/personalization';

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
  const [output, setOutput] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [scanJob, setScanJob] = useState<ScanJob | null>(null);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [profiles, setProfiles] = useState<PlatformProfile[]>([]);
  const [graphNodes, setGraphNodes] = useState<IdentityGraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<IdentityGraphEdge[]>([]);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

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
      setProfiles(data.profiles || []);
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
      setCurrentStep(5);
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
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
          className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 glass-effect"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white font-display tracking-tight">
                <span className="text-gradient">AI Creative</span> Personalizer
              </h2>
              <p className="text-sm text-gray-400 font-body">Step {currentStep} of 5 • {STEPS[currentStep - 1].name}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Left Sidebar */}
            <div className="w-64 bg-[#1a1a1a] bg-opacity-50 backdrop-blur-md border-r border-white/10 p-4 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-accent-secondary font-semibold text-sm font-display">AI Creative Personalizer</h3>
                <p className="text-xs text-gray-400 mt-1 font-body">App: {APPS.find(a => a.id === appId)?.label || appId}</p>
                <p className="text-xs text-gray-400 font-body">Mode: {MODES.find(m => m.id === mode)?.label || mode}</p>
              </div>
              <div className="space-y-2">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`p-2 rounded-lg text-sm font-body ${
                      currentStep === step.id
                        ? 'bg-primary-600/30 text-primary-200 border border-primary-500/50'
                        : currentStep > step.id
                        ? 'bg-success/20 text-success-200'
                        : 'bg-gray-700/30 text-gray-400'
                    }`}
                  >
                    {step.id}. {step.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Panel */}
            <div className="flex-1 p-6 overflow-y-auto font-body">
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
                    <label className="block text-sm text-gray-300 mb-1 font-body">App</label>
                    <select
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-white font-body focus:border-primary-500 focus:outline-none"
                    >
                      {APPS.map(app => (
                        <option key={app.id} value={app.id}>{app.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1 font-body">Mode</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-white font-body focus:border-primary-500 focus:outline-none"
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
                    <label className="block text-sm text-gray-300 mb-1 font-body">Target Name</label>
                    <Input
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1 font-body">Target Company</label>
                    <Input
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Public Scan */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <p className="text-gray-300 font-body">Optional: Scan public profiles for {targetName}</p>
                  <Button
                    onClick={handleScan}
                    disabled={isScanning || !targetName}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white"
                  >
                    {isScanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isScanning ? 'Scanning...' : 'Run Public Scan'}
                  </Button>
                  <p className="text-xs text-gray-400 font-body">Uses GitHub API. Full Maigret integration coming soon.</p>

                  {profiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm text-gray-300 mb-2 font-body">Found Profiles ({profiles.length})</h4>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {profiles.map((profile, index) => (
                          <PlatformCard key={index} profile={profile} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Manual Notes */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <label className="block text-sm text-gray-300 mb-1 font-body">Manual Notes</label>
                  <Textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500"
                    placeholder="Add any additional context about the target..."
                    rows={6}
                  />
                </div>
              )}

              {/* Step 5: Generate */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg text-white font-display">Ready to Generate</h3>
                  <div className="bg-[#1a1a1a] bg-opacity-50 p-4 rounded-lg border border-white/10">
                    <p className="text-sm text-gray-300 font-body">Target: {targetName}</p>
                    <p className="text-sm text-gray-300 font-body">Mode: {MODES.find(m => m.id === mode)?.label}</p>
                    <p className="text-sm text-gray-300 font-body">Tone: {defaultTone}</p>
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !targetName}
                    className="bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-500 hover:to-primary-700 disabled:bg-gray-600 text-white font-semibold"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isGenerating ? 'Generating...' : 'Generate Content'}
                  </Button>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  variant="secondary"
                  className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 5}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Disclaimer */}
              <div className="mt-8 p-3 glass-effect bg-opacity-30 border border-white/10 rounded-lg">
                <p className="text-xs text-gray-400 font-body">
                  *This tool uses public or user-provided information to help generate business-relevant personalization. Results may include possible matches and should be reviewed before use. Do not use this tool for harassment, surveillance, sensitive profiling, or unlawful purposes.
                </p>
              </div>
            </div>

            {/* Right Panel - Output & Progress */}
            <div className="w-72 bg-[#1a1a1a] bg-opacity-50 backdrop-blur-md border-l border-white/10 p-4 overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-gray-800/50 mb-4">
                  <TabsTrigger value="overview" size="sm">Overview</TabsTrigger>
                  <TabsTrigger value="intelligence" size="sm">Intel</TabsTrigger>
                  <TabsTrigger value="platforms" size="sm">Platforms</TabsTrigger>
                  <TabsTrigger value="graph" size="sm">Graph</TabsTrigger>
                  <TabsTrigger value="assets" size="sm">Assets</TabsTrigger>
                  <TabsTrigger value="raw" size="sm">Raw</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="space-y-2 text-xs">
                    <p className="text-gray-300 font-body">Name: {targetName || 'Not set'}</p>
                    <p className="text-gray-300 font-body">Company: {targetCompany || 'Not set'}</p>
                    <p className="text-gray-300 font-body">Profiles: {profiles.length}</p>
                    <p className="text-gray-300 font-body">Confidence: {calculateConfidence({ platformCount: profiles.length, averageScore: 0.7, completeness: 0.8, recency: 0.9 })}%</p>
                  </div>
                </TabsContent>

                <TabsContent value="intelligence">
                  {profiles.length > 0 ? (
                    <div className="text-xs space-y-2">
                      <p className="text-gray-300 font-body">Analyzing...</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-body">No data to analyze</p>
                  )}
                </TabsContent>

                <TabsContent value="platforms">
                  <ScanProgressTracker job={scanJob} events={scanEvents} />
                </TabsContent>

                <TabsContent value="graph">
                  <IdentityGraphView nodes={graphNodes} edges={graphEdges} />
                </TabsContent>

                <TabsContent value="assets">
                  {assets.length > 0 ? (
                    <div className="space-y-2">
                      {assets.slice(0, 3).map((asset) => (
                        <div key={asset.id} className="bg-gray-800/50 p-2 rounded border border-white/10">
                          <p className="text-xs font-medium text-white font-body">{asset.title || asset.asset_type}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-body">No assets yet</p>
                  )}
                </TabsContent>

                <TabsContent value="raw">
                  {output ? (
                    <pre className="text-xs text-gray-300 max-h-48 overflow-y-auto">
                      {JSON.stringify(output, null, 2).substring(0, 200)}...
                    </pre>
                  ) : (
                    <p className="text-xs text-gray-400 font-body">No output data</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}