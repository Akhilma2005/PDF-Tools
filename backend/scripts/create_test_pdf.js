const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createTestPdf() {
  const merged = await PDFDocument.create();
  
  // Create a large-ish image to embed
  const imgBuffer = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: { r: 255, g: 0, b: 0 }
    }
  }).jpeg({ quality: 100 }).toBuffer();
  
  const img = await merged.embedJpg(imgBuffer);
  const page = merged.addPage([img.width, img.height]);
  page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  
  const pdfBytes = await merged.save();
  fs.writeFileSync(path.join(__dirname, 'test.pdf'), pdfBytes);
  console.log('Created test.pdf, size:', pdfBytes.length);
}

createTestPdf();
