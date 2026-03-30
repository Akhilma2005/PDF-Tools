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

// ── Shared fast flags for every soffice invocation ──────────────────────────
const FAST_FLAGS = ['--headless', '--norestore', '--nofirststartwizard', '--nologo'];

// ── Create an isolated user-profile dir to avoid lock contention ─────────────
const makeTmpProfile = () => {
  const dir = path.join(os.tmpdir(), `lo_${uuidv4()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// ── runLibreOffice — spawn soffice with isolated profile ─────────────────────
const runLibreOffice = (args, timeoutMs = 60000) => {
  const bin = findSoffice();
  if (!bin) throw new Error('LibreOffice is not installed.');
  const profile = makeTmpProfile();
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, [...FAST_FLAGS, `-env:UserInstallation=file:///${profile.replace(/\\/g, '/')}`, ...args], { stdio: 'ignore' });
    const timer = setTimeout(() => { proc.kill(); reject(new Error('LibreOffice timed out.')); }, timeoutMs);
    proc.on('close', () => { clearTimeout(timer); fs.rm(profile, { recursive: true, force: true }, () => {}); resolve(); });
    proc.on('error', (err) => { clearTimeout(timer); fs.rm(profile, { recursive: true, force: true }, () => {}); reject(new Error(`LibreOffice not found. (${err.message})`)); });
  });
};

// ── Core convert using libreoffice-convert npm package ───────────────────────
const convertToPdf = async (inputPath, outputDir, format = 'pdf') => {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outPath  = path.join(outputDir, `${baseName}.${format}`);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  if (format === 'pdf') {
    try {
      const inputBuf  = fs.readFileSync(inputPath);
      const outputBuf = await libre.convertAsync(inputBuf, '.pdf', undefined);
      fs.writeFileSync(outPath, outputBuf);
    } catch (err) {
      throw new Error(`LibreOffice conversion failed: ${err.message}`);
    }
  } else {
    await runLibreOffice(['--convert-to', format, '--outdir', outputDir, inputPath]);
  }

  if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 100) {
    throw new Error('Conversion failed. Ensure LibreOffice is installed and the file is not corrupted.');
  }
  return outPath;
};

const convertBulk = async (inputPaths, outputDir, format = 'jpg') => {
  if (!inputPaths?.length) return [];
  await runLibreOffice(['--convert-to', format, '--outdir', outputDir, ...inputPaths]);
  const results = inputPaths.map(p => {
    const outPath = path.join(outputDir, `${path.basename(p, path.extname(p))}.${format}`);
    return fs.existsSync(outPath) ? outPath : null;
  });
  if (results.some(r => r !== null)) return results;
  throw new Error('Bulk conversion failed — no output files produced.');
};

// ── Pool (no-op — profile isolation handles concurrency) ─────────────────────
const warmPool = () => Promise.resolve();

module.exports = { convertToPdf, convertBulk, findSoffice, isSofficeAvailable, runLibreOffice, warmPool };
