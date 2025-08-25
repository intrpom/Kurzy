'use client';

import { useState, useEffect } from 'react';
import { FiVideo, FiExternalLink, FiInfo } from 'react-icons/fi';

interface VideoUrlInputProps {
  currentUrl?: string;
  onUrlChange: (url: string) => void;
  onVideoChange?: (data: { videoUrl: string; videoLibraryId: string; thumbnailUrl?: string }) => void;
  libraryId?: string;
}

// Funkce pro extrakci ID videa z URL
function extractVideoId(url: string): string {
  // Pokud je URL prázdné, vrátíme prázdný řetězec
  if (!url) return '';
  
  // Pokud URL již obsahuje pouze ID (UUID formát), vrátíme ho přímo
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(url)) {
    return url;
  }
  
  // Zkusíme najít ID v různých formátech URL z Bunny.net
  
  // Direct Play URL: https://iframe.mediadelivery.net/play/424657/16da5a72-631a-4e7e-9b72-a4c8920e6f42
  const directPlayMatch = url.match(/\/play\/\d+\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (directPlayMatch) return directPlayMatch[1];
  
  // Embed URL: https://iframe.mediadelivery.net/embed/424657/16da5a72-631a-4e7e-9b72-a4c8920e6f42
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

export default function VideoUrlInput({ currentUrl, onUrlChange, onVideoChange, libraryId = '424657' }: VideoUrlInputProps) {
  const [url, setUrl] = useState(currentUrl || '');
  const [videoId, setVideoId] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [inputType, setInputType] = useState<'url' | 'id'>('id'); // Výchozí režim je nyní ID

  // Při inicializaci extrahujeme ID z URL, pokud existuje
  useEffect(() => {
    if (currentUrl) {
      const extractedId = extractVideoId(currentUrl);
      setVideoId(extractedId || currentUrl); // Pokud se nepodaří extrahovat ID, použijeme původní hodnotu
    }
  }, [currentUrl]);
  
  // Při změně URL extrahujeme video ID
  useEffect(() => {
    const extractedId = extractVideoId(url);
    setVideoId(extractedId);
  }, [url]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    onUrlChange(newUrl);
    
    // Zavolej také onVideoChange callback s video daty
    if (onVideoChange) {
      const extractedId = extractVideoId(newUrl);
      const thumbnailUrl = generateThumbnailUrl(extractedId || newUrl, libraryId);
      onVideoChange({
        videoUrl: extractedId || newUrl,
        videoLibraryId: libraryId,
        thumbnailUrl: thumbnailUrl || undefined,
      });
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setVideoId(newId);
    onUrlChange(newId); // Uložíme přímo ID jako URL
    
    // Zavolej také onVideoChange callback s video daty
    if (onVideoChange) {
      const thumbnailUrl = generateThumbnailUrl(newId, libraryId);
      onVideoChange({
        videoUrl: newId,
        videoLibraryId: libraryId,
        thumbnailUrl: thumbnailUrl || undefined,
      });
    }
  };

  const toggleInputType = () => {
    if (inputType === 'url') {
      setInputType('id');
      // Pokud máme URL, extrahujeme ID
      if (url) {
        const extractedId = extractVideoId(url);
        if (extractedId) {
          setVideoId(extractedId);
          onUrlChange(extractedId);
        }
      }
    } else {
      setInputType('url');
      // Pokud máme ID, vytvoříme URL
      if (videoId) {
        const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
        setUrl(embedUrl);
        onUrlChange(videoId); // Uložíme přímo ID jako URL
      }
    }
  };

  // Kontrola, zda máme platné video ID
  const hasValidVideoId = () => {
    return videoId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-2">
        <button
          type="button"
          onClick={toggleInputType}
          className="px-3 py-1 bg-neutral-200 text-neutral-700 rounded-md hover:bg-neutral-300 transition-colors text-sm"
        >
          {inputType === 'url' ? 'Přepnout na ID' : 'Přepnout na URL'}
        </button>
        <div className="text-sm text-neutral-500 flex items-center">
          <FiInfo className="mr-1" />
          {inputType === 'url' ? 'Zadejte URL videa z Bunny.net' : 'Zadejte pouze ID videa z Bunny.net'}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex-grow">
          <div className="flex items-center border border-neutral-300 rounded-md overflow-hidden">
            <div className="bg-neutral-100 p-2 border-r border-neutral-300">
              <FiVideo className="text-neutral-500" />
            </div>
            {inputType === 'url' ? (
              <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://iframe.mediadelivery.net/embed/424657/16da5a72-631a-4e7e-9b72-a4c8920e6f42"
                className="flex-grow p-2 outline-none"
              />
            ) : (
              <input
                type="text"
                value={videoId}
                onChange={handleIdChange}
                placeholder="16da5a72-631a-4e7e-9b72-a4c8920e6f42"
                className="flex-grow p-2 outline-none"
              />
            )}
          </div>
        </div>
        {(url || videoId) && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            {showPreview ? 'Skrýt náhled' : 'Zobrazit náhled'}
          </button>
        )}
      </div>

      {showPreview && (
        <div className="border border-neutral-200 rounded-md overflow-hidden">
          <div className="aspect-video bg-black">
            {hasValidVideoId() ? (
              <iframe
                src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
                className="w-full h-full"
                loading="lazy"
                frameBorder="0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <p>Neplatné video ID nebo URL</p>
              </div>
            )}
          </div>
          <div className="bg-neutral-100 p-2 flex justify-between items-center">
            <span className="text-sm text-neutral-600">Náhled videa</span>
            {hasValidVideoId() && (
              <a 
                href={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
              >
                Otevřít v novém okně <FiExternalLink className="ml-1" />
              </a>
            )}
          </div>
        </div>
      )}

      <p className="text-sm text-neutral-500">
        {inputType === 'url' ? 'Zadejte URL videa z Bunny.net ve formátu přímého odkazu nebo embed URL.' : 'Zadejte pouze ID videa z Bunny.net ve formátu UUID (např. 16da5a72-631a-4e7e-9b72-a4c8920e6f42).'}
      </p>
    </div>
  );
}
