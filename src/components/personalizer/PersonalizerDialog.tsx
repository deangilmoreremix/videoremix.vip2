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
import type { PersonalizationProfile, PlatformProfile, IdentityGraphNode, IdentityGraphEdge, GeneratedAsset, ScanJob, ScanEvent } from '../types/personalization';

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
              <p className="text-sm text-gray-400 font-body">Step {currentStep} of 5 • Mode: {MODES.find(m => m.id === mode)?.label || mode}</p>
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
              </div>
            </div>

            {/* Main Panel with Tabs */}
            <div className="flex-1 p-6 overflow-y-auto font-body">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-gray-800/50">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                  <TabsTrigger value="platforms">Platforms</TabsTrigger>
                  <TabsTrigger value="graph">Graph</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="raw">Raw Data</TabsTrigger>
                </TabsList>

                {error && (
                  <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <TabsContent value="overview" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg text-white font-display">Target Overview</h3>
                    <div className="bg-[#1a1a1a] bg-opacity-50 p-4 rounded-lg border border-white/10">
                      <p className="text-sm text-gray-300 font-body">Name: {targetName || 'Not set'}</p>
                      <p className="text-sm text-gray-300 font-body">Company: {targetCompany || 'Not set'}</p>
                      <p className="text-sm text-gray-300 font-body">Profiles Found: {profiles.length}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="intelligence" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg text-white font-display">Intelligence Insights</h3>
                    {scanJob ? (
                      <p className="text-sm text-gray-300 font-body">Analysis in progress...</p>
                    ) : (
                      <p className="text-sm text-gray-400 font-body">Run a scan to generate intelligence insights.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="platforms" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg text-white font-display">Platform Profiles</h3>
                    {profiles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {profiles.map((profile, index) => (
                          <PlatformCard key={index} profile={profile} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 font-body">No platform profiles found. Run a scan to discover profiles.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="graph" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg text-white font-display">Identity Graph</h3>
                    <IdentityGraphView nodes={graphNodes} edges={graphEdges} />
                  </div>
                </TabsContent>

                <TabsContent value="assets" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg text-white font-display">Generated Assets</h3>
                    {assets.length > 0 ? (
                      <div className="space-y-3">
                        {assets.map((asset) => (
                          <div key={asset.id} className="bg-[#1a1a1a] p-3 rounded-lg border border-white/10">
                            <p className="text-sm font-medium text-white font-body">{asset.title || asset.asset_type}</p>
                            <p className="text-xs text-gray-400 font-body mt-1 line-clamp-2">{asset.content.substring(0, 100)}...</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 font-body">No assets generated yet.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg text-white font-display">Raw Data</h3>
                    {scanJob && (
                      <pre className="text-xs text-gray-300 bg-[#1a1a1a] p-4 rounded-lg max-h-96 overflow-y-auto">
                        {JSON.stringify(scanJob.result_data || {}, null, 2)}
                      </pre>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

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
                {currentStep < 5 && (
                  <Button
                    onClick={handleNext}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>

              {/* Disclaimer */}
              <div className="mt-8 p-3 glass-effect bg-opacity-30 border border-white/10 rounded-lg">
                <p className="text-xs text-gray-400 font-body">
                  *This tool uses public or user-provided information to help generate business-relevant personalization. Results may include possible matches and should be reviewed before use. Do not use this tool for harassment, surveillance, sensitive profiling, or unlawful purposes.
                </p>
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-72 bg-[#1a1a1a] bg-opacity-50 backdrop-blur-md border-l border-white/10 p-4 overflow-y-auto">
              <h3 className="text-accent-secondary font-semibold mb-4 text-sm font-display">Progress</h3>
              <ScanProgressTracker job={scanJob} events={scanEvents} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}