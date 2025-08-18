// Test script pro diagnostiku zálohovacího API
const https = require('https');
const http = require('http');

// Konfigurace
const isProduction = false;
const baseUrl = isProduction 
  ? 'https://kurzy-aleskalina.vercel.app' 
  : 'http://localhost:3000';
// Vytvoření správného formátu session cookie
const sessionData = {
  id: "cmcoz27bc0000n1pv09wcuao7",  // user_id
  email: "akalina@seznam.cz",
  role: "admin"
};

// Zakódování do Base64
const base64Session = Buffer.from(JSON.stringify(sessionData)).toString('base64');
const adminCookie = `session=${base64Session}`;

console.log(`Testování zálohovacího API na ${baseUrl}/api/admin/backup`);

// Vytvoření požadavku
const options = {
  hostname: isProduction ? 'kurzy-aleskalina.vercel.app' : 'localhost',
  port: isProduction ? 443 : 3000,
  path: '/api/admin/backup',
  method: 'POST',
  headers: {
    'Cookie': adminCookie
  }
};

// Výběr protokolu podle prostředí
const client = isProduction ? https : http;

// Odeslání požadavku
const req = client.request(options, (res) => {
  console.log(`Stavový kód: ${res.statusCode}`);
  console.log('Hlavičky odpovědi:');
  console.log(res.headers);
  
  let data = '';
  
  // Zpracování dat z odpovědi
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Po dokončení odpovědi
  res.on('end', () => {
    try {
      if (res.statusCode === 200) {
        const jsonData = JSON.parse(data);
        console.log('Odpověď byla úspěšně zpracována jako JSON');
        console.log('Statistiky zálohy:');
        console.log(`- Počet uživatelů: ${jsonData.stats.users}`);
        console.log(`- Počet kurzů: ${jsonData.stats.courses}`);
        console.log(`- Počet modulů: ${jsonData.stats.modules}`);
        console.log(`- Počet lekcí: ${jsonData.stats.lessons}`);
        console.log(`- Počet materiálů: ${jsonData.stats.materials}`);
        console.log(`- Počet přístupů ke kurzům: ${jsonData.stats.userCourses}`);
        console.log(`- Počet auth tokenů: ${jsonData.stats.authTokens}`);
      } else {
        console.log('Odpověď:');
        console.log(data.substring(0, 500) + (data.length > 500 ? '...' : ''));
      }
    } catch (error) {
      console.error('Chyba při zpracování odpovědi:', error);
      console.log('Prvních 500 znaků odpovědi:');
      console.log(data.substring(0, 500) + (data.length > 500 ? '...' : ''));
    }
  });
});

// Zpracování chyb
req.on('error', (error) => {
  console.error('Chyba při požadavku:', error);
});

// Ukončení požadavku
req.end();
