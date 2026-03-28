const { PDFDocument, StandardFonts } = require('pdf-lib');
const { runLibreOffice } = require('./utils/libreoffice');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

async function bench(pages) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = pdfDoc.addPage([595, 842]);
    page.drawText(`Page ${i} — ${'Lorem ipsum dolor sit amet. '.repeat(20)}`, { x: 50, y: 780, font, size: 11, maxWidth: 495, lineHeight: 15 });
  }
  const uuid = uuidv4();
  const inputPath = path.join(__dirname, 'uploads', `${uuid}.pdf`);
  const outputDir = path.join(__dirname, 'outputs');
  const outPath   = path.join(outputDir, `${uuid}.docx`);
  fs.writeFileSync(inputPath, await pdfDoc.save());

  const t = Date.now();
  await runLibreOffice(['--infilter=writer_pdf_import', '--convert-to', 'docx:MS Word 2007 XML', '--outdir', outputDir, inputPath]);
  const elapsed = ((Date.now() - t) / 1000).toFixed(2);

  const ok = fs.existsSync(outPath) && fs.statSync(outPath).size > 100;
  console.log(`Pages: ${pages} | Time: ${elapsed}s | OK: ${ok}`);
  fs.unlinkSync(inputPath);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
}

(async () => {
  console.log('Warming up...');
  await bench(1);  // cold start
  console.log('--- warm runs ---');
  await bench(1);
  await bench(5);
  await bench(20);
  await bench(50);
})().catch(console.error);
