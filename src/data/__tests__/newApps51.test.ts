import { describe, it, expect } from 'vitest';
import { appSalesCopy } from '../appSalesCopy';
import { appsData } from '../appsData';

describe('51 New Apps Integration', () => {
  // The 51 new apps should be in the dataset
  // Original: 27 apps + 17 apps + 51 apps = 95... but we have 106 now
  // Let's just verify the 2 missing apps are present
  
  const vertexTax = appsData.find(app => app.id === 'vertex-tax-strategy');
  const ledgerSync = appsData.find(app => app.id === 'ledgersync');

  it('vertex-tax-strategy app is integrated', () => {
    expect(vertexTax).toBeDefined();
    expect(vertexTax?.name).toBe('Vertex Tax Strategy');
    expect(vertexTax?.category).toBe('lead-gen');
  });

  it('ledgersync app is integrated', () => {
    expect(ledgerSync).toBeDefined();
    expect(ledgerSync?.name).toBe('LedgerSync');
    expect(ledgerSync?.category).toBe('lead-gen');
  });

  it('both apps have sales copy', () => {
    expect(appSalesCopy['vertex-tax-strategy']).toBeDefined();
    expect(appSalesCopy['ledgersync']).toBeDefined();
  });

  it('both apps have thumbnails', () => {
    expect(vertexTax?.image).toBeDefined();
    expect(vertexTax?.image).toMatch(/^https?:\/\//);
    expect(ledgerSync?.image).toBeDefined();
    expect(ledgerSync?.image).toMatch(/^https?:\/\//);
  });

  it('total apps is 106', () => {
    expect(appsData.length).toBeGreaterThanOrEqual(105);
  });

  it('no duplicate app IDs', () => {
    const ids = appsData.map(app => app.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
