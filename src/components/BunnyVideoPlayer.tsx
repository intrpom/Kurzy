'use client';

import { useState, useEffect } from 'react';
import { FiMaximize, FiVolume2, FiVolumeX } from 'react-icons/fi';

interface BunnyVideoPlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  libraryId?: string; // Volitelné ID knihovny, výchozí hodnota je nastavena v komponentě
}

export default function BunnyVideoPlayer({ 
  videoId, 
  title, 
  autoplay = false,
  muted = false,
  loop = false,
  className = '',
  libraryId = '424657' // Výchozí ID knihovny z Bunny.net
}: BunnyVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulace načítání videa
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [videoId]);

  if (!videoId) {
    return (
      <div className={`aspect-video bg-neutral-800 flex items-center justify-center text-white ${className}`}>
        <p>Video není k dispozici</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`aspect-video bg-neutral-800 flex items-center justify-center text-white ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  // Sestavení embed URL pro Bunny.net video
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=${autoplay ? 'true' : 'false'}&loop=${loop ? 'true' : 'false'}&muted=${muted ? 'true' : 'false'}&preload=true&responsive=true`;

  return (
    <div className={`relative bunny-video-player ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      
      <div className="relative aspect-video bg-black">
        <iframe
          src={embedUrl}
          title={title || 'Video přehrávač'}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          onError={() => setError('Nepodařilo se načíst video')}
        ></iframe>
      </div>
      
      {title && (
        <div className="bg-neutral-800 text-white p-3">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
      )}
    </div>
  );
}
