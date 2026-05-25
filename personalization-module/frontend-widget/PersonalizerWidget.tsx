import React, { useState } from 'react';
import { generatePersonalization, scanProspect, saveResults } from '../shared-client/personalizerClient';
import { PersonalizationMode } from '../shared-client/types';
import PersonalizerResults from './PersonalizerResults';

const modes: PersonalizationMode[] = ['video', 'email', 'proposal', 'crm', 'creative'];

export default function PersonalizerWidget() {
  const [username, setUsername] = useState('');
  const [appId, setAppId] = useState('ai-personalized-content');
  const [mode, setMode] = useState<PersonalizationMode>('video');
  const [scanResult, setScanResult] = useState<any>(null);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setError(null);
    setLoading(true);
    try {
      const scan = await scanProspect({ username, appId, mode });
      setScanResult(scan);
    } catch (err: any) {
      setError(err.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!scanResult) {
      setError('Run prospect scan first');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const generation = await generatePersonalization({
        scanId: scanResult.scanId,
        appId,
        mode,
        username,
        profiles: scanResult.profiles,
      });
      setOutputs(generation.outputs);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scanResult || outputs.length === 0) {
      setError('Scan and generation are required before saving');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await saveResults({
        scanId: scanResult.scanId,
        appId,
        username,
        mode,
        profiles: scanResult.profiles,
        outputs,
      });
      setError('Saved successfully');
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-6 bg-white rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-4">VideoRemix Personalizer</h2>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter the prospect username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">App ID</label>
          <input
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            value={appId}
            onChange={(event) => setAppId(event.target.value)}
            placeholder="Select or type app ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Mode</label>
          <select
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            value={mode}
            onChange={(event) => setMode(event.target.value as PersonalizationMode)}
          >
            {modes.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            className="rounded bg-slate-900 px-4 py-2 text-white"
            onClick={handleScan}
            disabled={loading || !username || !appId}
          >
            Scan Prospect
          </button>
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white"
            onClick={handleGenerate}
            disabled={loading || !scanResult}
          >
            Generate Personalization
          </button>
          <button
            className="rounded bg-green-600 px-4 py-2 text-white"
            onClick={handleSave}
            disabled={loading || outputs.length === 0}
          >
            Save Results
          </button>
        </div>

        {loading && <div className="text-sm text-slate-500">Processing…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {scanResult && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Scan Result</h3>
            <pre className="whitespace-pre-wrap rounded bg-slate-100 p-4 text-sm">{JSON.stringify(scanResult, null, 2)}</pre>
          </div>
        )}

        {outputs.length > 0 && <PersonalizerResults outputs={outputs} />}
      </div>
    </section>
  );
}
