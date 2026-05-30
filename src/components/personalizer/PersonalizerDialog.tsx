import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertCircle, Image as ImageIcon, Video, User, Globe, Share2, Brain, FileText, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@supabase/supabase-js';
import PlatformCard from './PlatformCard';
import IdentityGraphView from './IdentityGraphView';
import ScanProgressTracker from './ScanProgressTracker';

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

const OUTPUT_TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
  { id: 'platforms', label: 'Platforms', icon: Globe },
  { id: 'graph', label: 'Graph', icon: GitBranch },
  { id: 'assets', label: 'Assets', icon: ImageIcon },
  { id: 'raw', label: 'Raw Data', icon: FileText }
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
  const [outputTab, setOutputTab] = useState('overview');
  const [appId, setAppId] = useState(initialAppId || 'videoremix-vip');
  const [mode, setMode] = useState(initialMode || 'cold-email');
  const [targetName, setTargetName] = useState(initialTarget || '');
  const [targetCompany, setTargetCompany] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [outputs, setOutputs] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [scanEvents, setScanEvents] = useState<any[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

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
        body: JSON.stringify({ targetName, targetCompany, appId, mode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setScanEvents(prev => [...prev, ...(data.events || [])]);
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
          scanId: jobId || `direct-${Date.now()}`,
          appId,
          mode,
          username: targetName,
          profiles: [],
          context: `${manualNotes}${targetCompany ? `\ncompany: ${targetCompany}` : ''}`,
          tone: defaultTone,
          offer: defaultOffer,
          goal: defaultGoal,
          cta: defaultCTA
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setOutputs(data.outputs || []);
      setProfileData(data.profile || null);
      setCurrentStep(6);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMedia = async (type: 'image' | 'video', prompt: string) => {
    setIsGeneratingMedia(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/personalizer/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          appId,
          mode,
          username: targetName,
          prompt,
          type,
          style: 'professional'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Media generation failed');
      setMediaUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGeneratingMedia(false);
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
        body: JSON.stringify({ outputs, projectId: jobId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSave?.(jobId || '');
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
          className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 glass-effect"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-white font-display tracking-tight">
                <span className="text-gradient">AI Creative</span> Personalizer
              </h2>
              <p className="text-sm text-gray-400 font-body">Step {currentStep} of 8 • {STEPS[currentStep - 1].name}</p>
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

          {/* Output Tabs (when in output step) */}
          {currentStep === 6 && (
            <div className="px-6 pt-4 border-b border-white/10">
              <div className="flex flex-wrap gap-2">
                {OUTPUT_TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setOutputTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                        outputTab === tab.id
                          ? 'bg-primary-600/30 text-primary-200'
                          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

              {/* Step 1-5: Existing flow */}
              {currentStep < 6 && (
                <>
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

                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-1 font-body">Target Name</label>
                        <Input
                          value={targetName}
                          onChange={(e) => setTargetName(e.target.value)}
                          className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500"
                          placeholder="johndoe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-1 font-body">Target Company (Optional)</label>
                        <Input
                          value={targetCompany}
                          onChange={(e) => setTargetCompany(e.target.value)}
                          className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500"
                          placeholder="Acme Inc."
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <p className="text-gray-300 font-body">Optional: Scan public profiles for '{targetName}'</p>
                      <Button
                        onClick={handleScan}
                        disabled={isScanning || !targetName}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white"
                      >
                        {isScanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isScanning ? 'Scanning...' : 'Run Public Scan (GitHub)'}
                      </Button>
                      {scanEvents.length > 0 && (
                        <div className="mt-4">
                          <ScanProgressTracker events={scanEvents} />
                        </div>
                      )}
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <label className="block text-sm text-gray-300 mb-1 font-body">Manual Notes</label>
                      <Textarea
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500"
                        placeholder="Add any additional context about the target..."
                      />
                    </div>
                  )}

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
                        {isGenerating ? 'Generating with GPT-5.5...' : 'Generate Content'}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Step 6: Output with Tabs */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  {outputTab === 'overview' && (
                    <div className="space-y-4">
                      <h3 className="text-lg text-white font-display">Generated Outputs</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {outputs.map((output, idx) => (
                          <div key={idx} className="bg-[#1a1a1a] bg-opacity-50 p-4 rounded-lg border border-white/10">
                            <h4 className="text-sm font-bold text-primary-300 mb-2 font-body">{output.type}</h4>
                            <p className="text-xs text-gray-400 mb-1 font-body">{output.title}</p>
                            <pre className="text-sm text-gray-200 whitespace-pre-wrap font-body line-clamp-4">
                              {output.content}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {outputTab === 'platforms' && (
                    <div className="space-y-4">
                      <h3 className="text-lg text-white font-display">Platform Profiles</h3>
                      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                        {(profileData?.platforms || []).map((platform: any, idx: number) => (
                          <PlatformCard key={platform.id} platform={platform} index={idx} />
                        ))}
                      </div>
                    </div>
                  )}

                  {outputTab === 'graph' && (
                    <div className="space-y-4">
                      <h3 className="text-lg text-white font-display">Identity Graph</h3>
                      <IdentityGraphView nodes={profileData?.graph?.nodes || []} edges={profileData?.graph?.edges || []} />
                    </div>
                  )}

                  {outputTab === 'assets' && (
                    <div className="space-y-4">
                      <h3 className="text-lg text-white font-display">Generate Visual Assets</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleGenerateMedia('image', `Professional headshot for ${targetName}`)}
                          disabled={isGeneratingMedia}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          {isGeneratingMedia ? 'Generating...' : 'Generate Image'}
                        </Button>
                        <Button
                          onClick={() => handleGenerateMedia('video', `Personalized video for ${targetName}`)}
                          disabled={isGeneratingMedia}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          {isGeneratingMedia ? 'Generating...' : 'Generate Video'}
                        </Button>
                      </div>
                      {mediaUrl && (
                        <div className="mt-4">
                          <img src={mediaUrl} alt="Generated" className="max-w-full rounded-lg" />
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    className="bg-success hover:bg-success/90 text-white mt-4"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Output
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
                {currentStep < 6 && (
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
                  *This tool uses public or user-provided information. Do not use for harassment or unlawful purposes.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}