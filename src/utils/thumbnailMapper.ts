import { generatedThumbnails } from '../data/generatedThumbnails';

/**
 * Get the local SVG thumbnail path for an app.
 * SVGs are in /public/app-thumbnails/{appId}.svg
 */
function getLocalThumbnailPath(appId: string): string | null {
  // In production, files in /public are served from the root
  return `/app-thumbnails/${appId}.svg`;
}

export function updateAppThumbnails(appsData: any[]) {
  const thumbnailMap = new Map(
    generatedThumbnails.map(img => [img.metadata.appId, img])
  );

  return appsData.map(app => {
    // Priority 1: Use local SVG thumbnail (always available, served from /public)
    const localPath = getLocalThumbnailPath(app.id);
    if (localPath) {
      return {
        ...app,
        image: localPath,
        generatedThumbnail: false,
      };
    }

    // Priority 2: Use AI-generated DALL-E thumbnail from Supabase
    const thumbnail = thumbnailMap.get(app.id);
    if (thumbnail) {
      return {
        ...app,
        image: thumbnail.url,
        thumbnailAlt: thumbnail.alt,
        generatedThumbnail: true,
      };
    }

    // Priority 3: Keep original image
    return app;
  });
}

export function getThumbnailForApp(appId: string) {
  return generatedThumbnails.find(img => img.metadata.appId === appId);
}

export function getThumbnailsByCategory(category: string) {
  return generatedThumbnails.filter(img => img.metadata.category === category);
}

export function validateThumbnailCoverage(appsData: any[]) {
  const thumbnailMap = new Map(
    generatedThumbnails.map(img => [img.metadata.appId, img])
  );

  const coverage = {
    total: appsData.length,
    withThumbnails: 0,
    withoutThumbnails: 0,
    missing: []
  };

  appsData.forEach(app => {
    if (thumbnailMap.has(app.id)) {
      coverage.withThumbnails++;
    } else {
      coverage.withoutThumbnails++;
      coverage.missing.push(app.id);
    }
  });

  return coverage;
}
