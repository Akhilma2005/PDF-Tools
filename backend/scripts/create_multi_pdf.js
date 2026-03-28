const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createMultiPagePdf() {
  const merged = await PDFDocument.create();
  merged.addPage([600, 800]).drawText('Page 1');
  merged.addPage([600, 800]).drawText('Page 2');
  const bytes = await merged.save();
  fs.writeFileSync(path.join(__dirname, 'multi.pdf'), bytes);
  console.log('Created multi.pdf');
}

createMultiPagePdf();
