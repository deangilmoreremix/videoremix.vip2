import { describe, it, expect } from '@jest/globals';
import { appSalesCopy } from '../appSalesCopy';

describe('appSalesCopy', () => {
  it('has sales copy for all 104 apps', () => {
    const appIds = Object.keys(appSalesCopy);
    expect(appIds.length).toBe(104);
  });

  it('each app has required fields', () => {
    Object.entries(appSalesCopy).forEach(([appId, copy]) => {
      expect(copy).toHaveProperty('tonality');
      expect(copy).toHaveProperty('whatItDoes');
      expect(copy).toHaveProperty('howItMakesMoney');
      expect(copy).toHaveProperty('whyBusinessesNeedIt');
      
      // Verify fields are non-empty strings
      expect(typeof copy.tonality).toBe('string');
      expect(copy.tonality.length).toBeGreaterThan(0);
      expect(typeof copy.whatItDoes).toBe('string');
      expect(copy.whatItDoes.length).toBeGreaterThan(0);
      expect(typeof copy.howItMakesMoney).toBe('string');
      expect(copy.howItMakesMoney.length).toBeGreaterThan(0);
      expect(typeof copy.whyBusinessesNeedIt).toBe('string');
      expect(copy.whyBusinessesNeedIt.length).toBeGreaterThan(0);
    });
  });

  it('uses GTM Skills tonalities correctly', () => {
    const validTonalities = ['professional', 'casual', 'enthusiastic', 'authoritative', 'friendly'];
    
    Object.values(appSalesCopy).forEach((copy) => {
      expect(validTonalities).toContain(copy.tonality);
    });
  });

  it('video category apps have appropriate copy', () => {
    const videoApps = ['video-creator', 'promo-generator', 'text-to-speech', 'niche-script', 'video-ai-editor'];
    
    videoApps.forEach((appId) => {
      expect(appSalesCopy[appId]).toBeDefined();
      expect(appSalesCopy[appId].whatItDoes).toContain('video');
    });
  });

  it('AI image apps have appropriate copy', () => {
    const imageApps = ['ai-image-tools', 'ai-art', 'bg-remover', 'ai-headshot-studio'];
    
    imageApps.forEach((appId) => {
      expect(appSalesCopy[appId]).toBeDefined();
      expect(appSalesCopy[appId].whatItDoes.toLowerCase()).toContain('image');
    });
  });

  it('has no duplicate app IDs', () => {
    const appIds = Object.keys(appSalesCopy);
    const uniqueIds = new Set(appIds);
    expect(uniqueIds.size).toBe(appIds.length);
  });
});
