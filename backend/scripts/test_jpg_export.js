const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const soffice = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

async function testJpgExport() {
  const input = path.join(__dirname, 'multi.pdf');
  const outputDir = path.join(__dirname, 'jpg_test');
  
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log('Converting PDF to JPGs via LibreOffice...');
  await new Promise((resolve) => {
      execFile(soffice, [
          '--headless',
          '--convert-to', 'jpg',
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

testJpgExport();
