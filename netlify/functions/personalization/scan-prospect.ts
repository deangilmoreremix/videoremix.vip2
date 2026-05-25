import { Handler } from '@netlify/functions';

interface ScanProspectRequest {
  username: string;
  appId: string;
  mode: string;
}

const workerUrl = process.env.PERSONALIZER_WORKER_URL;
const workerKey = process.env.PERSONALIZER_WORKER_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const body: ScanProspectRequest = JSON.parse(event.body || '{}');
  if (!body.username || !body.appId || !body.mode) {
    return { statusCode: 400, body: JSON.stringify({ error: 'username, appId, and mode are required' }) };
  }

  if (!workerUrl || !workerKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Worker URL or worker key not configured' }) };
  }

  try {
    const workerResponse = await fetch(`${workerUrl}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-key': workerKey,
      },
      body: JSON.stringify({ username: body.username, appId: body.appId, mode: body.mode }),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Worker request failed', details: errorText }) };
    }

    const scanResult = await workerResponse.json();
    return { statusCode: 200, body: JSON.stringify(scanResult) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to scan prospect', details: error.message }) };
  }
};
