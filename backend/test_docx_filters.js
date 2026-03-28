const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findSoffice } = require('./utils/libreoffice');

const soffice = findSoffice();
const inputPath = path.join(__dirname, 'outputs', 'test_output.pdf');
const outputDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(inputPath)) {
  console.error('No test_output.pdf — run test_convert.js first');
  process.exit(1);
}

const filters = [
  'docx',
  'docx:writer8',
  'docx:MS Word 2007 XML',
  'docx:Impress MS PowerPoint 2007 XML',
  'odt',
  'odt:writer8',
  'doc:MS Word 97',
  'rtf',
];

for (const filter of filters) {
  const ext = filter.split(':')[0];
  const outFile = path.join(outputDir, `test_filter_${ext}_${Date.now()}.${ext}`);
  // clean any previous
  const base = `test_output.${ext}`;
  const baseOut = path.join(outputDir, base);
  if (fs.existsSync(baseOut)) fs.unlinkSync(baseOut);

  const r = spawnSync(soffice, [
    '--headless', '--convert-to', filter, '--outdir', outputDir, inputPath
  ], { timeout: 30000, encoding: 'utf8' });

  const exists = fs.existsSync(baseOut);
  const size = exists ? fs.statSync(baseOut).size : 0;
  // check if valid Office XML (docx is a zip)
  let valid = false;
  if (exists && size > 100) {
    const buf = fs.readFileSync(baseOut);
    // DOCX/ODT are ZIP files starting with PK
    valid = buf[0] === 0x50 && buf[1] === 0x4B;
  }
  console.log(`filter="${filter.padEnd(30)}" exists=${exists} size=${size} validZip=${valid} err=${(r.stderr||'').slice(0,60)}`);
  if (exists) fs.unlinkSync(baseOut);
}
