'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import { Course } from '@/types/course';

interface CourseBasicInfoProps {
  course: Course;
  onCourseChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTagsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageUpload: (url: string) => void;
  onGenerateSlug?: () => void;
  isNewCourse?: boolean;
}

export default function CourseBasicInfo({
  course,
  onCourseChange,
  onCheckboxChange,
  onTagsChange,
  onImageUpload,
  onGenerateSlug,
  isNewCourse
}: CourseBasicInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-medium mb-4">Základní informace</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Název kurzu *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={course.title}
            onChange={onCourseChange}
            required
            className="w-full p-2 border border-neutral-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="slug">
            Slug (URL) *
          </label>
          <div className="flex">
            <input
              type="text"
              id="slug"
              name="slug"
              value={course.slug || ''}
              onChange={onCourseChange}
              required
              className="w-full p-2 border border-neutral-300 rounded-md"
            />
            {onGenerateSlug && (
              <button
                type="button"
                onClick={onGenerateSlug}
                className="ml-2 px-3 py-2 bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-md hover:bg-neutral-200"
              >
                Generovat
              </button>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="subtitle">
            Krátký popis kurzu * <span className="text-xs text-neutral-500">(zobrazí se na přehledové stránce)</span>
          </label>
          <input
            type="text"
            id="subtitle"
            name="subtitle"
            value={course.subtitle || ''}
            onChange={onCourseChange}
            className="w-full p-2 border border-neutral-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Obrázek kurzu
          </label>
          <ImageUploader
            currentImageUrl={course.imageUrl}
            onImageUpload={onImageUpload}
            folder="courses"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="description">
            Dlouhý popis kurzu *
          </label>
          <textarea
            id="description"
            name="description"
            value={course.description}
            onChange={onCourseChange}
            required
            rows={10}
            className="w-full p-2 border border-neutral-300 rounded-md font-mono text-sm"
            placeholder="Zadejte popis kurzu..."
          ></textarea>

        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="price">
            Cena (Kč)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={course.price}
            onChange={onCourseChange}
            min="0"
            step="1"
            className="w-full p-2 border border-neutral-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="level">
            Úroveň
          </label>
          <select
            id="level"
            name="level"
            value={course.level || 'beginner'}
            onChange={onCourseChange}
            className="w-full p-2 border border-neutral-300 rounded-md"
          >
            <option value="beginner">Začátečník</option>
            <option value="intermediate">Mírně pokročilý</option>
            <option value="advanced">Pokročilý</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="tags">
            Tagy (oddělené čárkou)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={(course.tags || []).join(', ')}
            onChange={onTagsChange}
            className="w-full p-2 border border-neutral-300 rounded-md"
            placeholder="javascript, react, web"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="videoLibraryId">
            ID knihovny Bunny.net
            <span className="text-xs text-neutral-500 ml-1">(výchozí: 424657)</span>
          </label>
          <input
            type="text"
            id="videoLibraryId"
            name="videoLibraryId"
            value={course.videoLibraryId || ''}
            onChange={onCourseChange}
            className="w-full p-2 border border-neutral-300 rounded-md"
            placeholder="424657"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            checked={course.isFeatured}
            onChange={onCheckboxChange}
            className="mr-2"
          />
          <label htmlFor="isFeatured">
            Doporučený kurz
          </label>
        </div>
      </div>
    </div>
  );
}
