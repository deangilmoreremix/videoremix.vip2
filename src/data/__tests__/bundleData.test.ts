import { describe, it, expect } from 'vitest';
import {
  bundles,
  getBundleApps,
  getBundleForApp,
  getTotalAppCount,
  getAllBundleIds,
  getBundleById,
  getBundlesByCategory,
} from '../bundleData';

describe('bundleData helpers', () => {
  describe('getBundleApps', () => {
    it('returns correct 10 app slugs for sales-lead-gen-bundle', () => {
      const apps = getBundleApps('sales-lead-gen-bundle');
      expect(apps).toHaveLength(10);
      expect(apps).toContain('ai-sales-intelligence-pro');
      expect(apps).toContain('lead-research-scraper-ai');
      expect(apps).toContain('ai-business-growth-consultant');
      expect(apps).toContain('ai-strategy-advisor');
      expect(apps).toContain('ai-sales-email-writer');
      expect(apps).toContain('ai-offer-decision-helper');
      expect(apps).toContain('launch-campaign-builder-ai');
      expect(apps).toContain('competitor-spy-ai');
      expect(apps).toContain('ai-agency-builder-suite');
      expect(apps).toContain('sales-call-follow-up-ai');
    });

    it('returns empty array for invalid bundleId', () => {
      const apps = getBundleApps('nonexistent-bundle');
      expect(apps).toEqual([]);
    });
  });

  describe('getBundleForApp', () => {
    it('returns correct bundle for ai-sales-intelligence-pro', () => {
      const bundle = getBundleForApp('ai-sales-intelligence-pro');
      expect(bundle).toBeDefined();
      expect(bundle?.id).toBe('sales-lead-gen-bundle');
      expect(bundle?.name).toBe('Sales, Lead Gen & Prospecting Bundle');
    });

    it('returns undefined for app not in any bundle', () => {
      const bundle = getBundleForApp('nonexistent-app');
      expect(bundle).toBeUndefined();
    });

    it('correctly identifies bundle for app in content-marketing bundle', () => {
      const bundle = getBundleForApp('ai-content-creator-pro');
      expect(bundle).toBeDefined();
      expect(bundle?.id).toBe('content-marketing-bundle');
    });

    it('correctly identifies bundle for app in coding-developer bundle', () => {
      const bundle = getBundleForApp('ai-code-review-pro');
      expect(bundle).toBeDefined();
      expect(bundle?.id).toBe('coding-developer-bundle');
    });
  });

  describe('getTotalAppCount', () => {
    it('returns correct count of unique apps from all bundles', () => {
      const total = getTotalAppCount();
      // Based on bundleData.ts: 95 unique apps across 12 bundles
      expect(total).toBe(95);
    });
  });

  describe('getAllBundleIds', () => {
    it('returns all 12 bundle IDs', () => {
      const ids = getAllBundleIds();
      expect(ids).toHaveLength(12);
      expect(ids).toContain('sales-lead-gen-bundle');
      expect(ids).toContain('content-marketing-bundle');
      expect(ids).toContain('video-audio-voice-bundle');
      expect(ids).toContain('rag-knowledgebase-bundle');
      expect(ids).toContain('realestate-local-bundle');
      expect(ids).toContain('hr-hiring-bundle');
      expect(ids).toContain('finance-business-bundle');
      expect(ids).toContain('legal-compliance-bundle');
      expect(ids).toContain('coding-developer-bundle');
      expect(ids).toContain('design-uiux-bundle');
      expect(ids).toContain('research-education-bundle');
      expect(ids).toContain('productivity-personal-bundle');
    });
  });

  describe('getBundleById', () => {
    it('returns bundle for valid id', () => {
      const bundle = getBundleById('sales-lead-gen-bundle');
      expect(bundle).toBeDefined();
      expect(bundle?.name).toContain('Sales');
    });

    it('returns undefined for invalid id', () => {
      const bundle = getBundleById('invalid');
      expect(bundle).toBeUndefined();
    });
  });

  describe('getBundlesByCategory', () => {
    it('returns bundles for valid category', () => {
      const result = getBundlesByCategory('sales-lead-gen');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sales-lead-gen-bundle');
    });

    it('returns empty array for invalid category', () => {
      const result = getBundlesByCategory('invalid-category');
      expect(result).toEqual([]);
    });
  });

  describe('bundle app count verification', () => {
    it('each bundle has expected app count', () => {
      const expectedCounts: Record<string, number> = {
        'sales-lead-gen-bundle': 10,
        'content-marketing-bundle': 10,
        'video-audio-voice-bundle': 9,
        'rag-knowledgebase-bundle': 13,
        'realestate-local-bundle': 7,
        'hr-hiring-bundle': 6,
        'finance-business-bundle': 7,
        'legal-compliance-bundle': 6,
        'coding-developer-bundle': 10,
        'design-uiux-bundle': 6,
        'research-education-bundle': 8,
        'productivity-personal-bundle': 9,
      };

      Object.entries(expectedCounts).forEach(([bundleId, expectedCount]) => {
        const bundle = getBundleById(bundleId);
        expect(bundle).toBeDefined();
        expect(bundle!.apps.length).toBe(expectedCount);
      });
    });
  });
});
