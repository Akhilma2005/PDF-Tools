const { spawnSync } = require('child_process');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { findSoffice } = require('./utils/libreoffice');

const soffice = findSoffice();
const outputDir = path.join(__dirname, 'outputs');
const inputPath = path.join(outputDir, 'test_text.pdf');

async function run() {
  // Create a real text-based PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('Hello World\nThis is a test PDF document.\nLine three of text.', {
    x: 50, y: 750, font, size: 14,
  });
  fs.writeFileSync(inputPath, await pdfDoc.save());
  console.log('Test PDF created:', inputPath, '| size:', fs.statSync(inputPath).size);

  const filters = ['docx:writer8', 'odt:writer8'];

  for (const filter of filters) {
    const ext = filter.split(':')[0];
    const baseOut = path.join(outputDir, `test_text.${ext}`);
    if (fs.existsSync(baseOut)) fs.unlinkSync(baseOut);

    const r = spawnSync(soffice, [
      '--headless', '--convert-to', filter, '--outdir', outputDir, inputPath
    ], { timeout: 30000, encoding: 'utf8' });

    const exists = fs.existsSync(baseOut);
    const size = exists ? fs.statSync(baseOut).size : 0;
    let valid = false;
    if (exists && size > 100) {
      const buf = fs.readFileSync(baseOut);
      valid = buf[0] === 0x50 && buf[1] === 0x4B;
    }
    console.log(`filter="${filter}" exists=${exists} size=${size} validZip=${valid}`);
    console.log(`  stderr: ${(r.stderr || '').trim().slice(0, 120)}`);
    if (exists) fs.unlinkSync(baseOut);
  }
}

run().catch(console.error);
