const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const soffice = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'; // Use verified path

async function testCompress() {
  const input = path.join(__dirname, 'test.pdf');
  const outputDir = __dirname;
  
  if (!fs.existsSync(input)) {
    console.log('Please provide a test.pdf in the scripts folder');
    return;
  }

  const startSize = fs.statSync(input).size;
  console.log('Original size:', startSize);

  // Try several filter variations
  const filters = [
      'pdf:draw_pdf_Export',
      'pdf:draw_pdf_Export:{"Quality":{"type":"long","value":"10"}}' // Very low quality for testing
  ];

  for (const filter of filters) {
      console.log(`Testing filter: ${filter}`);
      await new Promise((resolve) => {
          execFile(soffice, [
              '--headless',
              '--convert-to', filter,
              '--outdir', outputDir,
              input
          ], (err, stdout, stderr) => {
              if (err) console.log('Error:', err.message);
              resolve();
          });
      });
      
      // Wait a bit for file to be written
      const outPath = path.join(outputDir, 'test.pdf'); // Note: LibreOffice might overwrite or append
      if (fs.existsSync(outPath)) {
          const newSize = fs.statSync(outPath).size;
          console.log(`New size with ${filter}:`, newSize, `(${Math.round(newSize/startSize*100)}%)`);
      }
  }
}

testCompress();
