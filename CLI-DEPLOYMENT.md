# Nasazení aplikace pomocí Vercel CLI (přímé nasazení)

Tento dokument obsahuje podrobný návod, jak přímo nasadit aplikaci Online Kurzy na Vercel bez použití GitHubu a nastavit databázi pomocí Vercel CLI.

## 1. Příprava projektu

Ujistěte se, že máte nainstalované všechny potřebné závislosti:

```bash
npm install
```

## 2. Nastavení Vercel CLI

1. Nainstalujte Vercel CLI globálně:

```bash
npm install -g vercel
```

2. Přihlaste se ke svému Vercel účtu:

```bash
vercel login
```

## 3. Přímé nasazení z lokálního adresáře

Nasaďte projekt přímo z vašeho lokálního adresáře na Vercel:

```bash
vercel
```

Během nasazení vám CLI položí několik otázek:
- Potvrďte, že chcete nastavit a nasadit projekt
- Vyberte existující projekt nebo vytvořte nový
- Potvrďte adresář projektu

Po dokončení nasazení získáte URL vašeho projektu. Všechny soubory budou nahrány přímo z vašeho počítače bez potřeby GitHubu.

## 4. Vytvoření a připojení PostgreSQL databáze pomocí CLI

1. Vytvořte novou PostgreSQL databázi pomocí Vercel CLI:

```bash
vercel storage create postgres kurzy-db --yes
```

2. Připojte databázi k vašemu projektu:

```bash
vercel link
# Vyberte váš projekt

vercel env pull
# Stáhne proměnné prostředí včetně DATABASE_URL

vercel storage connect kurzy-db
# Propojí databázi s vaším projektem
```

## 5. Inicializace databáze pomocí Prisma

Po připojení databáze a stažení proměnných prostředí:

1. Vytvořte migraci:

```bash
npx prisma migrate dev --name init
```

2. Nasaďte migraci:

```bash
npx prisma migrate deploy
```

3. Migrujte existující data kurzů do databáze:

```bash
npx ts-node src/scripts/migrate-courses.ts
```

## 6. Produkční nasazení

Po úspěšném nastavení databáze a aplikování migrací nasaďte produkční verzi:

```bash
vercel --prod
```

## 7. Správa proměnných prostředí pomocí CLI

Pokud potřebujete přidat nebo upravit proměnné prostředí:

```bash
# Přidání nové proměnné
vercel env add NAZEV_PROMENNE

# Seznam všech proměnných
vercel env ls

# Odstranění proměnné
vercel env rm NAZEV_PROMENNE
```

## 8. Správa databáze pomocí CLI

```bash
# Seznam všech databází
vercel storage ls

# Informace o konkrétní databázi
vercel storage inspect kurzy-db

# Odstranění databáze (POZOR: nevratná operace)
vercel storage rm kurzy-db --yes
```

## 9. Další užitečné CLI příkazy

```bash
# Zobrazení logů
vercel logs

# Informace o nasazení
vercel inspect

# Seznam všech nasazení
vercel ls

# Odstranění nasazení
vercel remove kurzy
```

## Řešení problémů

### Problém s připojením k databázi

Pokud se setkáte s chybou "Can't reach database server":

```bash
# Zkontrolujte, zda je databáze správně připojena
vercel storage inspect kurzy-db

# Zkontrolujte proměnné prostředí
vercel env ls
```

### Chyba při migraci

Pokud se setkáte s chybou během migrace:

```bash
# Reset databáze (POZOR: smaže všechna data)
npx prisma migrate reset

# Kontrola stavu databáze
npx prisma db pull
```

### Problémy s nasazením

Pokud máte problémy s nasazením:

```bash
# Zkontrolujte logy nasazení
vercel logs

# Nasaďte v debug módu
vercel --debug
```
