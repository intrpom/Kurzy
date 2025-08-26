'use client';

import { useState, useEffect } from 'react';
import { FiPlay, FiLock, FiUser } from 'react-icons/fi';
import BunnyVideoPlayer from './BunnyVideoPlayer';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedVideoPlayerProps {
  videoId: string;
  libraryId: string;
  title: string;
  className?: string;
}

export default function ProtectedVideoPlayer({ 
  videoId, 
  libraryId, 
  title, 
  className = "w-full aspect-video" 
}: ProtectedVideoPlayerProps) {
  const { user, loading } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Pokud je loading, zobrazíme placeholder
  if (loading) {
    return (
      <div className={`${className} bg-neutral-100 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-500">Načítání...</p>
        </div>
      </div>
    );
  }

  // Pokud je uživatel přihlášen, zobrazíme video
  if (user) {
    return (
      <BunnyVideoPlayer
        videoId={videoId}
        libraryId={libraryId}
        className={className}
      />
    );
  }

  // Pokud není přihlášen, zobrazíme výzvu k přihlášení
  return (
    <div className={`${className} bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center relative overflow-hidden`}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-6">
        <div className="mb-6">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <FiLock className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Video je pouze pro přihlášené</h3>
          <p className="text-primary-100 mb-6 max-w-md mx-auto">
            Pro sledování tohoto videa se musíte přihlásit. Přihlášení je zdarma a zabere jen chvilku.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              // Přesměrování na přihlášení s návratem na aktuální stránku
              const currentUrl = window.location.pathname;
              window.location.href = `/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`;
            }}
            className="bg-white text-primary-700 font-semibold py-3 px-6 rounded-lg hover:bg-primary-50 transition-colors inline-flex items-center gap-2"
          >
            <FiUser className="w-5 h-5" />
            Přihlásit se zdarma
          </button>
          
          <div className="text-sm text-primary-100">
            <p>✓ Registrace za pár sekund</p>
            <p>✓ Přístup ke všem video blogům</p>
            <p>✓ Bez reklam a spam emailů</p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-16 h-16 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute top-1/2 left-8 w-8 h-8 bg-white bg-opacity-10 rounded-full"></div>
    </div>
  );
}
