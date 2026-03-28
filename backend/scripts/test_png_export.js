const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const soffice = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

async function testPngExport() {
  const input = path.join(__dirname, 'multi.pdf');
  const outputDir = path.join(__dirname, 'png_test');

  
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  console.log('Converting PDF to PNGs via LibreOffice...');
  await new Promise((resolve) => {
      execFile(soffice, [
          '--headless',
          '--convert-to', 'png',
          '--outdir', outputDir,
          input
      ], (err, stdout, stderr) => {
          if (err) console.log('Error:', err.message);
          resolve();
      });
  });

  const files = fs.readdirSync(outputDir);
  console.log('Files generated:', files);
}

testPngExport();
