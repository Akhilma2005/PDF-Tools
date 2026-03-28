const { spawnSync } = require('child_process');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { findSoffice } = require('./utils/libreoffice');

async function run() {
  const soffice = findSoffice();
  const uploadsDir = path.join(__dirname, 'uploads');
  const outputDir  = path.join(__dirname, 'outputs');

  const uuid = uuidv4();
  const inputPath = path.join(uploadsDir, `${uuid}.pdf`);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('Test document', { x: 50, y: 750, font, size: 14 });
  fs.writeFileSync(inputPath, await pdfDoc.save());

  const result = spawnSync(soffice, [
    '--headless',
    '--infilter=writer_pdf_import',
    '--convert-to', 'docx:MS Word 2007 XML',
    '--outdir', outputDir,
    inputPath,
  ], { timeout: 300000 });

  console.log('status:', result.status);
  console.log('stderr buffer:', JSON.stringify(result.stderr?.toString()));
  console.log('stdout buffer:', JSON.stringify(result.stdout?.toString()));

  const convertedPath = path.join(outputDir, `${uuid}.docx`);
  console.log('output exists:', fs.existsSync(convertedPath));

  fs.unlinkSync(inputPath);
  if (fs.existsSync(convertedPath)) fs.unlinkSync(convertedPath);
}
run().catch(console.error);
