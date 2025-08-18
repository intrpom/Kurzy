import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  console.log('API: Začínám zpracovávat požadavek na nahrání souboru');
  
  try {
    const formData = await request.formData();
    console.log('API: FormData získána');
    
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'courses';
    const fileType = formData.get('fileType') as string || 'image';
    
    console.log('API: Získané parametry:', { 
      fileExists: !!file, 
      fileName: file?.name, 
      fileType, 
      fileSize: file?.size,
      folder 
    });
    
    if (!file) {
      console.log('API: Chyba - žádný soubor nebyl poskytnut');
      return NextResponse.json(
        { message: 'Nebyl poskytnut žádný soubor' },
        { status: 400 }
      );
    }

    // Kontrola typu souboru je již provedena výše
    
    // Získání přípony souboru
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log('API: Přípona souboru:', fileExtension);
    
    // Kontrola podle typu souboru
    if (fileType === 'image') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { message: 'Soubor musí být obrázek' },
          { status: 400 }
        );
      }
      
      if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExtension || '')) {
        return NextResponse.json(
          { message: 'Nepodporovaný formát obrázku' },
          { status: 400 }
        );
      }
    } else if (fileType === 'pdf') {
      console.log('API: Kontroluji PDF soubor, MIME typ:', file.type);
      
      if (file.type !== 'application/pdf') {
        console.log('API: Chyba - neplatný MIME typ pro PDF');
        return NextResponse.json(
          { message: 'Soubor musí být ve formátu PDF' },
          { status: 400 }
        );
      }
      
      if (fileExtension !== 'pdf') {
        console.log('API: Chyba - neplatná přípona souboru pro PDF');
        return NextResponse.json(
          { message: 'Soubor musí mít příponu .pdf' },
          { status: 400 }
        );
      }
      
      console.log('API: PDF soubor je validní');
    } else {
      return NextResponse.json(
        { message: 'Nepodporovaný typ souboru' },
        { status: 400 }
      );
    }

    // Vytvoření unikátního názvu souboru
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    console.log('API: Vygenerovaný unikátní název souboru:', uniqueFilename);
    
    // Vytvoření cesty pro Vercel Blob Storage
    const pathname = `${folder}/${uniqueFilename}`;
    console.log('API: Cesta pro uložení v Blob Storage:', pathname);
    
    try {
      // Nahrání souboru do Vercel Blob Storage
      console.log('API: Začínám nahrávat soubor do Vercel Blob Storage');
      const blob = await put(pathname, file, {
        access: 'public',
      });
      
      // Vrácení URL k nahranému souboru z Vercel Blob Storage
      const imageUrl = blob.url;
      console.log('API: Soubor úspěšně nahrán, URL:', imageUrl);
      
      return NextResponse.json({ 
        url: imageUrl,
        message: 'Soubor byl úspěšně nahrán' 
      });
    } catch (uploadError) {
      console.error('API: Chyba při nahrávání do Vercel Blob Storage:', uploadError);
      return NextResponse.json(
        { message: `Chyba při nahrávání souboru do úložiště: ${uploadError instanceof Error ? uploadError.message : 'Neznámá chyba'}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('API: Obecná chyba při nahrávání souboru:', error);
    return NextResponse.json(
      { message: `Došlo k chybě při nahrávání souboru: ${error instanceof Error ? error.message : 'Neznámá chyba'}` },
      { status: 500 }
    );
  }
}
