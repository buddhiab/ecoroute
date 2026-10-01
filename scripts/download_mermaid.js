const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, '../docs/thesis-figures');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mmd'));

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => reject(new Error(`Failed with ${res.statusCode}: ${data}`)));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const file of files) {
    const filePath = path.join(dir, file);
    const code = fs.readFileSync(filePath, 'utf8');
    
    const state = { code, mermaid: { theme: "default" } };
    
    // Convert to base64url format for mermaid.ink
    const base64 = Buffer.from(JSON.stringify(state))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
      
    const url = `https://mermaid.ink/img/pako:${base64}?bgColor=ffffff&type=png&width=2000`;
    // Note: mermaid.ink natively accepts pako compressed, but just base64 of JSON works without 'pako:' prefix if using /img/{base64}
    const fallbackUrl = `https://mermaid.ink/img/${base64}?bgColor=ffffff&type=png&width=2000`;
    
    const dest = filePath.replace('.mmd', '.png');
    
    console.log(`Downloading ${dest}...`);
    try {
      await download(fallbackUrl, dest);
      console.log(`Success: ${file}`);
    } catch (e) {
      console.error(`Error with ${file}:`, e.message);
    }
  }
}

run();
