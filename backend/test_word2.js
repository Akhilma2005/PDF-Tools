const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { convertToPdf } = require('./utils/libreoffice');

// Simulate what multer does — saves file as UUID.docx
const uuid = uuidv4();
const uploadedName = `${uuid}.docx`;
const inputPath = path.join(__dirname, 'uploads', uploadedName);
const outputDir = path.join(__dirname, 'outputs');

// Copy a real docx if available, otherwise use a txt
const sampleDocx = path.join(__dirname, 'uploads', 'sample.docx');
if (fs.existsSync(sampleDocx)) {
  fs.copyFileSync(sampleDocx, inputPath);
  console.log('Using real .docx file');
} else {
  // Create a minimal valid .docx (just write text — LibreOffice can handle .txt too)
  fs.writeFileSync(inputPath, 'Hello World test document');
  console.log('Using plain text as .docx (no real docx available)');
}

console.log('Input path:', inputPath);
console.log('Expected output:', path.join(outputDir, `${uuid}.pdf`));

convertToPdf(inputPath, outputDir)
  .then(out => {
    console.log('convertToPdf returned:', out);
    console.log('File exists:', fs.existsSync(out));
    console.log('File size:', fs.statSync(out).size, 'bytes');
  })
  .catch(err => console.error('FAILED:', err.message));
