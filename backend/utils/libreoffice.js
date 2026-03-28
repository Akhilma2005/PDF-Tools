const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const { spawn, spawnSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const libre   = require('libreoffice-convert');
libre.convertAsync = require('util').promisify(libre.convert);

// ── Find soffice binary ───────────────────────────────────────────────────────
const WINDOWS_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
];

const LINUX_PATHS = [
  '/usr/bin/soffice',
  '/usr/bin/libreoffice',
  '/usr/lib/libreoffice/program/soffice',
  '/opt/libreoffice/program/soffice',
  '/opt/libreoffice7.6/program/soffice',
];

const findSoffice = () => {
  if (process.platform === 'win32') {
    for (const p of WINDOWS_PATHS) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
  for (const p of LINUX_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  // last resort — check PATH
  const r = spawnSync('which', ['soffice'], { encoding: 'utf8' });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  const r2 = spawnSync('which', ['libreoffice'], { encoding: 'utf8' });
  if (r2.status === 0 && r2.stdout.trim()) return r2.stdout.trim();
  return null;
};

const isSofficeAvailable = () => !!findSoffice();

// ── Core convert using libreoffice-convert npm package ───────────────────────
const convertToPdf = async (inputPath, outputDir, format = 'pdf') => {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outPath  = path.join(outputDir, `${baseName}.${format}`);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  if (format === 'pdf') {
    // Use libreoffice-convert npm package for PDF output
    try {
      const inputBuf  = fs.readFileSync(inputPath);
      const outputBuf = await libre.convertAsync(inputBuf, '.pdf', undefined);
      fs.writeFileSync(outPath, outputBuf);
    } catch (err) {
      throw new Error(`LibreOffice conversion failed: ${err.message}`);
    }
  } else {
    // Use soffice directly for jpg/png etc
    await runLibreOffice(['--convert-to', format, '--outdir', outputDir, inputPath]);
  }

  if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 100) {
    throw new Error('Conversion failed. Ensure LibreOffice is installed and the file is not corrupted.');
  }
  return outPath;
};

const convertBulk = async (inputPaths, outputDir, format = 'jpg') => {
  if (!inputPaths?.length) return [];
  // Use runLibreOffice directly for non-pdf formats (jpg, png etc)
  await runLibreOffice(['--convert-to', format, '--outdir', outputDir, ...inputPaths]);
  const results = inputPaths.map(p => {
    const outPath = path.join(outputDir, `${path.basename(p, path.extname(p))}.${format}`);
    return fs.existsSync(outPath) ? outPath : null;
  });
  if (results.some(r => r !== null)) return results;
  throw new Error('Bulk conversion failed — no output files produced.');
};

// ── Pool (no-op on Linux — libreoffice-convert manages its own process) ──────
const warmPool = () => Promise.resolve();

// ── runLibreOffice — spawn soffice directly with raw args ────────────────────
const runLibreOffice = (args, timeoutMs = 120000) => {
  const bin = findSoffice();
  if (!bin) throw new Error('LibreOffice is not installed.');
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, ['--headless', ...args], { stdio: 'ignore' });
    const timer = setTimeout(() => { proc.kill(); reject(new Error('LibreOffice timed out.')); }, timeoutMs);
    proc.on('close', () => { clearTimeout(timer); resolve(); });
    proc.on('error', (err) => { clearTimeout(timer); reject(new Error(`LibreOffice not found. (${err.message})`)); });
  });
};

module.exports = { convertToPdf, convertBulk, findSoffice, isSofficeAvailable, runLibreOffice, warmPool };
