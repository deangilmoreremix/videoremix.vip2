import { GeneratePersonalizationRequest, GeneratePersonalizationResponse, SaveResultsRequest, SaveResultsResponse, ScanProspectRequest, ScanProspectResponse } from './types';

const toJson = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
};

export async function scanProspect(data: ScanProspectRequest): Promise<ScanProspectResponse> {
  const response = await fetch('/api/personalizer/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Scan prospect failed: ${response.status} ${response.statusText}`);
  }
  return toJson(response) as Promise<ScanProspectResponse>;
}

export async function generatePersonalization(data: GeneratePersonalizationRequest): Promise<GeneratePersonalizationResponse> {
  const response = await fetch('/api/personalizer/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Generate personalization failed: ${response.status} ${response.statusText}`);
  }
  return toJson(response) as Promise<GeneratePersonalizationResponse>;
}

export async function generateMedia(data: { appId: string; mode: string; username: string; prompt: string; type: 'image' | 'video' }): Promise<{ url?: string }> {
  const response = await fetch('/api/personalizer/media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Generate media failed: ${response.status} ${response.statusText}`);
  }
  return toJson(response);
}

export async function saveResults(data: SaveResultsRequest): Promise<SaveResultsResponse> {
  const response = await fetch('/api/personalizer/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Save results failed: ${response.status} ${response.statusText}`);
  }
  return toJson(response) as Promise<SaveResultsResponse>;
}
