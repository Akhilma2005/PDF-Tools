const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');

// Mocking the behavior of imageToPdf.js
async function testImageToPdf() {
  console.log('--- Testing Image to PDF Logic ---');
  
  const outputDir = path.join(__dirname, '../outputs');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  
  const merged = await PDFDocument.create();
  
  try {
    // 1. Create a dummy image
    console.log('Generating dummy image...');
    const imgBuffer = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 255, g: 0, b: 0 } }
    }).png().toBuffer();
    
    // 2. Embed into PDF
    console.log('Embedding image into PDF...');
    const img = await merged.embedPng(imgBuffer);
    const page = merged.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    
    // 3. Save
    const pdfBytes = await merged.save();
    const outName = `test_${uuidv4()}.pdf`;
    const outPath = path.join(outputDir, outName);
    fs.writeFileSync(outPath, pdfBytes);
    
    console.log(`✅ SUCCESS: PDF generated at ${outPath}`);
    console.log(`Size: ${pdfBytes.length} bytes`);
    
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  }
}

testImageToPdf();
