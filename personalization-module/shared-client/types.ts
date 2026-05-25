export type PersonalizationMode = 'video' | 'email' | 'proposal' | 'crm' | 'creative';

export interface ScanProspectRequest {
  username: string;
  appId: string;
  mode: PersonalizationMode;
}

export interface ScanResultProfile {
  platform: string;
  profileUrl: string;
  status: string;
  confidenceScore?: number;
  title?: string;
  description?: string;
  rawData?: Record<string, any>;
}

export interface ScanProspectResponse {
  scanId: string;
  username: string;
  appId: string;
  mode: PersonalizationMode;
  profiles: ScanResultProfile[];
}

export interface GeneratePersonalizationRequest {
  scanId: string;
  appId: string;
  mode: PersonalizationMode;
  username: string;
  profiles: ScanResultProfile[];
  context?: string;
}

export interface PersonalizationOutput {
  outputType: string;
  title: string;
  content: string;
  modelUsed: string;
}

export interface GeneratePersonalizationResponse {
  scanId: string;
  outputs: PersonalizationOutput[];
}

export interface SaveResultsRequest {
  scanId: string;
  appId: string;
  username: string;
  mode: PersonalizationMode;
  profiles: ScanResultProfile[];
  outputs: PersonalizationOutput[];
}

export interface SaveResultsResponse {
  success: boolean;
  scanId: string;
}
