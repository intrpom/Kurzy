'use client';

import { useState, useRef } from 'react';
import { FiPlus, FiTrash, FiFile, FiLink, FiFileText, FiMusic } from 'react-icons/fi';

interface Material {
  type: 'pdf' | 'audio' | 'link' | 'text';
  title: string;
  url?: string;
  content?: string;
}

interface MaterialManagerProps {
  materials: Material[];
  onMaterialsChange: (materials: Material[]) => void;
  moduleId: string;
  lessonId: string;
}

/**
 * Komponenta pro správu materiálů v lekcích
 */
export default function MaterialManager({ materials = [], onMaterialsChange, moduleId, lessonId }: MaterialManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Přidání nového materiálu
  const addMaterial = (type: 'pdf' | 'audio' | 'link' | 'text') => {
    const newMaterial: Material = {
      type,
      title: type === 'pdf' ? 'Nový PDF dokument' : 
             type === 'audio' ? 'Nová audio nahrávka' : 
             type === 'link' ? 'Nový odkaz' : 'Nový textový materiál',
      url: type === 'link' ? 'https://' : undefined,
      content: type === 'text' ? '' : undefined
    };
    
    onMaterialsChange([...materials, newMaterial]);
  };

  // Smazání materiálu
  const deleteMaterial = (index: number) => {
    if (window.confirm('Opravdu chcete smazat tento materiál?')) {
      const updatedMaterials = [...materials];
      updatedMaterials.splice(index, 1);
      onMaterialsChange(updatedMaterials);
    }
  };

  // Aktualizace materiálu
  const updateMaterial = (index: number, field: string, value: string) => {
    console.log(`Aktualizuji materiál na indexu ${index}, pole ${field} na hodnotu:`, value);
    
    // Vytvoříme hlubokou kopii pole materiálů
    const updatedMaterials = materials.map(m => ({...m}));
    
    // Aktualizujeme konkrétní materiál
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [field]: value
    };
    
    console.log('Nový stav materiálů:', JSON.stringify(updatedMaterials));
    
    // Vyvoláme callback s aktualizovanými materiály
    onMaterialsChange(updatedMaterials);
    
    // Kontrola, zda se změna projevila
    setTimeout(() => {
      console.log('Kontrola aktualizace materiálu:', materials[index]);
    }, 100);
  };

  // Funkce pro otevření dialogu pro výběr souboru
  const triggerFileInput = (index: number) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.click();
    }
  };

  // Nahrání PDF souboru - přepracovaná verze
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    try {
      // Kontrola, zda máme platný event a soubor
      if (!event || !event.target || !event.target.files || event.target.files.length === 0) {
        setUploadError('Soubor nebyl vybrán');
        return;
      }
      
      const file = event.target.files[0];
      console.log('Vybraný soubor:', { 
        name: file.name, 
        type: file.type, 
        size: file.size,
        lastModified: file.lastModified
      });

      // Kontrola, zda je soubor PDF
      if (file.type !== 'application/pdf') {
        alert('Soubor musí být ve formátu PDF');
        return;
      }

      setIsUploading(true);
      setUploadProgress(10); // Indikace začátku nahrávání
      setUploadError(null);

      // Vytvoření nového FormData objektu
      const formData = new FormData();
      
      // Přidání souboru a metadat do FormData
      formData.append('file', file);
      formData.append('fileType', 'pdf');
      formData.append('folder', `materials/${moduleId}/${lessonId}`);
      
      console.log('Odesílám soubor na server...');
      setUploadProgress(30);
      
      // Nahrání souboru na server s timeout nastavením
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sekund timeout
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setUploadProgress(70);
      
      // Zpracování odpovědi
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Nepodařilo se nahrát soubor';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Nelze parsovat chybovou odpověď:', errorText);
        }
        
        throw new Error(errorMessage);
      }
      
      // Parsování odpovědi
      let data;
      try {
        const responseText = await response.text();
        console.log('Odpověď serveru (raw):', responseText);
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Chyba při parsování odpovědi:', parseError);
        throw new Error('Nepodařilo se zpracovat odpověď serveru');
      }
      
      setUploadProgress(90);
      
      // Kontrola, zda máme URL v odpovědi
      if (!data || !data.url) {
        throw new Error('Server nevrátil URL nahraného souboru');
      }
      
      console.log('Soubor úspěšně nahrán:', data.url);
      setUploadProgress(100);
      
      // Aktualizace URL materiálu a názvu v jedné dávce
      console.log('Aktualizuji URL materiálu na:', data.url);
      
      // Vytvoříme hlubokou kopii pole materiálů
      const updatedMaterials = materials.map(m => ({...m}));
      
      // Aktualizujeme URL a název materiálu najednou
      const fileName = file.name.replace('.pdf', '');
      updatedMaterials[index] = {
        ...updatedMaterials[index],
        url: data.url,
        title: fileName
      };
      
      console.log('Aktualizovaný materiál:', updatedMaterials[index]);
      console.log('Kompletní nový stav materiálů:', JSON.stringify(updatedMaterials));
      
      // Předáme aktualizované materiály nadřazené komponentě
      onMaterialsChange(updatedMaterials);
      
      // Materiály se uloží při uložení kurzu nebo modulu
      console.log('Materiál byl úspěšně nahrán, bude uložen při uložení kurzu');
      
      // Poznámka: Nepoužíváme setTimeout a nekontrolujeme materials[index],
      // protože React aktualizuje stav asynchronně a materials by nemuselo být aktualizované
      
    } catch (error) {
      console.error('Chyba při nahrávání souboru:', error);
      setUploadError(error instanceof Error ? error.message : 'Nepodařilo se nahrát soubor');
    } finally {
      // Resetování input elementu, aby bylo možné vybrat stejný soubor znovu
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = '';
      }
      
      // Odložené resetování stavu nahrávání, aby uživatel viděl výsledek
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  // Ikona podle typu materiálu
  const getIconForType = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FiFile className="text-red-600" />;
      case 'audio':
        return <FiMusic className="text-blue-600" />;
      case 'link':
        return <FiLink className="text-green-600" />;
      case 'text':
        return <FiFileText className="text-purple-600" />;
      default:
        return <FiFile />;
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Materiály k lekci</h4>
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={() => addMaterial('pdf')}
            className="p-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
            title="Přidat PDF dokument"
          >
            <FiFile className="mr-1" /> PDF
          </button>
          <button
            type="button"
            onClick={() => addMaterial('link')}
            className="p-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
            title="Přidat odkaz"
          >
            <FiLink className="mr-1" /> Odkaz
          </button>
          <button
            type="button"
            onClick={() => addMaterial('text')}
            className="p-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center"
            title="Přidat textový materiál"
          >
            <FiFileText className="mr-1" /> Text
          </button>
        </div>
      </div>

      {materials.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">Žádné materiály</p>
      ) : (
        <div className="space-y-2">
          {materials.map((material, index) => (
            <div key={index} className="border border-neutral-200 rounded p-2 bg-neutral-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getIconForType(material.type)}
                  <span className="text-xs font-medium ml-1">
                    {material.type === 'pdf' ? 'PDF dokument' : 
                     material.type === 'audio' ? 'Audio nahrávka' : 
                     material.type === 'link' ? 'Odkaz' : 'Text'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMaterial(index)}
                  className="p-1 text-neutral-600 hover:text-red-600"
                  aria-label="Smazat materiál"
                >
                  <FiTrash size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Název materiálu
                  </label>
                  <input
                    type="text"
                    value={material.title}
                    onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                    className="w-full p-1 border border-neutral-300 rounded-md text-sm"
                    placeholder="Název materiálu"
                  />
                </div>

                {material.type === 'pdf' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      PDF soubor
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, index)}
                        className="hidden" // Skryjeme input element
                        disabled={isUploading}
                        ref={(el) => {
                          if (fileInputRefs.current.length <= index) {
                            fileInputRefs.current = [...fileInputRefs.current, ...Array(index + 1 - fileInputRefs.current.length).fill(null)];
                          }
                          fileInputRefs.current[index] = el;
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => triggerFileInput(index)}
                        disabled={isUploading}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs flex items-center"
                      >
                        <FiFile className="mr-1" /> {material.url ? 'Změnit PDF' : 'Vybrat PDF'}
                      </button>
                      {material.url && (
                        <a 
                          href={material.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center"
                        >
                          <FiFileText className="mr-1" /> Zobrazit PDF
                        </a>
                      )}
                    </div>
                    {isUploading && (
                      <div className="mt-1">
                        <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-600" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                          {uploadProgress < 100 ? `Nahrávání... ${uploadProgress}%` : 'Dokončeno!'}
                        </p>
                      </div>
                    )}
                    {uploadError && (
                      <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                    )}
                    {material.url && (
                      <input
                        type="text"
                        value={material.url}
                        onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                        className="w-full p-1 border border-neutral-300 rounded-md text-sm mt-1"
                        placeholder="URL k PDF souboru"
                      />
                    )}
                  </div>
                )}

                {material.type === 'link' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      URL odkazu
                    </label>
                    <input
                      type="text"
                      value={material.url || ''}
                      onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                      className="w-full p-1 border border-neutral-300 rounded-md text-sm"
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {material.type === 'text' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Obsah
                    </label>
                    <textarea
                      value={material.content || ''}
                      onChange={(e) => updateMaterial(index, 'content', e.target.value)}
                      className="w-full p-1 border border-neutral-300 rounded-md text-sm"
                      rows={3}
                      placeholder="Text materiálu..."
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
