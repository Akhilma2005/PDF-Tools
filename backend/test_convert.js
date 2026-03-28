const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

async function test() {
  try {
    console.log('Step 1: creating PNG buffer...');
    const imgBuffer = await sharp({
      create: { width: 200, height: 200, channels: 3, background: { r: 90, g: 96, b: 255 } }
    }).png().toBuffer();
    console.log('PNG buffer size:', imgBuffer.length);

    console.log('Step 2: embedding into PDF...');
    const pdfDoc = await PDFDocument.create();
    const img = await pdfDoc.embedPng(imgBuffer);
    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });

    console.log('Step 3: saving PDF...');
    const pdfBytes = await pdfDoc.save();
    const outPath = path.join(__dirname, 'outputs', 'test_output.pdf');
    fs.writeFileSync(outPath, pdfBytes);
    console.log('SUCCESS — PDF written to:', outPath, '| size:', pdfBytes.length, 'bytes');
  } catch (e) {
    console.error('FAILED:', e.message);
    console.error(e.stack);
  }
}

test();
