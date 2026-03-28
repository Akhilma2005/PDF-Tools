const { spawnSync } = require('child_process');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { findSoffice } = require('./utils/libreoffice');

const soffice = findSoffice();
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir  = path.join(__dirname, 'outputs');

async function run() {
  const uuid = uuidv4();
  const inputPath = path.join(uploadsDir, `${uuid}.pdf`);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('Hello World\nThis is a test document.\nLine 3.', { x: 50, y: 750, font, size: 14 });
  fs.writeFileSync(inputPath, await pdfDoc.save());
  console.log('Input:', inputPath, '| size:', fs.statSync(inputPath).size);

  const tests = [
    // correct way: tell LO to open as PDF via writer_pdf_import, then export as docx
    ['--infilter=writer_pdf_import', '--convert-to', 'docx:writer8'],
    ['--infilter=writer_pdf_import', '--convert-to', 'docx:MS Word 2007 XML'],
    ['--infilter=writer_pdf_import', '--convert-to', 'odt:writer8'],
  ];

  for (const args of tests) {
    const label = args.join(' ');
    const ext = args[args.indexOf('--convert-to') + 1].split(':')[0];
    const expectedOut = path.join(outputDir, `${uuid}.${ext}`);
    if (fs.existsSync(expectedOut)) fs.unlinkSync(expectedOut);

    const r = spawnSync(soffice, [
      '--headless', ...args, '--outdir', outputDir, inputPath
    ], { timeout: 30000, encoding: 'utf8' });

    const exists = fs.existsSync(expectedOut);
    const size = exists ? fs.statSync(expectedOut).size : 0;
    let validZip = false;
    if (exists && size > 100) {
      const buf = fs.readFileSync(expectedOut);
      validZip = buf[0] === 0x50 && buf[1] === 0x4B;
    }
    console.log(`\n[${label}]`);
    console.log(`  exists=${exists} size=${size} validZip=${validZip}`);
    console.log(`  stderr: ${(r.stderr || '').trim().slice(0, 150)}`);
    if (exists) fs.unlinkSync(expectedOut);
  }

  fs.unlinkSync(inputPath);
}

run().catch(console.error);
