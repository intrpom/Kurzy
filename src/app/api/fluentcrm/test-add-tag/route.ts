import { NextRequest, NextResponse } from 'next/server';
import { updateUserAfterFreeCourse, updateUserAfterPurchase } from '@/lib/fluentcrm';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint pro přidání tagu kurzu
 * POST /api/fluentcrm/test-add-tag
 * Body: { email: string, courseSlug: string, courseName: string, type: 'free' | 'paid' }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST PŘIDÁNÍ TAGU KURZU ===');
    
    const { email, courseSlug, courseName, type } = await request.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Neplatná e-mailová adresa'
      }, { status: 400 });
    }
    
    if (!courseSlug || !courseName || !type) {
      return NextResponse.json({
        success: false,
        error: 'Chybí povinné parametry: courseSlug, courseName, type'
      }, { status: 400 });
    }
    
    if (type !== 'free' && type !== 'paid') {
      return NextResponse.json({
        success: false,
        error: 'Type musí být "free" nebo "paid"'
      }, { status: 400 });
    }
    
    console.log('Testuji přidání tagu:', { email, courseSlug, courseName, type });
    
    let result;
    if (type === 'free') {
      result = await updateUserAfterFreeCourse(email, courseName, courseSlug);
    } else {
      result = await updateUserAfterPurchase(email, courseName, courseSlug);
    }
    
    console.log('Výsledek testu:', result);
    console.log('=== KONEC TESTU ===');
    
    return NextResponse.json({
      success: result.success,
      data: result.data,
      message: result.message || (result.success ? 'Tag úspěšně přidán' : 'Chyba při přidávání tagu'),
      errors: result.errors,
      testData: { email, courseSlug, courseName, type }
    });
    
  } catch (error) {
    console.error('Chyba při testu přidání tagu:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Nepodařilo se provést test',
      details: error instanceof Error ? error.message : 'Neznámá chyba'
    }, { status: 500 });
  }
}
