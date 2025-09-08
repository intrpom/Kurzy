import { FiMail, FiUser, FiBook, FiCalendar } from 'react-icons/fi';
import Link from 'next/link';
import prisma from '@/lib/db';

interface Course {
  id: string;
  title: string;
  slug: string;
  progress: number;
  completed: boolean;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  coursesCount: number;
  courses: Course[];
}

interface AvailableCourse {
  id: string;
  title: string;
  slug: string;
  price: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsersData {
  users: User[];
  pagination: PaginationInfo;
  availableCourses: AvailableCourse[];
}

// Server funkce pro získání uživatelů
async function getUsersData(page: number = 1, limit: number = 10): Promise<UsersData> {
  try {
    console.log(`👥 Načítám uživatele pro admin - stránka ${page}, limit ${limit} - ${new Date().toISOString()}`);
    
    const offset = (page - 1) * limit;
    
    // Vynutit čerstvé připojení k databázi
    await prisma.$connect();
    
    // Spočítat celkový počet uživatelů
    const totalUsers = await prisma.user.count();
    
    // Načíst uživatele s kurzy
    const users = await prisma.user.findMany({
      skip: offset,
      take: limit,
      include: {
        userCourses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transformovat data
    const transformedUsers: User[] = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      coursesCount: user.userCourses.length,
      courses: user.userCourses.map(uc => ({
        id: uc.course.id,
        title: uc.course.title,
        slug: uc.course.slug,
        progress: uc.progress,
        completed: uc.completed
      }))
    }));
    
    // Načíst dostupné kurzy
    const availableCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        price: true
      },
      orderBy: {
        title: 'asc'
      }
    });
    
    const totalPages = Math.ceil(totalUsers / limit);
    
    console.log(`✅ Načteno ${transformedUsers.length} uživatelů z ${totalUsers} celkem`);
    
    return {
      users: transformedUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      availableCourses: availableCourses.map(course => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        price: course.price
      }))
    };
  } catch (error) {
    console.error('Chyba při načítání uživatelů:', error);
    return {
      users: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false
      },
      availableCourses: []
    };
  }
}

// Import Client komponenty
import AdminUsersClient from './AdminUsersClient';

// Vynutit dynamické generování stránky bez cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: { page?: string };
}

/**
 * Server komponenta pro správu uživatelů
 */
export default async function AdminUsersPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1;
  const usersData = await getUsersData(page, 10);
  
  return <AdminUsersClient initialData={usersData} />;
}