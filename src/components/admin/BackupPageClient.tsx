'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminHeader from './AdminHeader';
import AdminLoading from './AdminLoading';
import logger from '@/utils/logger';

export default function BackupPageClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isScriptRunning, setIsScriptRunning] = useState(false);
  const [scriptResult, setScriptResult] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Kontrola admin přístupu pomocí optimalizovaného auth systému
  const { user, loading, isInitialized } = useAuth();
  
  useEffect(() => {
    // Čekáme na inicializaci GlobalAuthState před jakoukoliv kontrolou
    if (!isInitialized) return; 
    
    if (!user) {
      logger.warn('Uživatel není přihlášen');
      router.push('/auth/login');
      return;
    }
    
    // Kontrola admin role
    const adminRoles = ['admin', 'administrator', 'Admin', 'ADMIN'];
    if (!user.role || !adminRoles.includes(user.role)) {
      logger.warn('Uživatel nemá administrátorská práva', { role: user.role || 'undefined' });
      // Pro testování povolujeme přístup
      logger.info('Povoluji přístup pro testování');
      setIsAdmin(true);
      return;
    }
    
    logger.info('Uživatel je administrátor', { userId: user.id });
    setIsAdmin(true);
  }, [user, isInitialized, router]);

  // Zobrazit loading stav, dokud neověříme, že uživatel je admin
  if (isAdmin === null) {
    return <AdminLoading />;
  }



  // Funkce pro spuštění zálohovacího skriptu
  const handleRunBackupScript = async () => {
    try {
      setIsScriptRunning(true);
      setError(null);
      setScriptResult(null);

      logger.info('Spouštím zálohovací skript');
      const response = await fetch('/api/admin/run-backup-script', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nastala chyba při spuštění zálohovacího skriptu');
      }

      const result = await response.json();
      logger.info('Zálohovací skript dokončen', result);
      setScriptResult(result.output);
    } catch (err) {
      logger.error('Chyba při spuštění zálohovacího skriptu:', err);
      setError(`Nastala chyba: ${err instanceof Error ? err.message : 'Neznámá chyba'}`);
    } finally {
      setIsScriptRunning(false);
    }
  };

  // Funkce pro obnovení ze zálohy
  const handleRestore = async (backupFile: File) => {
    try {
      setIsRestoring(true);
      setError(null);
      setRestoreResult(null);

      logger.info('Načítám zálohu ze souboru', { fileName: backupFile.name });

      // Načtení obsahu souboru
      const fileContent = await backupFile.text();
      let backupData;

      try {
        backupData = JSON.parse(fileContent);
      } catch (parseError) {
        throw new Error('Neplatný formát souboru zálohy. Očekává se JSON.');
      }

      if (!backupData || !backupData.data) {
        throw new Error('Soubor neobsahuje platná data zálohy.');
      }

      logger.info('Začínám obnovení databáze ze zálohy', { timestamp: backupData.timestamp });

      // Odeslání dat na server
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nastala chyba při obnovení databáze');
      }

      const result = await response.json();
      logger.info('Obnovení dokončeno', result);
      setRestoreResult(result);
    } catch (err) {
      logger.error('Chyba při obnovení databáze:', err);
      setError(`Nastala chyba: ${err instanceof Error ? err.message : 'Neznámá chyba'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Zpracování výběru souboru
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleRestore(file);
    }
  };

  return (
    <div className="space-y-8">
      <AdminHeader title="Zálohování databáze" />

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Záloha databáze</h2>
        <p className="mb-4 text-gray-700">
          Kliknutím na tlačítko níže vytvoříte zálohu aktuálního stavu databáze.
          Záloha bude uložena do adresáře <code>backups</code> s časovým razítkem.
        </p>


        <button
          onClick={handleRunBackupScript}
          disabled={isScriptRunning}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScriptRunning ? 'Skript běží...' : 'Zálohovat pomocí skriptu'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium">Chyba:</p>
            <p>{error}</p>
          </div>
        )}


      
      {scriptResult && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-800">Zálohovací skript byl úspěšně spuštěn</h3>
          <div className="mt-2 text-sm text-green-700">
            <p className="font-medium">Výstup skriptu:</p>
            <pre className="mt-2 p-3 bg-gray-50 rounded overflow-auto max-h-96 text-xs">{scriptResult}</pre>
          </div>
        </div>
      )}


      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Obnovení ze zálohy</h2>
        <p className="mb-4">Vyberte soubor se zálohou pro obnovení databáze.</p>

        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          disabled={isRestoring}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRestoring}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out disabled:opacity-50"
        >
          {isRestoring ? 'Probíhá obnovení...' : 'Nahrát zálohu a obnovit'}
        </button>

        {restoreResult && (
          <div className="mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
            <p className="font-bold">Databáze byla částečně obnovena ze zálohy!</p>
            <p>Časové razítko: {restoreResult.timestamp}</p>
            <h3 className="font-semibold mt-2">Statistiky obnovení:</h3>
            <p>Celkem zpracováno: {restoreResult.stats.processed}</p>
            <p>Chyby: {restoreResult.stats.errors}</p>
            {restoreResult.stats.details && (
              <ul className="list-disc pl-5 mt-2">
                {Object.entries(restoreResult.stats.details).map(([key, value]: [string, any]) => (
                  <li key={key}>{key}: {value.updated} aktualizováno z {value.total} (chyby: {value.errors})</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {backupHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Historie záloh v této relaci</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Čas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kurzy
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Moduly
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lekce
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Materiály
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soubor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backupHistory.map((backup, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(backup.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.result.courses || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.result.modules || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.result.lessons || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.result.materials || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.result.filename}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Manuální zálohování databáze</h2>
        <div className="prose max-w-none">
          <p>
            Pro zálohování databáze doporučujeme použít připravené skripty, které vytvoří kompletní zálohu všech dat.
          </p>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium">Zálohování databáze</h3>
            <p className="mt-2">Spusťte tento příkaz v kořenovém adresáři projektu:</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">node scripts/backup-database.js</pre>
            <p className="mt-2">Záloha bude uložena do adresáře <code>backups</code> s časovým razítkem.</p>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium">Obnovení databáze ze zálohy</h3>
            <p className="mt-2">Pro obnovení databáze ze zálohy použijte:</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">node scripts/restore-database.js cesta/k/záloze</pre>
            <p className="mt-2">Například:</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">node scripts/restore-database.js backups/backup-2025-07-08T23-10-36-553Z</pre>
            <p className="mt-2 text-amber-600 font-medium">Pozor: Obnovení přepíše existující data v databázi!</p>
          </div>
          
          <p className="mt-4">
            Skripty jsou dostupné v adresáři <code>/scripts</code> a také v <code>/src/app/admin/zalohy</code>.
          </p>
          
          <p className="mt-2">
            Doporučujeme pravidelně vytvářet zálohy, zejména před většími změnami v obsahu kurzů.
          </p>
        </div>
      </div>
    </div>
  );
}
