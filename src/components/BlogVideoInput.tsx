'use client';

import { useState, useEffect } from 'react';
import { FiVideo, FiExternalLink, FiInfo } from 'react-icons/fi';

interface BlogVideoInputProps {
  initialVideoUrl?: string;
  initialLibraryId?: string;
  onVideoChange: (data: { videoUrl: string; videoLibraryId: string; thumbnailUrl?: string }) => void;
}

// Funkce pro extrakci ID videa z URL
function extractVideoId(url: string): string {
  if (!url) return '';
  
  // Pokud URL již obsahuje pouze ID (UUID formát), vrátíme ho přímo
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url)) {
    return url;
  }
  
  // Direct Play URL: https://iframe.mediadelivery.net/play/276140/16da5a72-631a-4e7e-9b72-a4c8920e6f42
  const directPlayMatch = url.match(/\/play\/\d+\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (directPlayMatch) return directPlayMatch[1];
  
  // Embed URL: https://iframe.mediadelivery.net/embed/276140/16da5a72-631a-4e7e-9b72-a4c8920e6f42
  const embedMatch = url.match(/\/embed\/\d+\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (embedMatch) return embedMatch[1];
  
  // HLS Playlist URL: https://vz-a7c54915-1b0.b-cdn.net/16da5a72-631a-4e7e-9b72-a4c8920e6f42/playlist.m3u8
  const hlsMatch = url.match(/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/playlist\.m3u8/i);
  if (hlsMatch) return hlsMatch[1];
  
  // Obecný případ - hledáme UUID kdekoliv v URL
  const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) return uuidMatch[1];
  
  return '';
}

// Funkce pro generování thumbnail URL z Bunny.net
function generateThumbnailUrl(videoId: string, libraryId: string): string {
  if (!videoId || !libraryId) return '';
  
  // Mapování Library ID na Pull Zone ID pro thumbnails
  const libraryToPullZoneMap: { [key: string]: string } = {
    '276140': 'a7c54915-1b0', // Blog videa
    '424657': 'a7c54915-1b0', // Kurzy (stejný pull zone)
  };
  
  const pullZoneId = libraryToPullZoneMap[libraryId];
  if (!pullZoneId) {
    console.warn(`Neznámé Library ID: ${libraryId}. Thumbnail nebude k dispozici.`);
    return '';
  }
  
  return `https://vz-${pullZoneId}.b-cdn.net/${videoId}/thumbnail.jpg`;
}

export default function BlogVideoInput({ 
  initialVideoUrl, 
  initialLibraryId = '276140', // Výchozí Library ID pro blog videa
  onVideoChange 
}: BlogVideoInputProps) {
  const [videoId, setVideoId] = useState('');
  const [libraryId, setLibraryId] = useState(initialLibraryId);
  const [showPreview, setShowPreview] = useState(false);

  // Při inicializaci extrahujeme ID z URL, pokud existuje
  useEffect(() => {
    if (initialVideoUrl) {
      const extractedId = extractVideoId(initialVideoUrl);
      setVideoId(extractedId || initialVideoUrl);
    }
  }, [initialVideoUrl]);

  // Při změně videoId nebo libraryId zavoláme callback
  useEffect(() => {
    if (videoId && libraryId) {
      onVideoChange({
        videoUrl: videoId,
        videoLibraryId: libraryId,
        // Nepoužíváme automatické generování thumbnail - uživatel si přidá vlastní
        // thumbnailUrl: undefined,
      });
    }
  }, [videoId, libraryId]); // odstranil onVideoChange z dependencies

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setVideoId(newId);
  };

  const handleLibraryIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLibraryId = e.target.value;
    setLibraryId(newLibraryId);
  };

  // Kontrola, zda máme platné video ID
  const hasValidVideoId = () => {
    return videoId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);
  };

  return (
    <div className="space-y-4">
      {/* Video ID input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Video ID z Bunny.net *
        </label>
        <div className="flex items-center border border-neutral-300 rounded-md overflow-hidden">
          <div className="bg-neutral-100 p-2 border-r border-neutral-300">
            <FiVideo className="text-neutral-500" />
          </div>
          <input
            type="text"
            value={videoId}
            onChange={handleVideoIdChange}
            placeholder="16da5a72-631a-4e7e-9b72-a4c8920e6f42"
            className="flex-grow p-2 outline-none"
            required
          />
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Zadej pouze ID videa z Bunny.net ve formátu UUID
        </p>
      </div>

      {/* Library ID input */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Library ID z Bunny.net *
        </label>
        <input
          type="text"
          value={libraryId}
          onChange={handleLibraryIdChange}
          placeholder="276140"
          className="w-full p-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
        <p className="text-xs text-neutral-500 mt-1">
          Číslo knihovny z Bunny.net pro toto video (např. 276140 pro blog videa)
        </p>
      </div>

      {/* Preview button */}
      {hasValidVideoId() && libraryId && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {showPreview ? 'Skrýt náhled' : 'Zobrazit náhled'}
          </button>
          <div className="flex items-center text-sm text-neutral-500">
            <FiInfo className="mr-1" />
            URL: iframe.mediadelivery.net/embed/{libraryId}/{videoId}
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && hasValidVideoId() && libraryId && (
        <div className="space-y-4">
          {/* Thumbnail Preview */}
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <div className="aspect-video bg-neutral-100 relative overflow-hidden">
              <img 
                src={generateThumbnailUrl(videoId, libraryId)}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYuMyAyLjg0MUExLjUgMS41IDAgMDA0IDQuMTFWMTUuODlhMS41IDEuNSAwIDAwMi4zIDEuMjY5bDkuMzQ0LTUuODlhMS41IDEuNSAwIDAwMC0yLjUzOEw2LjMgMi44NHoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K';
                }}
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-neutral-100 p-2">
              <span className="text-sm text-neutral-600">Náhled thumbnail</span>
            </div>
          </div>

          {/* Video Preview */}
          <div className="border border-neutral-200 rounded-md overflow-hidden">
            <div className="aspect-video bg-black">
              <iframe
                src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
                className="w-full h-full"
                loading="lazy"
                frameBorder="0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              ></iframe>
            </div>
            <div className="bg-neutral-100 p-2 flex justify-between items-center">
              <span className="text-sm text-neutral-600">Náhled videa</span>
              <a 
                href={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
              >
                Otevřít v novém okně <FiExternalLink className="ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
