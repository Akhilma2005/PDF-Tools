const { spawnSync } = require('child_process');
const { findSoffice } = require('./utils/libreoffice');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const os = require('os');

const soffice = findSoffice();
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir  = path.join(__dirname, 'outputs');

// Create a minimal valid PPTX (ZIP structure)
// We'll use a real pptx if available, otherwise test with a txt renamed to pptx
const testFile = path.join(uploadsDir, `test_${uuidv4()}.pptx`);
// Write a dummy file to test filter detection
fs.writeFileSync(testFile, 'dummy pptx content');

const filters = [
  'pdf',
  'pdf:impress_pdf_Export',
  'pdf:writer_pdf_Export',
  'pdf:Impress MS PowerPoint 2007 XML',
];

for (const filter of filters) {
  const profileDir = path.join(os.tmpdir(), `lo_test_${uuidv4()}`);
  fs.mkdirSync(profileDir, { recursive: true });
  const baseName = path.basename(testFile, path.extname(testFile));
  const outPath  = path.join(outputDir, `${baseName}.pdf`);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  const r = spawnSync(soffice, [
    '--headless',
    `-env:UserInstallation=file:///${profileDir.replace(/\\/g, '/')}`,
    '--convert-to', filter,
    '--outdir', outputDir,
    testFile,
  ], { timeout: 30000, encoding: 'utf8' });

  const exists = fs.existsSync(outPath);
  const size   = exists ? fs.statSync(outPath).size : 0;
  console.log(`filter="${filter}" exists=${exists} size=${size} stderr=${(r.stderr||'').trim().slice(0,80)}`);
  if (exists) fs.unlinkSync(outPath);
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch(_) {}
}

fs.unlinkSync(testFile);
