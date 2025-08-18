/**
 * Příklad použití loggeru v kódu
 */

import logger from '@/utils/logger';

/**
 * Ukázka použití loggeru v administraci kurzů
 */
export function loggerExample() {
  // Informační logy - zobrazují se pouze v development prostředí
  logger.info('Načítám kurz:', 'id-kurzu');
  logger.info('Kurz úspěšně načten:', 'id-kurzu');
  logger.info('Počet modulů v kurzu:', 5);

  // Varovné logy - zobrazují se pouze v development prostředí
  logger.warn('Kurz nemá žádné moduly!');
  logger.warn('Chybějící data v kurzu');

  // Chybové logy - zobrazují se i v produkci
  logger.error('HTTP chyba při načítání kurzu:', 404, 'Not Found');
  logger.error('Síťová chyba při načítání kurzu');
  logger.error('Chyba při načítání kurzu:', new Error('Network error'));

  // Debug logy - zobrazují se pouze v development prostředí
  logger.debug('Detail odpovědi:', { status: 200, data: { id: 'kurz-123' } });

  // Kritické logy - zobrazují se i v produkci
  logger.critical('Kritická chyba při zálohování databáze!', 'Kontaktujte administrátora');
}

/**
 * Jak nahradit existující console.log volání:
 * 
 * 1. Importovat logger:
 *    import logger from '@/utils/logger';
 * 
 * 2. Nahradit console.log za logger.info nebo logger.debug:
 *    console.log('Načítám kurz:', id) -> logger.info('Načítám kurz:', id)
 * 
 * 3. Nahradit console.warn za logger.warn:
 *    console.warn('Varování') -> logger.warn('Varování')
 * 
 * 4. Nahradit console.error za logger.error:
 *    console.error('Chyba') -> logger.error('Chyba')
 * 
 * 5. Pro kritické chyby, které musí být viditelné i v produkci:
 *    console.error('Kritická chyba') -> logger.critical('Kritická chyba')
 */
