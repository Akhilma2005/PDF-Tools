const { PDFDocument, StandardFonts } = require('pdf-lib');
const { runLibreOffice } = require('./utils/libreoffice');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');
const outputDir  = path.join(__dirname, 'outputs');

async function makePdf(pages) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = pdfDoc.addPage([595, 842]);
    page.drawText(`Page ${i} — ${'Lorem ipsum dolor sit amet. '.repeat(20)}`, { x: 50, y: 780, font, size: 11, maxWidth: 495, lineHeight: 15 });
  }
  return Buffer.from(await pdfDoc.save());
}

async function bench(label, pages) {
  const buf = await makePdf(pages);
  const uuid = uuidv4();
  const inPath  = path.join(uploadsDir, `${uuid}.pdf`);
  const outPath = path.join(outputDir,  `${uuid}.docx`);
  fs.writeFileSync(inPath, buf);

  const t = Date.now();
  await runLibreOffice(['--infilter=writer_pdf_import', '--convert-to', 'docx:MS Word 2007 XML', '--outdir', outputDir, inPath]);
  const elapsed = ((Date.now() - t) / 1000).toFixed(2);

  const ok = fs.existsSync(outPath) && fs.statSync(outPath).size > 100;
  console.log(`[${label}] pages=${pages} time=${elapsed}s ok=${ok}`);
  fs.unlinkSync(inPath);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
}

// Wait for pool to warm then benchmark
setTimeout(async () => {
  console.log('--- Warm pool benchmarks ---');
  await bench('1st', 1);
  await bench('2nd', 1);
  await bench('5pg', 5);
  await bench('20pg', 20);
  await bench('50pg', 50);
  process.exit(0);
}, 6000); // wait for pool warm
