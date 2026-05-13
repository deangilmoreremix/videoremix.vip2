import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Loader2, CheckCircle, AlertCircle, Search, Download, Table2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@supabase/supabase-js';
import { safeParseInt } from "../../utils/safeParse";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

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

const TAGS = [
  { id: 'gaming', label: 'Gaming' }, { id: 'coding', label: 'Coding' },
  { id: 'photo', label: 'Photo' }, { id: 'music', label: 'Music' },
  { id: 'blog', label: 'Blog' }, { id: 'finance', label: 'Finance' },
  { id: 'freelance', label: 'Freelance' }, { id: 'dating', label: 'Dating' },
  { id: 'tech', label: 'Tech' }, { id: 'forum', label: 'Forum' },
  { id: 'business', label: 'Business' }, { id: 'shopping', label: 'Shopping' },
  { id: 'sport', label: 'Sport' }, { id: 'hacking', label: 'Hacking' },
  { id: 'art', label: 'Art' }, { id: 'travel', label: 'Travel' },
  { id: 'education', label: 'Education' }, { id: 'science', label: 'Science' },
  { id: 'news', label: 'News' }, { id: 'books', label: 'Books' },
  { id: 'career', label: 'Career' }, { id: 'fashion', label: 'Fashion' }, { id: 'ai', label: 'AI' }
];

const STEPS = [
  { id: 1, name: 'Select App & Mode' }, { id: 2, name: 'Target Info' },
  { id: 3, name: 'Public Scan (Optional)' }, { id: 4, name: 'Manual Notes' },
  { id: 5, name: 'Generate' }, { id: 6, name: 'Output' },
  { id: 7, name: 'Save' }, { id: 8, name: 'Send to App' }
];

const MODES = [
  { id: 'cold-email', label: 'Cold Email' }, { id: 'video-email', label: 'Video Email' },
  { id: 'proposal', label: 'Proposal' }, { id: 'sales-page', label: 'Sales Page' },
  { id: 'thumbnail', label: 'Thumbnail' }, { id: 'content-campaign', label: 'Content Campaign' },
  { id: 'agency-pitch', label: 'Agency Pitch' }, { id: 'lead-summary', label: 'Lead Summary' }
];

const APPS = [
  { id: 'videoremix-vip', label: 'VideoRemix.vip' }, { id: 'sales-assistant-pro', label: 'Sales Assistant Pro' },
  { id: 'proposal-generator', label: 'Proposal Generator' }, { id: 'sales-page-builder', label: 'Sales Page Builder' },
  { id: 'ai-personalized-content', label: 'AI Personalized Content' }, { id: 'ai-personalizer', label: 'AI Personalizer' },
  { id: 'ai-video-transformer', label: 'AI Video Transformer' }, { id: 'ai-screen-recorder', label: 'AI Screen Recorder' },
  { id: 'ai-thumbnail-generator', label: 'AI Thumbnail Generator' }, { id: 'ai-video-agency', label: 'AI Video Agency' }
];

const REPORT_FORMATS = [
  { id: 'html', label: 'HTML Report', extension: '.html', mime: 'text/html' },
  { id: 'json', label: 'JSON Report', extension: '.json', mime: 'application/json' },
  { id: 'markdown', label: 'Markdown Report', extension: '.md', mime: 'text/markdown' },
  { id: 'csv', label: 'CSV Report', extension: '.csv', mime: 'text/csv' },
];

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  'Rate limit exceeded': 'Too many requests. Please wait a minute and try again.',
  'Unauthorized': 'Please sign in to continue.',
  'Invalid or expired token': 'Your session has expired. Please sign in again.',
  'targetName required': 'Please enter a target name.',
  'Scan failed': 'Unable to scan profiles. Please try again.',
  'Generation failed': 'Unable to generate content. Please try again.',
  'Save failed': 'Unable to save. Please try again.',
  'default': 'Something went wrong. Please try again.'
};

function getErrorMessage(error: string): string {
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (error.includes(key)) return message;
  }
  return ERROR_MESSAGES['default'];
}

// Input validation
function validateTargetName(value: string): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 500) return null;
  // Allow letters, numbers, underscores, hyphens, spaces, commas for multiple usernames
  if (!/^[a-zA-Z0-9_\-\s,]+$/.test(trimmed)) return null;
  return trimmed;
}

