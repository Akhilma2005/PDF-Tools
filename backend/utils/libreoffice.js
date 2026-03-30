const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const { spawn, spawnSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

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
    for (const p of WINDOWS_PATHS) if (fs.existsSync(p)) return p;
    return null;
  }
  for (const p of LINUX_PATHS) if (fs.existsSync(p)) return p;
  const r = spawnSync('which', ['soffice'], { encoding: 'utf8' });
  if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  const r2 = spawnSync('which', ['libreoffice'], { encoding: 'utf8' });
  if (r2.status === 0 && r2.stdout.trim()) return r2.stdout.trim();
  return null;
};

const isSofficeAvailable = () => !!findSoffice();

// ── Persistent warm instance ──────────────────────────────────────────────────
const WARM_PROFILE = path.join(os.tmpdir(), 'lo_warm_instance');
const PIPE_NAME    = process.platform === 'win32'
  ? 'pipe://localhost:2002'
  : 'socket,host=localhost,port=2002,tcpNoDelay=1;urp;StarOffice.ServiceManager';

let _warmProc   = null;
let _warmReady  = false;

const startWarmInstance = () => {
  const bin = findSoffice();
  if (!bin) return;
  fs.mkdirSync(WARM_PROFILE, { recursive: true });

  _warmProc = spawn(bin, [
    '--headless', '--norestore', '--nofirststartwizard', '--nologo',
    `--accept=${PIPE_NAME}`,
    `-env:UserInstallation=file:///${WARM_PROFILE.replace(/\\/g, '/')}`,
  ], { stdio: 'ignore', detached: false });

  // Give it 4s to fully start, then mark ready
  setTimeout(() => { _warmReady = true; }, 4000);

  _warmProc.on('exit', () => {
    _warmReady = false;
    _warmProc  = null;
    // Auto-restart after 2s if it crashes
    setTimeout(startWarmInstance, 2000);
  });
};

// ── Isolated profile for fallback/parallel spawns ────────────────────────────
const makeTmpProfile = () => {
  const dir = path.join(os.tmpdir(), `lo_${uuidv4()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const FAST_FLAGS = ['--headless', '--norestore', '--nofirststartwizard', '--nologo'];

// ── runLibreOffice — uses warm instance connection when ready ─────────────────
const runLibreOffice = (args, timeoutMs = 30000) => {
  const bin = findSoffice();
  if (!bin) throw new Error('LibreOffice is not installed.');

  // If warm instance is ready, connect to it (no cold-start cost)
  if (_warmReady) {
    return new Promise((resolve, reject) => {
      const proc = spawn(bin, [
        ...FAST_FLAGS,
        `--connection=${PIPE_NAME}`,
        ...args,
      ], { stdio: 'ignore' });
      const timer = setTimeout(() => { proc.kill(); reject(new Error('LibreOffice timed out.')); }, timeoutMs);
      proc.on('close', (code) => {
        clearTimeout(timer);
        // code 1 can still mean success for --connection mode; check output file in caller
        resolve();
      });
      proc.on('error', () => {
        clearTimeout(timer);
        // fallback to isolated spawn
        runIsolated(bin, args, timeoutMs).then(resolve).catch(reject);
      });
    });
  }

  return runIsolated(bin, args, timeoutMs);
};

const runIsolated = (bin, args, timeoutMs) => {
  const profile = makeTmpProfile();
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, [
      ...FAST_FLAGS,
      `-env:UserInstallation=file:///${profile.replace(/\\/g, '/')}`,
      ...args,
    ], { stdio: 'ignore' });
    const timer = setTimeout(() => { proc.kill(); reject(new Error('LibreOffice timed out.')); }, timeoutMs);
    proc.on('close', () => { clearTimeout(timer); fs.rm(profile, { recursive: true, force: true }, () => {}); resolve(); });
    proc.on('error', (err) => { clearTimeout(timer); fs.rm(profile, { recursive: true, force: true }, () => {}); reject(new Error(`LibreOffice not found. (${err.message})`)); });
  });
};

// ── convertToPdf — uses runLibreOffice directly (no libreoffice-convert pkg) ──
const convertToPdf = async (inputPath, outputDir, format = 'pdf') => {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outPath  = path.join(outputDir, `${baseName}.${format}`);
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  const filterMap = { pdf: 'pdf', jpg: 'jpg', png: 'png' };
  await runLibreOffice(['--convert-to', filterMap[format] || format, '--outdir', outputDir, inputPath]);

  if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 100)
    throw new Error('Conversion failed. Ensure LibreOffice is installed and the file is not corrupted.');
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

// ── warmPool — starts the persistent instance on server boot ─────────────────
const warmPool = () => {
  startWarmInstance();
  return Promise.resolve();
};

module.exports = { convertToPdf, convertBulk, findSoffice, isSofficeAvailable, runLibreOffice, warmPool };
