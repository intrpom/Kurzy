/**
 * Jednoduchý logger, který automaticky vypne běžné logy v produkci
 */

// Zjistíme, zda jsme v produkčním prostředí
const isProduction = process.env.NODE_ENV === 'production';

// Vytvoříme náhradu za console.log
const logger = {
  // Běžné logy - pouze v development
  log: isProduction ? () => {} : console.log,
  info: isProduction ? () => {} : console.log,
  debug: isProduction ? () => {} : console.log,
  
  // Varování - pouze v development
  warn: isProduction ? () => {} : console.warn,
  
  // Chyby - zobrazují se vždy
  error: console.error,
  
  // Kritické logy - zobrazují se vždy
  critical: (...args: any[]) => console.log('[CRITICAL]', ...args)
};

export default logger;
