const libre = require('libreoffice-convert');
const { promisify } = require('util');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const libreConvert = promisify(libre.convert);

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
  const t = Date.now();
  try {
    const result = await libreConvert(buf, '.docx', undefined);
    const elapsed = ((Date.now() - t) / 1000).toFixed(2);
    const valid = result && result[0] === 0x50 && result[1] === 0x4B;
    console.log(`[${label}] pages=${pages} time=${elapsed}s size=${result?.length} valid=${valid}`);
  } catch (e) {
    const elapsed = ((Date.now() - t) / 1000).toFixed(2);
    console.log(`[${label}] pages=${pages} time=${elapsed}s ERROR: ${e.message.slice(0, 100)}`);
  }
}

(async () => {
  await bench('cold', 1);
  await bench('warm-1pg', 1);
  await bench('warm-5pg', 5);
  await bench('warm-20pg', 20);
  await bench('warm-50pg', 50);
})();
