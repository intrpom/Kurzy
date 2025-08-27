import { useState } from 'react';
import CourseList from '@/components/admin/courses/CourseList';
import { Course } from '@/types/course';
import prisma from '@/lib/db';

/**
 * Server funkce pro načtení kurzů pro admin
 */
async function getAdminCourses(): Promise<Course[]> {
  try {
    console.log('📚 Načítám kurzy pro admin s detaily...');
    
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          orderBy: {
            order: 'asc'
          },
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              },
              include: {
                materials: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformace dat pro frontend (stejně jako v API)
    const transformedCourses = courses.map(course => {
      const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
      const totalMaterials = course.modules.reduce(
        (acc, module) => acc + module.lessons.reduce(
          (lessonAcc, lesson) => lessonAcc + lesson.materials.length, 0
        ), 0
      );

      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        imageUrl: course.imageUrl,
        price: course.price,
        slug: course.slug,
        isFeatured: course.isFeatured,
        isPublished: course.isPublished,
        level: course.level,
        tags: course.tags,
        modules: course.modules.map(module => ({
          id: module.id,
          title: module.title,
          description: module.description,
          order: module.order,
          videoUrl: module.videoUrl,
          videoLibraryId: module.videoLibraryId,
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            order: lesson.order,
            videoUrl: lesson.videoUrl,
            videoLibraryId: lesson.videoLibraryId,
            materials: lesson.materials
          }))
        })),
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        // Computed properties
        totalModules: course.modules.length,
        totalLessons,
        totalMaterials
      };
    });

    console.log(`✅ Načteno ${transformedCourses.length} kurzů pro admin`);
    return transformedCourses as Course[];
  } catch (error) {
    console.error('Chyba při načítání kurzů pro admin:', error);
    return [];
  }
}

// Import Client komponenty pro interaktivitu
import AdminCoursesClient from './AdminCoursesClient';

// Stránka se dynamicky generuje bez cache
export const dynamic = 'force-dynamic';

/**
 * Server komponenta pro správu kurzů v administraci
 */
export default async function AdminCoursesPage() {
  // Získat kurzy na serveru
  const courses = await getAdminCourses();
  
  // Předat data Client komponentě pro interaktivitu
  return <AdminCoursesClient initialCourses={courses} />;
}