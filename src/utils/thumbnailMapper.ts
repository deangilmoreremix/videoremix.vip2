import { generatedThumbnails } from '../data/generatedThumbnails';

export function updateAppThumbnails(appsData: any[]) {
  const thumbnailMap = new Map(
    generatedThumbnails.map(img => [img.metadata.appId, img])
  );

  return appsData.map(app => {
    const thumbnail = thumbnailMap.get(app.id);
    if (thumbnail) {
      return {
        ...app,
        image: thumbnail.url,
        thumbnailAlt: thumbnail.alt,
        generatedThumbnail: true
      };
    }
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