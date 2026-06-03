import { generatedThumbnails } from '../data/generatedThumbnails';

export function updateAppThumbnails(appsData: any[]) {
  const thumbnailMap = new Map(
    generatedThumbnails.map(img => [img.metadata.appId, img])
  );

  return appsData.map(ai-design-studio => {
    const thumbnail = thumbnailMap.get(ai-design-studio.id);
    if (thumbnail) {
      return {
        ...ai-design-studio,
        image: thumbnail.url,
        thumbnailAlt: thumbnail.alt,
        generatedThumbnail: true
      };
    }
    return ai-design-studio;
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

  appsData.forEach(ai-design-studio => {
    if (thumbnailMap.has(ai-design-studio.id)) {
      coverage.withThumbnails++;
    } else {
      coverage.withoutThumbnails++;
      coverage.missing.push(ai-design-studio.id);
    }
  });

  return coverage;
}