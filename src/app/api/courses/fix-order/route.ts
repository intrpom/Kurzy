import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

type LessonInfo = {
  id: string;
  title: string;
  currentOrder: number;
  correctOrder: number;
};

type UpdatedLessonInfo = {
  id: string;
  title: string;
  oldOrder: number;
  newOrder: number;
};

type ModuleResult = {
  moduleId: string;
  moduleTitle: string;
  lessons: LessonInfo[];
  updatedLessons: UpdatedLessonInfo[];
};

type CourseResult = {
  courseId: string;
  courseTitle: string;
  modules: ModuleResult[];
};

// GET /api/courses/fix-order - Oprava pořadí lekcí v kurzech
export async function GET(request: NextRequest) {
  try {
    console.log('Začínám kontrolu a opravu pořadí lekcí v kurzech');
    
    // Získání všech kurzů s moduly a lekcemi
    const courses = await prisma.course.findMany({
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    });
    
    const results: CourseResult[] = [];
    
    // Procházení všech kurzů a oprava pořadí lekcí
    for (const course of courses) {
      console.log(`Kontroluji kurz: ${course.title} (${course.id})`);
      const courseResult: CourseResult = {
        courseId: course.id,
        courseTitle: course.title,
        modules: []
      };
      
      // Procházení modulů v kurzu
      for (const module of course.modules) {
        console.log(`  Kontroluji modul: ${module.title} (${module.id})`);
        const moduleResult: ModuleResult = {
          moduleId: module.id,
          moduleTitle: module.title,
          lessons: [] as LessonInfo[],
          updatedLessons: [] as UpdatedLessonInfo[]
        };
        
        // Seřazení lekcí podle ID (jako záložní řešení)
        const sortedLessons = [...module.lessons].sort((a, b) => {
          // Pokud mají stejný order, seřadíme podle ID
          if (a.order === b.order) {
            return a.id.localeCompare(b.id);
          }
          return a.order - b.order;
        });
        
        // Kontrola a oprava pořadí lekcí
        for (let i = 0; i < sortedLessons.length; i++) {
          const lesson = sortedLessons[i];
          const correctOrder = i + 1; // Pořadí začíná od 1
          
          moduleResult.lessons.push({
            id: lesson.id,
            title: lesson.title,
            currentOrder: lesson.order,
            correctOrder
          });
          
          // Pokud je pořadí nesprávné, opravíme ho
          if (lesson.order !== correctOrder) {
            console.log(`    Opravuji pořadí lekce: ${lesson.title} (${lesson.id}) z ${lesson.order} na ${correctOrder}`);
            
            await prisma.lesson.update({
              where: { id: lesson.id },
              data: { order: correctOrder }
            });
            
            moduleResult.updatedLessons.push({
              id: lesson.id,
              title: lesson.title,
              oldOrder: lesson.order,
              newOrder: correctOrder
            });
          }
        }
        
        courseResult.modules.push(moduleResult);
      }
      
      results.push(courseResult);
    }
    
    return NextResponse.json({
      message: 'Kontrola a oprava pořadí lekcí dokončena',
      results
    });
  } catch (error) {
    console.error('Chyba při opravě pořadí lekcí:', error);
    return NextResponse.json(
      { error: 'Nepodařilo se opravit pořadí lekcí', details: String(error) },
      { status: 500 }
    );
  }
}
