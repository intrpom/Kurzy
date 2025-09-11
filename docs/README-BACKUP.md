# 🔒 Backup Script - Automatická kontrola kompletnosti

## 🎯 Účel
Backup script nyní automaticky kontroluje, jestli se zálohují všechny tabulky z databáze. Pokud přidáš novou tabulku do Prisma schématu, script tě upozorní, že je potřeba ho aktualizovat.

## 🚀 Jak to funguje

### Automatická kontrola
Při každém spuštění `node scripts/backup-db.js` se:
1. **Načtou všechny tabulky** z databáze
2. **Porovnají se** se seznamem zálohovaných tabulek
3. **Zobrazí se varování** pokud nějaká tabulka chybí

### Příklad výstupu
```
🔍 0. Kontroluji kompletnost zálohování...
   📋 Nalezeno 11 tabulek v databázi
   💾 Zálohuje se 10 tabulek

⚠️  VAROVÁNÍ: Nalezeny tabulky, které se NEZÁLOHUJÍ:
   ❌ NewTable

🔧 AKCE POTŘEBNÁ: Aktualizuj backup script a přidej zálohu těchto tabulek!
   1. Přidej zálohu tabulky do funkce backupDatabase()
   2. Přidej tabulku do seznamu backedUpTables v checkBackupCompleteness()
   3. Aktualizuj metadata a rapport
```

## 🛠️ Jak přidat novou tabulku do zálohování

Když přidáš novou tabulku (např. `Notifications`), musíš:

### 1. Přidat zálohu tabulky
V funkci `backupDatabase()` přidej:
```javascript
// Záloha notifikací
const notifications = await prisma.notification.findMany();
fs.writeFileSync(
  path.join(currentBackupDir, 'notifications.json'),
  JSON.stringify(notifications, null, 2)
);
```

### 2. Aktualizovat seznam zálohovaných tabulek
V funkci `checkBackupCompleteness()` přidej do pole `backedUpTables`:
```javascript
const backedUpTables = [
  'User',
  'Course',
  // ... ostatní tabulky
  'Notifications'  // ← PŘIDEJ NOVOU TABULKU
];
```

### 3. Aktualizovat metadata
V objektu `metadata.stats` přidej:
```javascript
const metadata = {
  timestamp: new Date().toISOString(),
  stats: {
    // ... ostatní statistiky
    notifications: notifications.length  // ← PŘIDEJ STATISTIKU
  }
};
```

### 4. Aktualizovat rapport
Přidej do kontrolního přehledu:
```javascript
// Notifikace
const notificationsStatus = notifications.length > 0 ? '✅ ZÁLOHÁNO' : '❌ PRÁZDNÉ';
const notificationsNote = notifications.length > 0 ? 'Systémové notifikace' : 'Žádné notifikace';
console.log(`║ 🔔 Notifikace          │ ${notifications.length.toString().padEnd(8)} │ ${notificationsStatus.padEnd(13)} │ ${notificationsNote.padEnd(22)} ║`);
```

## 🔍 Aktuálně zálohované tabulky

- ✅ **User** - uživatelé
- ✅ **Course** - kurzy (včetně vnořených Module, Lesson, Material)
- ✅ **BlogPost** - minikurzy
- ✅ **UserCourse** - přístupy uživatelů ke kurzům
- ✅ **UserLessonProgress** - pokrok v lekcích
- ✅ **UserMiniCourse** - nákupy minikurzů
- ✅ **AuthToken** - bezpečnostní tokeny

## 🛡️ Bezpečnostní opatření

- Script **nikdy nepřeskočí** zálohu bez upozornění
- **Vždy se zobrazí varování** pokud chybí tabulka
- **Detailní rapport** ukazuje co se zálohuje
- **Automatická kontrola** při každém spuštění

## 📝 Poznámky

- Tabulky `Module`, `Lesson`, `Material` se zálohují vnořeně v `Course`
- Prázdné tabulky se také zálohují (důležité pro obnovení struktury)
- Script pokračuje i při varování, ale upozorní tě na problém
