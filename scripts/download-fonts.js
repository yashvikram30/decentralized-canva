#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Create fonts directory if it doesn't exist
const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Font URLs from Google Fonts (these are free to use)
const fonts = [
  {
    name: 'Arial',
    url: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVIGxA.woff2',
    filename: 'arial.woff2'
  },
  {
    name: 'Helvetica',
    url: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVIGxA.woff2',
    filename: 'helvetica.woff2'
  },
  {
    name: 'Times New Roman',
    url: 'https://fonts.gstatic.com/s/crimsontext/v19/wlp2gwHKFkZgtmSR3NB0oRJXGh3rtEQ.woff2',
    filename: 'times-new-roman.woff2'
  },
  {
    name: 'Georgia',
    url: 'https://fonts.gstatic.com/s/georgia/v18/4UaHrEtDsYBbgWq7jMVTf_mX8xv.woff2',
    filename: 'georgia.woff2'
  },
  {
    name: 'Verdana',
    url: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVIGxA.woff2',
    filename: 'verdana.woff2'
  },
  {
    name: 'Courier New',
    url: 'https://fonts.gstatic.com/s/sourcecodepro/v23/HI_SiYsKILxRpg3hIP6sJ7fM7PqlPevWnsUnxG.woff2',
    filename: 'courier-new.woff2'
  },
  {
    name: 'Impact',
    url: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVIGxA.woff2',
    filename: 'impact.woff2'
  },
  {
    name: 'Comic Sans MS',
    url: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVIGxA.woff2',
    filename: 'comic-sans-ms.woff2'
  }
];

function downloadFont(font) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, font.filename);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${font.name} already exists`);
      resolve();
      return;
    }
    
    console.log(`Downloading ${font.name}...`);
    
    const file = fs.createWriteStream(filePath);
    
    https.get(font.url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded ${font.name}`);
          resolve();
        });
      } else {
        console.log(`✗ Failed to download ${font.name}: ${response.statusCode}`);
        resolve(); // Don't fail the whole process
      }
    }).on('error', (err) => {
      console.log(`✗ Error downloading ${font.name}:`, err.message);
      resolve(); // Don't fail the whole process
    });
  });
}

async function downloadAllFonts() {
  console.log('Starting font download...');
  
  for (const font of fonts) {
    await downloadFont(font);
  }
  
  console.log('Font download completed!');
}

downloadAllFonts().catch(console.error);
