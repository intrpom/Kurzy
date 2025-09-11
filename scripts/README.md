# Database Scripts

Tento adresář obsahuje utility scripty pro správu databáze.

## 🟢 Aktuální a bezpečné scripty

### `backup-db.js`
**Účel:** Vytváření kompletních záloh databáze  
**Použití:** `node scripts/backup-db.js`  
**Výstup:** Záloha do `backups/backup-YYYY-MM-DDTHH-mm-ss-sssZ/`  
**Podporuje:** Všechny tabulky včetně blog postů, auth tokenů, pokroku uživatelů

### `restore-database-safe.js`
**Účel:** Bezpečné obnovení databáze ze zálohy  
**Použití:** `node scripts/restore-database-safe.js cesta/k/záloze`  
**Bezpečnost:** 
- Automatická safety záloha před obnovením
- Kontrola integrity zálohy
- Vyžaduje potvrzení "OBNOVIT"
- Transakční obnovení (vše nebo nic)

### `count-items.js`
**Účel:** Rychlá kontrola počtu záznamů v databázi  
**Použití:** `node scripts/count-items.js`  
**Výstup:** Statistiky kurzů, modulů, lekcí, blog postů, uživatelů

### `set-admin.js`
**Účel:** Nastavení admin role pro uživatele  
**Použití:** `node scripts/set-admin.js email@example.com`  
**Funkce:** Najde uživatele podle emailu a nastaví mu roli 'admin'

## 📁 Archiv

### `archive/`
Obsahuje zastaralé scripty, které byly odstraněny z produkce:
- `restore-database.js` - nebezpečný, nepodporoval všechny tabulky
- `check-database.js` - zastaralý, nahrazen count-items.js

### `archive/old-migrations/`
Obsahuje staré migrační scripty z počátečního nastavení:
- `import-courses.js` - jednorázový import kurzů
- `migrate-courses.ts` - migrace z TypeScript souborů
- `setup-database.ts` - počáteční nastavení databáze

## ⚠️ Bezpečnostní upozornění

- **Vždy** vytvořte zálohu před jakýmikoliv změnami v databázi
- Používejte pouze `restore-database-safe.js` pro obnovení
- Testujte scripty nejdřív na vývojové databázi
- Archivované scripty **NEPOUŽÍVEJTE** - jsou zastaralé a nebezpečné

## 🔄 Doporučený workflow

1. **Před změnami:** `node scripts/backup-db.js`
2. **Kontrola stavu:** `node scripts/count-items.js`
3. **V případě problémů:** `node scripts/restore-database-safe.js backups/nejnovější-záloha`

## 📞 Podpora

Při problémech se scripty kontaktujte vývojáře nebo se podívejte do dokumentace v `docs/`.
