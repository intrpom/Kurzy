'use client';

import { useState } from 'react';
import Image from 'next/image';

type CourseImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
};

export default function CourseImage({ src, alt, width, height, className, objectFit = 'cover' }: CourseImageProps) {
  const [error, setError] = useState(false);
  
  // Fallback obrázek, který se použije, pokud původní obrázek není k dispozici
  const fallbackImage = '/images/placeholder-course.jpg';
  
  return (
    <div className="relative w-full h-full">
      <Image
        src={error ? fallbackImage : src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit, width: '100%', height: '100%' }}
        className={`${className || ''}`}
        onError={() => setError(true)}
      />
    </div>
  );
}