export default function PersonalizerDialog({
  open, onClose, appId: initialAppId, mode: initialMode, userId, projectId,
  defaultOffer, defaultGoal, defaultTone = 'professional', defaultCTA, initialTarget, onComplete, onSave, theme
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
  const [scanResults, setScanResults] = useState<any>(null);
  const [showResultsView, setShowResultsView] = useState<'table' | 'graph'>('table');
  const [topSites, setTopSites] = useState(500);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  const [enablePermutations, setEnablePermutations] = useState(false);
  const [disableRecursive, setDisableRecursive] = useState(false);
  const [disableParsing, setDisableParsing] = useState(false);
  const [withDomains, setWithDomains] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // AbortControllers for cancelling requests
  const scanAbortRef = useRef<AbortController | null>(null);
  const generateAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open && projectId) loadProject(projectId);
    // Cleanup on unmount or close
    return () => {
      scanAbortRef.current?.abort();
      generateAbortRef.current?.abort();
    };
  }, [open, projectId]);

  const loadProject = async (id: string) => {
    try {
      const { data, error } = await supabase.from('personalization_projects').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setProject(data);
        setAppId(data.app_id);
        setMode(data.mode);
        setTargetName(data.target_name);
        setTargetCompany(data.target_company || '');
        setManualNotes(data.manual_notes || '');
      }
    } catch (err: any) {
      setError(getErrorMessage(err.message || 'default'));
    }
  };

  const downloadReport = (format: string) => {
    if (!scanResults) return;
    const platforms = scanResults.platforms || [];
    let content = '';
    let filename = `maigret_report_${targetName}_${new Date().toISOString().split('T')[0]}`;
    let mimeType = 'text/plain';

    switch (format) {
      case 'json':
        content = JSON.stringify(scanResults, null, 2);
        filename += '.json';
        mimeType = 'application/json';
        break;
      case 'csv': {
        const headers = ['Platform', 'URL', 'Status', 'Rank', 'HTTP Status'];
        const rows = platforms.map((p: any) => [p.platform || '', p.url || '', p.exists ? 'Found' : 'Not Found', p.rank || '', p.http_status || '']);
        content = [headers, ...rows].map(r => r.map((c: string) => `"${c}"`).join(',')).join('\n');
        filename += '.csv';
        mimeType = 'text/csv';
        break;
      }
      case 'html':
        content = `<!DOCTYPE html><html><head><title>Maigret Report - ${targetName}</title>
<style>body{font-family:system-ui;max-width:1200px;margin:0 auto;padding:20px;background:#0a0a0a;color:#e0e0e0}h1{color:#6366f1}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:12px;text-align:left;border-bottom:1px solid #333}th{background:#1a1a1a;color:#8b5cf6}tr:hover{background:#111}.summary{background:#1a1a1a;padding:20px;border-radius:8px;margin:20px 0}.badge{display:inline-block;padding:4px 8px;border-radius:4px;font-size:12px}.badge-success{background:#10b981;color:white}.badge-warning{background:#f59e0b;color:white}</style></head>
<body><h1>Maigret Report: ${targetName}</h1><div class="summary"><p>${scanResults.summary || 'No summary'}</p><p>Confidence: ${Math.round((scanResults.confidence || 0) * 100)}% | Platforms: ${platforms.length}</p></div><h2>Results</h2><table><thead><tr><th>Platform</th><th>URL</th><th>Status</th><th>Rank</th><th>HTTP</th></tr></thead><tbody>${platforms.map((p: any) => `<tr><td>${p.platform || 'Unknown'}</td><td>${p.url ? `<a href="${p.url}">${p.url}</a>` : 'N/A'}</td><td><span class="badge ${p.exists ? 'badge-success' : 'badge-warning'}">${p.exists ? 'Found' : 'Not Found'}</span></td><td>${p.rank || 'N/A'}</td><td>${p.http_status || 'N/A'}</td></tr>`).join('')}</tbody></table><footer style="margin-top:40px;color:#666">Generated by Maigret - https://github.com/soxoj/maigret</footer></body></html>`;
        filename += '.html';
        mimeType = 'text/html';
        break;
      case 'markdown':
        content = `# Maigret Report: ${targetName}\n\nGenerated: ${new Date().toLocaleString()}\n\n## Summary\n${scanResults.summary || 'No summary'}\n\n- **Confidence:** ${Math.round((scanResults.confidence || 0) * 100)}%\n- **Platforms Found:** ${platforms.length}\n\n## Results\n\n| Platform | URL | Status | Rank | HTTP |\n|----------|-----|--------|------|------|\n${platforms.map((p: any) => `| ${p.platform || 'Unknown'} | ${p.url || 'N/A'} | ${p.exists ? 'Found' : 'Not Found'} | ${p.rank || 'N/A'} | ${p.http_status || 'N/A'} |`).join('\n')}\n\n---\nGenerated by Maigret - https://github.com/soxoj/maigret`;
        filename += '.md';
        mimeType = 'text/markdown';
        break;
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleScan = async () => {
    const validatedName = validateTargetName(targetName);
    if (!validatedName) {
      setError('Please enter a valid target name (letters, numbers, spaces, commas only, max 500 chars)');
      return;
    }

    scanAbortRef.current = new AbortController();
    setIsScanning(true);
    setError('');
    setScanProgress(0);
    const interval = setInterval(() => setScanProgress(prev => Math.min(prev + 5, 95)), 200);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');

      const res = await fetch('/api/personalizer/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetName: validatedName,
          targetCompany,
          options: { topSites, tags: selectedTags, excludedTags, enablePermutations, disableRecursive, disableParsing, withDomains }
        }),
        signal: scanAbortRef.current.signal
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');

      setScanResults(data.scanData);
      setProject((prev: any) => ({ ...prev, scan_id: data.scanId }));
      setScanProgress(100);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(getErrorMessage(err.message || 'default'));
      }
    } finally {
      clearInterval(interval);
      setIsScanning(false);
      scanAbortRef.current = null;
    }
  };

  const handleGenerate = async () => {
    const validatedName = validateTargetName(targetName);
    if (!validatedName) {
      setError('Please enter a valid target name');
      return;
    }

    generateAbortRef.current = new AbortController();
    setIsGenerating(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');

      const res = await fetch('/api/personalizer/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          appId, mode, targetName: validatedName, targetCompany,
          manualNotes, offer: defaultOffer, goal: defaultGoal,
          tone: defaultTone, cta: defaultCTA, scanResults
        }),
        signal: generateAbortRef.current.signal
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setOutput(data.output);
      setProject(data.project);
      setCurrentStep(6);
      onComplete?.(data.output);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(getErrorMessage(err.message || 'default'));
      }
    } finally {
      setIsGenerating(false);
      generateAbortRef.current = null;
    }
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Unauthorized');

      const res = await fetch('/api/personalizer/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ projectId: project?.id, output })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      onSave?.(project?.id);
      setCurrentStep(7);
    } catch (err: any) {
      setError(getErrorMessage(err.message || 'default'));
    }
  };

  const handleTagClick = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
      setExcludedTags([...excludedTags, tagId]);
    } else if (excludedTags.includes(tagId)) {
      setExcludedTags(excludedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 glass-effect" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div><h2 className="text-2xl font-bold text-white font-display tracking-tight"><span className="text-gradient">AI Creative</span> Personalizer</h2><p className="text-sm text-gray-400 font-body">Step {currentStep} of 8 • {STEPS[currentStep - 1].name}</p></div>
            <Button variant="ghost" size="icon" onClick={onClose} className="bg-black/50 hover:bg-black/70 text-white rounded-full"><X className="h-5 w-5" /></Button>
          </div>
          <div className="flex h-[calc(90vh-80px)]">
            <div className="w-64 bg-[#1a1a1a] bg-opacity-50 backdrop-blur-md border-r border-white/10 p-4 overflow-y-auto">
              <div className="mb-6"><h3 className="text-accent-secondary font-semibold text-sm font-display">AI Creative Personalizer</h3><p className="text-xs text-gray-400 mt-1 font-body">App: {APPS.find(a => a.id === appId)?.label || appId}</p><p className="text-xs text-gray-400 font-body">Mode: {MODES.find(m => m.id === mode)?.label || mode}</p></div>
              <div className="space-y-2">{STEPS.map((step) => (<div key={step.id} className={`p-2 rounded-lg text-sm font-body ${currentStep === step.id ? 'bg-primary-600/30 text-primary-200 border border-primary-500/50' : currentStep > step.id ? 'bg-success/20 text-success-200' : 'bg-gray-700/30 text-gray-400'}`}>{step.id}. {step.name}</div>))}</div>
              <div className="mt-6 pt-4 border-t border-white/10"><p className="text-xs text-gray-400 font-body">Scan: {project?.scan_id ? 'Complete' : 'Not run'}</p><p className="text-xs text-gray-400 font-body">Project: {project?.id ? 'Active' : 'New'}</p></div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto font-body">
              {error && (<div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>)}

              {currentStep === 1 && (<div className="space-y-4"><div><label className="block text-sm text-gray-300 mb-1">App</label><select value={appId} onChange={(e) => setAppId(e.target.value)} className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-white font-body focus:border-primary-500 focus:outline-none">{APPS.map(app => (<option key={app.id} value={app.id}>{app.label}</option>))}</select></div><div><label className="block text-sm text-gray-300 mb-1">Mode</label><select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2 text-white font-body focus:border-primary-500 focus:outline-none">{MODES.map(m => (<option key={m.id} value={m.id}>{m.label}</option>))}</select></div></div>)}
              {currentStep === 2 && (<div className="space-y-4"><div><label className="block text-sm text-gray-300 mb-1">Target Name(s)</label><Textarea value={targetName} onChange={(e) => setTargetName(e.target.value)} className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500" placeholder="Enter one or more usernames (separated by spaces or commas)..." /><p className="text-xs text-gray-400 mt-1">Multiple usernames will be scanned recursively</p></div><div><label className="block text-sm text-gray-300 mb-1">Target Company</label><Input value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500" placeholder="Acme Inc." /></div></div>)}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <p className="text-gray-300 font-body">Public profile scan using Maigret engine</p>
                  <div className="bg-[#1a1a1a] bg-opacity-50 p-4 rounded-lg border border-white/10">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><label className="block text-sm text-gray-300 mb-1">Number of Sites</label><Input type="number" value={topSites} onChange={(e) => setTopSites(Math.min(safeParseInt(e.target.value, 500), 10000))} className="bg-gray-900/50 border-white/10 text-white" min={1} max={10000} /></div>
                      <div><label className="block text-sm text-gray-300 mb-1">Timeout (seconds)</label><Input type="number" defaultValue={30} className="bg-gray-900/50 border-white/10 text-white" /></div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={enablePermutations} onChange={(e) => setEnablePermutations(e.target.checked)} className="rounded border-white/10" />Enable username permutations</label>
                      <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={disableRecursive} onChange={(e) => setDisableRecursive(e.target.checked)} className="rounded border-white/10" />Disable recursive search</label>
                      <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={disableParsing} onChange={(e) => setDisableParsing(e.target.checked)} className="rounded border-white/10" />Disable information extraction</label>
                      <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={withDomains} onChange={(e) => setWithDomains(e.target.checked)} className="rounded border-white/10" />Check domains</label>
                    </div>
                  </div>
                  <div><label className="block text-sm text-gray-300 mb-2">Tags (click to cycle: include → exclude → neutral)</label><div className="flex flex-wrap gap-2 mb-2"><span className="inline-block w-3 h-3 bg-success rounded-full"></span><span className="text-xs text-gray-400">Included (whitelist)</span><span className="inline-block w-3 h-3 bg-gray-700 rounded-full"></span><span className="text-xs text-gray-400">Excluded (blacklist)</span><span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span><span className="text-xs text-gray-400">Neutral</span></div><div className="flex flex-wrap gap-2">{TAGS.map(tag => { const isIncluded = selectedTags.includes(tag.id); const isExcluded = excludedTags.includes(tag.id); return (<button key={tag.id} onClick={() => handleTagClick(tag.id)} className={`px-3 py-1 rounded-full text-xs transition-all ${isIncluded ? 'bg-success text-white' : isExcluded ? 'bg-gray-700 text-gray-400 line-through' : 'bg-red-500/20 text-red-200 hover:bg-red-500/30'}`}>{tag.label}</button>); })}</div></div>
                  {isScanning && (<div className="bg-[#1a1a1a] bg-opacity-50 p-4 rounded-lg border border-white/10"><div className="flex items-center gap-3 mb-2"><Loader2 className="h-4 w-4 animate-spin text-primary-400" /><span className="text-sm text-gray-300">Scanning public profiles...</span></div><div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} /></div><p className="text-xs text-gray-400 mt-2">Checking {topSites} sites...</p></div>)}
                  {scanResults && scanResults.platforms && (
                    <div className="space-y-4">
                      <div className="bg-[#1a1a1a] bg-opacity-50 p-4 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-4"><h4 className="text-white font-semibold font-display">Scan Results</h4><div className="flex gap-2"><Button variant={showResultsView === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setShowResultsView('table')} className="text-xs"><Table2 className="h-3 w-3 mr-1" /> Table</Button><Button variant={showResultsView === 'graph' ? 'default' : 'ghost'} size="sm" onClick={() => setShowResultsView('graph')} className="text-xs"><BarChart3 className="h-3 w-3 mr-1" /> Graph</Button></div></div>
                        <div className="grid grid-cols-3 gap-4 mb-4"><div className="bg-gray-800/50 p-3 rounded-lg"><p className="text-xs text-gray-400">Platforms Found</p><p className="text-2xl font-bold text-primary-400">{scanResults.platforms.length}</p></div><div className="bg-gray-800/50 p-3 rounded-lg"><p className="text-xs text-gray-400">Confidence</p><p className="text-2xl font-bold text-accent-400">{Math.round((scanResults.confidence || 0) * 100)}%</p></div><div className="bg-gray-800/50 p-3 rounded-lg"><p className="text-xs text-gray-400">Summary</p><p className="text-sm text-gray-300 line-clamp-2">{scanResults.summary}</p></div></div>
                        {showResultsView === 'table' && (<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-white/10"><th className="text-left p-2 text-gray-400">Platform</th><th className="text-left p-2 text-gray-400">URL</th><th className="text-left p-2 text-gray-400">Status</th><th className="text-left p-2 text-gray-400">Rank</th><th className="text-left p-2 text-gray-400">HTTP</th></tr></thead><tbody>{scanResults.platforms.map((p: any, i: number) => (<tr key={i} className="border-b border-white/5 hover:bg-white/5"><td className="p-2 text-white">{p.platform || 'Unknown'}</td><td className="p-2 text-primary-400">{p.url ? <a href={p.url} target="_blank" rel="noopener" className="hover:underline">{p.url}</a> : 'N/A'}</td><td className="p-2"><span className={`px-2 py-1 rounded text-xs ${p.exists ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>{p.exists ? 'Found' : 'Not Found'}</span></td><td className="p-2 text-gray-400">{p.rank || 'N/A'}</td><td className="p-2 text-gray-400">{p.http_status || 'N/A'}</td></tr>))}</tbody></table></div>)}
                        {showResultsView === 'graph' && (<div className="bg-gray-800/50 p-4 rounded-lg min-h-64"><div className="flex flex-wrap gap-4 justify-center"><div className="flex flex-col items-center"><div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">@{targetName.split(',')[0]}</div><p className="text-xs text-gray-400 mt-1">Target</p></div>{scanResults.platforms.slice(0, 12).map((p: any, i: number) => (<div key={i} className="flex flex-col items-center"><div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs ${p.exists ? 'bg-success' : 'bg-warning'}`}>{p.platform?.charAt(0) || '?'}</div><p className="text-xs text-gray-400 mt-1 truncate max-w-16">{p.platform || 'Unknown'}</p></div>))}</div>{scanResults.platforms.length > 12 && <p className="text-xs text-gray-500 text-center mt-4">+{scanResults.platforms.length - 12} more platforms</p>}</div>)}
                        <div className="mt-4 pt-4 border-t border-white/10"><h5 className="text-sm text-gray-300 mb-2 font-display flex items-center gap-2"><Download className="h-4 w-4" /> Download Reports</h5><div className="flex flex-wrap gap-2">{REPORT_FORMATS.map((format) => (<Button key={format.id} variant="outline" size="sm" onClick={() => downloadReport(format.id)} className="text-xs">{format.label}</Button>))}</div></div>
                      </div>
                    </div>
                  )}
                  <Button onClick={handleScan} disabled={isScanning || !targetName} className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white">{isScanning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}{isScanning ? 'Scanning...' : 'Run Public Scan'}</Button>
                </div>
              )}
              {currentStep === 4 && (<div className="space-y-4"><label className="block text-sm text-gray-300 mb-1 font-body">Manual Notes</label><Textarea value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} className="bg-gray-900/50 border-white/10 text-white placeholder-gray-400 focus:border-primary-500 h-32" placeholder="Add any additional context about the target..." /></div>)}
              {currentStep === 5 && (<div className="space-y-4"><h3 className="text-lg text-white font-display">Ready to Generate</h3><div className="bg-[#1a1a1a] bg-opacity-50 p-4 rounded-lg border border-white/10"><p className="text-sm text-gray-300 font-body">Target: {targetName}</p><p className="text-sm text-gray-300 font-body">Mode: {MODES.find(m => m.id === mode)?.label}</p><p className="text-sm text-gray-300 font-body">Tone: {defaultTone}</p><p className="text-sm text-gray-300 font-body">Scan: {scanResults ? 'Complete' : 'Not run'}</p></div><Button onClick={handleGenerate} disabled={isGenerating || !targetName} className="bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-500 hover:to-primary-700 disabled:bg-gray-600 text-white font-semibold">{isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{isGenerating ? 'Generating...' : 'Generate Content'}</Button></div>)}
              {currentStep === 6 && output && (<div className="space-y-4"><h3 className="text-lg text-white font-display">Generated Output</h3><div className="bg-[#1a1a1a] bg-opacity-50 p-4 rounded-lg max-h-96 overflow-y-auto border border-white/10"><pre className="text-sm text-gray-200 whitespace-pre-wrap font-body">{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</pre></div><div className="flex gap-2"><Button onClick={handleSave} className="bg-success hover:bg-success/90 text-white"><CheckCircle className="h-4 w-4 mr-2" />Save Output</Button><Button variant="outline" onClick={() => { navigator.clipboard.writeText(typeof output === 'string' ? output : JSON.stringify(output, null, 2)); }}>Copy to Clipboard</Button></div></div>)}
              <div className="flex justify-between mt-6"><Button onClick={handleBack} disabled={currentStep === 1} variant="secondary" className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white">Back</Button>{currentStep < 6 && (<Button onClick={handleNext} className="bg-primary-600 hover:bg-primary-700 text-white">Next</Button>)}</div>
              <div className="mt-8 p-3 glass-effect bg-opacity-30 border border-white/10 rounded-lg"><p className="text-xs text-gray-400 font-body">*This tool uses public or user-provided information to help generate business-relevant personalization. Results may include possible matches and should be reviewed before use. Do not use this tool for harassment, surveillance, sensitive profiling, or unlawful purposes.</p></div>
            </div>
            <div className="w-72 bg-[#1a1a1a] bg-opacity-50 backdrop-blur-md border-l border-white/10 p-4 overflow-y-auto">
              <h3 className="text-accent-secondary font-semibold mb-4 text-sm font-display">AI Suggestions</h3>
              <div className="space-y-3"><Button variant="ghost" className="w-full p-2 bg-primary-600/20 hover:bg-primary-600/30 text-sm text-primary-200 justify-start">Refine Tone</Button><Button variant="ghost" className="w-full p-2 bg-primary-600/20 hover:bg-primary-600/30 text-sm text-primary-200 justify-start">Add Offer</Button></div>
              {output && (<div className="mt-6 pt-4 border-t border-white/10"><h4 className="text-sm text-gray-300 mb-2 font-body">Send to App</h4><Button variant="ghost" className="w-full p-2 bg-accent/30 hover:bg-accent/40 text-sm text-accent-200 justify-start" onClick={() => { navigator.clipboard.writeText(typeof output === 'string' ? output : JSON.stringify(output, null, 2)); }}>Copy to Clipboard</Button></div>)}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
