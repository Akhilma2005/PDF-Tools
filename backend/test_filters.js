const fs = require('fs');
const path = require('path');
const { execFile, spawnSync } = require('child_process');
const { findSoffice } = require('./utils/libreoffice');

const inputPath = path.join(__dirname, 'outputs', 'test_output.pdf');
const outputDir = path.join(__dirname, 'outputs');
const soffice = findSoffice();

const filters = [
  'docx:MS Word 2007 XML',
  'docx:writer8',
  'docx',
  'odt',
];

(async () => {
  for (const filter of filters) {
    const expectedOut = path.join(outputDir, `test_output.${filter.split(':')[0]}`);
    if (fs.existsSync(expectedOut)) fs.unlinkSync(expectedOut);

    const result = spawnSync(soffice, [
      '--headless', '--convert-to', filter, '--outdir', outputDir, inputPath,
    ], { timeout: 30000, encoding: 'utf8' });

    const exists = fs.existsSync(expectedOut);
    const size = exists ? fs.statSync(expectedOut).size : 0;
    console.log(`filter="${filter}" -> exists:${exists} size:${size} stderr:${(result.stderr || '').slice(0, 80)}`);
  }
})();
