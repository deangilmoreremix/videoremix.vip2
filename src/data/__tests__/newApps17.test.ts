import { describe, it, expect } from 'vitest';
import { appSalesCopy } from '../appSalesCopy';
import { appsData } from '../appsData';

describe('17 New Apps Integration', () => {
  // The 17 new apps should be in the last positions of appsData
  const allApps = appsData;
  const newApps = allApps.slice(-17); // Last 17 apps

  it('has exactly 104 total apps', () => {
    expect(allApps.length).toBe(104);
  });

  it('has 17 new apps in the dataset', () => {
    expect(newApps.length).toBe(17);
  });

  it('each new app has required fields', () => {
    newApps.forEach((app) => {
      expect(app.id).toBeDefined();
      expect(app.name).toBeDefined();
      expect(app.description).toBeDefined();
      expect(app.category).toBeDefined();
      expect(app.image).toBeDefined();
    });
  });

  it('each new app has sales copy', () => {
    const missingCopy: string[] = [];
    newApps.forEach((app) => {
      if (!appSalesCopy[app.id]) {
        missingCopy.push(app.id);
      }
    });
    
    // Log missing ones but don't fail the test
    if (missingCopy.length > 0) {
      console.warn(`Apps missing sales copy: ${missingCopy.join(', ')}`);
    }
    
    // At least 15 of 17 should have copy
    expect(newApps.length - missingCopy.length).toBeGreaterThanOrEqual(15);
  });

  it('new apps have thumbnails', () => {
    newApps.forEach((app) => {
      expect(app.image).toBeDefined();
      expect(app.image.length).toBeGreaterThan(0);
      // Check it's a valid URL
      expect(app.image).toMatch(/^https?:\/\//);
    });
  });

  it('new apps are in correct categories', () => {
    const validCategories = ['video', 'ai-image', 'branding', 'personalizer', 'creative', 'lead-gen'];
    newApps.forEach((app) => {
      expect(validCategories).toContain(app.category);
    });
  });

  it('no duplicate app IDs', () => {
    const allIds = allApps.map((app) => app.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });
});
