const { PDFDocument, StandardFonts } = require('pdf-lib');
const { runLibreOffice } = require('./utils/libreoffice');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

async function run() {
  // Create a 20-page PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 20; i++) {
    const page = pdfDoc.addPage([595, 842]);
    page.drawText(`Page ${i}\n${'This is test content. '.repeat(50)}`, { x: 50, y: 780, font, size: 12, maxWidth: 495, lineHeight: 16 });
  }

  const uuid = uuidv4();
  const inputPath  = path.join(__dirname, 'uploads', `${uuid}.pdf`);
  const outputDir  = path.join(__dirname, 'outputs');
  const convertedPath = path.join(outputDir, `${uuid}.docx`);

  fs.writeFileSync(inputPath, await pdfDoc.save());
  console.log(`Created 20-page PDF: ${fs.statSync(inputPath).size} bytes`);

  const start = Date.now();
  await runLibreOffice([
    '--infilter=writer_pdf_import',
    '--convert-to', 'docx:MS Word 2007 XML',
    '--outdir', outputDir,
    inputPath,
  ]);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const exists = fs.existsSync(convertedPath);
  const size   = exists ? fs.statSync(convertedPath).size : 0;
  const buf    = exists ? fs.readFileSync(convertedPath) : null;
  const valid  = buf && buf[0] === 0x50 && buf[1] === 0x4B;

  console.log(`Time: ${elapsed}s | exists: ${exists} | size: ${size} | validZip: ${valid}`);
  if (valid) console.log('✅ SUCCESS');
  else console.log('❌ FAILED');

  fs.unlinkSync(inputPath);
  if (exists) fs.unlinkSync(convertedPath);
}

run().catch(console.error);
