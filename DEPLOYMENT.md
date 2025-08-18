# Nasazení aplikace na Vercel

Tento dokument obsahuje podrobný návod, jak nasadit aplikaci Online Kurzy na Vercel a nastavit databázi pro správu kurzů.

## 1. Příprava projektu

Ujistěte se, že máte nainstalované všechny potřebné závislosti:

```bash
npm install
```

## 2. Nastavení Vercel účtu a CLI

1. Pokud ještě nemáte účet na [Vercel](https://vercel.com), vytvořte si ho.
2. Nainstalujte Vercel CLI:

```bash
npm install -g vercel
```

3. Přihlaste se ke svému Vercel účtu:

```bash
vercel login
```

## 3. Vytvoření projektu na Vercel

Nasaďte projekt na Vercel:

```bash
vercel
```

Během nasazení vám CLI položí několik otázek:
- Potvrďte, že chcete nastavit a nasadit projekt
- Vyberte existující projekt nebo vytvořte nový
- Potvrďte adresář projektu

Po dokončení nasazení získáte URL vašeho projektu.

## 4. Nastavení databáze na Vercel

1. Přejděte na [Vercel Dashboard](https://vercel.com/dashboard)
2. Vyberte váš projekt
3. Přejděte do sekce "Storage"
4. Klikněte na "Connect Database" a vyberte "Postgres"
5. Vytvořte novou databázi nebo připojte existující
6. Po vytvoření databáze zkopírujte connection string

## 5. Nastavení proměnných prostředí

1. V Vercel dashboardu přejděte do sekce "Settings" vašeho projektu
2. Klikněte na "Environment Variables"
3. Přidejte následující proměnnou:
   - `DATABASE_URL`: Vložte connection string z předchozího kroku

## 6. Inicializace databáze

Po nasazení projektu a nastavení proměnných prostředí je třeba inicializovat databázi:

1. Lokálně vytvořte `.env` soubor s connection stringem z Vercel:

```
DATABASE_URL="váš_connection_string_z_vercel"
```

2. Vytvořte a aplikujte migraci:

```bash
npx prisma migrate deploy
```

3. Pokud chcete migrovat existující kurzy z TypeScript souborů do databáze:

```bash
npx ts-node src/scripts/migrate-courses.ts
```

## 7. Produkční nasazení

Po úspěšném nastavení databáze a aplikování migrací nasaďte produkční verzi:

```bash
vercel --prod
```

## 8. Přístup k administrátorskému rozhraní

Administrátorské rozhraní je dostupné na adrese:

```
https://váš-projekt.vercel.app/admin
```

Zde můžete spravovat kurzy, moduly a lekce.

## Řešení problémů

### Problém s připojením k databázi

Pokud se setkáte s chybou "Can't reach database server", ujistěte se, že:
- Connection string v proměnných prostředí je správný
- Firewall neblokuje připojení k databázi
- IP adresa, ze které se připojujete, je povolena v nastavení databáze

### Chyba při migraci

Pokud se setkáte s chybou během migrace:
1. Zkontrolujte logy chyb
2. Ujistěte se, že máte správná oprávnění k databázi
3. Zkuste resetovat databázi pomocí `npx prisma migrate reset` (pozor, toto smaže všechna data)

### Problémy s nasazením

Pokud máte problémy s nasazením na Vercel:
1. Zkontrolujte logy nasazení v Vercel dashboardu
2. Ujistěte se, že všechny závislosti jsou správně specifikovány v `package.json`
3. Zkontrolujte, zda build proces neselhal kvůli chybám v kódu
