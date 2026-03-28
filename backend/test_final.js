const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const { findSoffice } = require('./utils/libreoffice');

const outputDir = path.join(__dirname, 'outputs');
const uploadsDir = path.join(__dirname, 'uploads');

async function run() {
  // Step 1: create a real text PDF (simulating user upload)
  const uuid = uuidv4();
  const inputPath = path.join(uploadsDir, `${uuid}.pdf`);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('Hello World\nThis is a real test.\nLine 3.', { x: 50, y: 750, font, size: 14 });
  fs.writeFileSync(inputPath, await pdfDoc.save());
  console.log('1. Created PDF:', inputPath);

  // Step 2: run conversion exactly as controller does
  const convertedPath = path.join(outputDir, `${uuid}.docx`);
  if (fs.existsSync(convertedPath)) fs.unlinkSync(convertedPath);

  const soffice = findSoffice();
  const result = spawnSync(soffice, [
    '--headless',
    '--infilter=writer_pdf_import',
    '--convert-to', 'docx:MS Word 2007 XML',
    '--outdir', outputDir,
    inputPath,
  ], { timeout: 60000, encoding: 'utf8' });

  console.log('2. LibreOffice stderr:', result.stderr?.trim().slice(0, 100));

  // Step 3: validate
  if (!fs.existsSync(convertedPath)) {
    console.error('FAIL: output not found'); process.exit(1);
  }
  const buf = fs.readFileSync(convertedPath);
  const isValidZip = buf[0] === 0x50 && buf[1] === 0x4B;
  console.log('3. Output size:', buf.length, '| Valid ZIP (DOCX):', isValidZip);

  if (!isValidZip) {
    console.error('FAIL: not a valid DOCX'); process.exit(1);
  }

  // Step 4: rename to final UUID (as controller does)
  const outName = `${uuidv4()}.docx`;
  const finalPath = path.join(outputDir, outName);
  fs.renameSync(convertedPath, finalPath);
  console.log('4. Final file:', finalPath, '| size:', fs.statSync(finalPath).size);
  console.log('SUCCESS — restart backend and test again');

  // cleanup
  fs.unlinkSync(inputPath);
  fs.unlinkSync(finalPath);
}

run().catch(console.error);
