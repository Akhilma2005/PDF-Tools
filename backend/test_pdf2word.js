const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { findSoffice } = require('./utils/libreoffice');

// Use the test PDF we already generated
const inputPath = path.join(__dirname, 'outputs', 'test_output.pdf');
const outputDir = path.join(__dirname, 'outputs');
const baseName = path.basename(inputPath, '.pdf');
const expectedOut = path.join(outputDir, `${baseName}.docx`);

if (!fs.existsSync(inputPath)) {
  console.error('No test_output.pdf found — run test_convert.js first');
  process.exit(1);
}

const soffice = findSoffice();
console.log('soffice:', soffice);
console.log('Input:', inputPath);
console.log('Expected output:', expectedOut);

execFile(soffice, [
  '--headless', '--convert-to', 'docx:"MS Word 2007 XML"', '--outdir', outputDir, inputPath,
], { timeout: 60000 }, (err, stdout, stderr) => {
  if (err) { console.error('FAILED:', stderr || err.message); return; }
  if (fs.existsSync(expectedOut)) {
    console.log('SUCCESS — size:', fs.statSync(expectedOut).size, 'bytes');
  } else {
    console.error('FAILED — output file not found');
  }
});
