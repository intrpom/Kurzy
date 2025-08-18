const fs = require('fs');
const https = require('https');

// URL jednoduchého placeholder obrázku (neutrální šedý obrázek s textem)
const imageUrl = 'https://placehold.co/800x600/e0e0e0/666666.jpg?text=Kurz';

// Cílová cesta pro uložení
const targetPath = './public/images/placeholder-course.jpg';

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
    console.log(`Placeholder obrázek byl úspěšně stažen do ${targetPath}`);
  });
}).on('error', (err) => {
  console.error(`Chyba při stahování: ${err.message}`);
});
