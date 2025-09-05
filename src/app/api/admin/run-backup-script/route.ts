import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '@/utils/logger';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    // Kontrola autorizace
    const session = await verifySession(req);
    if (!session || session.role !== 'ADMIN') {
      logger.warn('Pokus o spuštění zálohovacího skriptu bez administrátorských práv', { userId: session?.userId, role: session?.role });
      return NextResponse.json({ error: 'Neautorizovaný přístup' }, { status: 401 });
    }

    logger.info('Spouštím zálohovací skript');

    // Spuštění zálohovacího skriptu
    const { stdout, stderr } = await execAsync('node scripts/backup-db.js', {
      cwd: process.cwd(),
      timeout: 30000, // 30 sekund timeout
    });

    if (stderr) {
      logger.warn('Skript vypsal stderr:', stderr);
    }

    logger.info('Zálohovací skript dokončen');

    return NextResponse.json({
      success: true,
      message: 'Zálohovací skript byl úspěšně spuštěn',
      output: stdout,
      stderr: stderr || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Chyba při spuštění zálohovacího skriptu:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Skript překročil časový limit (30s)' 
        }, { status: 408 });
      }
      
      if (error.message.includes('ENOENT')) {
        return NextResponse.json({ 
          error: 'Zálohovací skript nebyl nalezen (scripts/backup-db.js)' 
        }, { status: 404 });
      }
    }

    return NextResponse.json({ 
      error: 'Nastala chyba při spuštění zálohovacího skriptu',
      details: error instanceof Error ? error.message : 'Neznámá chyba'
    }, { status: 500 });
  }
}
