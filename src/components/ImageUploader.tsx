'use client';

import { useState } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import Image from 'next/image';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageUpload: (imageUrl: string) => void;
  folder?: string;
}

export default function ImageUploader({ currentImageUrl, onImageUpload, folder = 'courses' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kontrola typu souboru
    if (!file.type.startsWith('image/')) {
      setUploadError('Prosím vyberte obrázek (JPG, PNG, WebP)');
      return;
    }

    // Kontrola velikosti souboru (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Obrázek je příliš velký. Maximální velikost je 2MB.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      // Vytvoření FormData pro nahrání souboru
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      // Nahrání souboru na server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Chyba při nahrávání obrázku');
      }

      const data = await response.json();
      
      // Nastavení URL nahraného obrázku
      setPreviewUrl(data.url);
      onImageUpload(data.url);
    } catch (error) {
      console.error('Chyba při nahrávání:', error);
      setUploadError(error instanceof Error ? error.message : 'Neznámá chyba při nahrávání');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUpload('');
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative" style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
          <Image 
            src={previewUrl} 
            alt="Náhled obrázku" 
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            className="rounded-md"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 z-10"
            title="Odstranit obrázek"
          >
            <FiX size={16} />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <label 
            htmlFor="image-upload" 
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <FiUpload size={24} className="mb-2 text-neutral-500" />
            <span className="text-neutral-700 font-medium">Klikněte pro nahrání obrázku</span>
            <span className="text-neutral-500 text-sm mt-1">JPG, PNG nebo WebP (max. 2MB)</span>
          </label>
        </div>
      )}

      {isUploading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      )}

      {uploadError && (
        <div className="text-red-600 text-sm">
          {uploadError}
        </div>
      )}
    </div>
  );
}
