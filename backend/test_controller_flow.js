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
  // Simulate multer: save as UUID.pdf
  const uuid = uuidv4();
  const inputPath = path.join(uploadsDir, `${uuid}.pdf`);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('Hello World — real text PDF', { x: 50, y: 750, font, size: 14 });
  fs.writeFileSync(inputPath, await pdfDoc.save());
  console.log('Input:', inputPath);

  // Run LibreOffice
  const r = spawnSync(soffice, [
    '--headless', '--convert-to', 'docx:writer8', '--outdir', outputDir, inputPath
  ], { timeout: 30000, encoding: 'utf8' });

  console.log('stderr:', r.stderr?.trim()?.slice(0, 200));

  // What the controller expects
  const baseName = path.basename(inputPath, path.extname(inputPath)); // UUID
  const convertedPath = path.join(outputDir, `${baseName}.docx`);
  console.log('Expected output:', convertedPath);
  console.log('Exists:', fs.existsSync(convertedPath));

  // List outputs dir to see what was actually created
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.docx'));
  console.log('DOCX files in outputs:', files);

  // Check if valid
  if (fs.existsSync(convertedPath)) {
    const buf = fs.readFileSync(convertedPath);
    console.log('Size:', buf.length, '| Valid ZIP:', buf[0] === 0x50 && buf[1] === 0x4B);
    fs.unlinkSync(convertedPath);
  }
  fs.unlinkSync(inputPath);
}

run().catch(console.error);
