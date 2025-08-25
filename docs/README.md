# Online Kurzy - Aleš Kalina

Moderní webová aplikace pro prodej a přehrávání online kurzů.

## Funkce

- Přehled dostupných kurzů (zdarma i placené)
- Přihlašování pomocí e-mailu (magic link)
- Přehrávání video lekcí
- Přístup k doplňkovým materiálům
- Responzivní design pro všechna zařízení
- Administrátorské rozhraní pro správu kurzů, modulů a lekcí

## Technologie

- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS pro styling
- Prisma ORM pro práci s databází
- PostgreSQL databáze (Vercel Postgres)
- Vercel pro hosting a nasazení
- NextAuth.js pro autentizaci
- Integrace s FluentCRM (WordPress)
- Připraveno pro integraci s Bunny.net nebo Vimeo Pro

## Instalace a spuštění

```bash
# Instalace závislostí
npm install

# Nastavení proměnných prostředí
cp .env.example .env
# Upravte .env soubor s vašimi údaji

# Spuštění vývojového serveru
npm run dev

# Sestavení pro produkci
npm run build

# Spuštění produkční verze
npm start
```

## Nasazení na Vercel

1. Vytvořte účet na [Vercel](https://vercel.com) pokud ho ještě nemáte
2. Nainstalujte Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Přihlaste se k Vercel z příkazové řádky:
   ```bash
   vercel login
   ```
4. Nasaďte aplikaci:
   ```bash
   vercel
   ```
5. Pro produkční nasazení použijte:
   ```bash
   vercel --prod
   ```

## Nastavení databáze

1. Vytvořte databázi PostgreSQL na Vercel:
   - Jděte do Vercel dashboardu
   - Vyberte váš projekt
   - Jděte do "Storage" sekce
   - Vytvořte novou PostgreSQL databázi

2. Zkopírujte connection string do .env souboru

3. Spusťte migraci databáze:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Pro migraci existujících kurzů do databáze spusťte:
   ```bash
   npx ts-node src/scripts/migrate-courses.ts
   ```

## Administrátorské rozhraní

Administrátorské rozhraní je dostupné na `/admin`. Zde můžete:

- Spravovat kurzy (vytvářet, upravovat, mazat)
- Přidávat a upravovat moduly v kurzech
- Přidávat a upravovat lekce v modulech
- Nahrávat materiály k lekcím

## Struktura projektu

- `/app` - Next.js 14 App Router stránky a komponenty
- `/components` - Znovupoužitelné React komponenty
- `/public` - Statické soubory
- `/lib` - Pomocné funkce a utility
- `/types` - TypeScript typy
- `/hooks` - Custom React hooks
- `/prisma` - Prisma schéma a migrace
- `/api` - API endpointy
- `/scripts` - Skripty pro správu dat
