const fs = require('fs');
const https = require('https');
const path = require('path');

// URL obrázku pro kurz (neutrální obrázek s tématem vzdělávání)
const imageUrl = 'https://placehold.co/800x450/e9f5ff/2d7ebc.jpg?text=Jak+ukaznit+zlobivou+hlavu';

// Cílová cesta pro uložení
const targetPath = './public/images/courses/komunikace.jpg';

// Vytvoření adresáře, pokud neexistuje
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Stáhnutí obrázku
https.get(imageUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Chyba při stahování: ${response.statusCode}`);
    return;
  }
  
  const fileStream = fs.createWriteStream(targetPath);
  response.pipe(fileStream);
  
  fileStream.on('finish', () => {
    fileStream.close();
    console.log(`Obrázek kurzu byl úspěšně stažen do ${targetPath}`);
  });
}).on('error', (err) => {
  console.error(`Chyba při stahování: ${err.message}`);
});
