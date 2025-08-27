/**
 * Centralizovaná cache služba pro kontrolu přístupu ke kurzům
 * Eliminuje duplikované API volání
 */

interface AccessCacheEntry {
  hasAccess: boolean;
  timestamp: number;
  courses?: any[];
}

class CourseAccessCache {
  private cache = new Map<string, AccessCacheEntry>();
  private readonly CACHE_DURATION = 30000; // 30 sekund

  async checkAccess(courseId: string): Promise<{ hasAccess: boolean; courses?: any[] }> {
    const cacheKey = courseId;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // Zkontroluj cache
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log('🚀 Cache HIT pro kurz:', courseId);
      return {
        hasAccess: cached.hasAccess,
        courses: cached.courses
      };
    }

    // Cache miss - volej API
    console.log('🔄 Cache MISS - volám API pro kurz:', courseId);
    
    try {
      const response = await fetch(`/api/user/courses?courseId=${courseId}&_=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP chyba: ${response.status}`);
      }

      const data = await response.json();

      // Ulož do cache
      this.cache.set(cacheKey, {
        hasAccess: data.hasAccess,
        courses: data.courses,
        timestamp: now
      });

      console.log('✅ API odpověď uložena do cache pro kurz:', courseId);

      return {
        hasAccess: data.hasAccess,
        courses: data.courses
      };
    } catch (error) {
      console.error('❌ Chyba při kontrole přístupu ke kurzu:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache vymazána');
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const courseAccessCache = new CourseAccessCache();
