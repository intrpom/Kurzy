/**
 * Utility funkce pro generování thumbnail URL z Bunny.net videí
 */

// Funkce pro generování thumbnail URL z Bunny.net
export function generateBunnyThumbnailUrl(videoId: string, libraryId: string): string {
  if (!videoId || !libraryId) return '';
  
  // Mapování Library ID na Pull Zone ID pro thumbnails
  const libraryToPullZoneMap: { [key: string]: string } = {
    '276140': 'a7c54915-1b0', // Blog videa
    '260909': 'a7c54915-1b0', // Starší blog videa (stejný pull zone)
    '424657': 'a7c54915-1b0', // Kurzy (stejný pull zone)
  };
  
  const pullZoneId = libraryToPullZoneMap[libraryId];
  if (!pullZoneId) {
    console.warn(`Neznámé Library ID: ${libraryId}. Thumbnail nebude k dispozici.`);
    return '';
  }
  
  return `https://vz-${pullZoneId}.b-cdn.net/${videoId}/thumbnail.jpg`;
}

// Funkce pro generování různých velikostí thumbnail
export function generateBunnyThumbnailUrls(videoId: string, libraryId: string) {
  const baseUrl = generateBunnyThumbnailUrl(videoId, libraryId);
  if (!baseUrl) return null;
  
  return {
    small: baseUrl.replace('/thumbnail.jpg', '/thumbnail_320x180.jpg'),
    medium: baseUrl.replace('/thumbnail.jpg', '/thumbnail_640x360.jpg'),
    large: baseUrl.replace('/thumbnail.jpg', '/thumbnail_1280x720.jpg'),
    original: baseUrl,
  };
}
