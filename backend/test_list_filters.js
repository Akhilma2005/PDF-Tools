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
  // Create a proper text-based PDF
  const uuid = uuidv4();
  const inputPath = path.join(uploadsDir, `${uuid}.pdf`);
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('Hello World\nThis is a test document.\nLine 3.', { x: 50, y: 750, font, size: 14 });
  fs.writeFileSync(inputPath, await pdfDoc.save());
  console.log('Input PDF size:', fs.statSync(inputPath).size);

  // List ALL available export filters from LibreOffice
  const listResult = spawnSync(soffice, ['--headless', '--convert-to', 'help'], 
    { timeout: 10000, encoding: 'utf8' });
  console.log('\n--- Available filters (stderr) ---');
  console.log((listResult.stderr || '').slice(0, 2000));

  fs.unlinkSync(inputPath);
}

run().catch(console.error);
