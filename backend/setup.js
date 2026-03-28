const { spawnSync, execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'bin');
const qpdfBin = path.join(baseDir, 'qpdf');
const libDir  = path.join(baseDir, 'lib');

function trySetup() {
  if (process.platform !== 'linux') return;

  // Already set up and working
  if (fs.existsSync(qpdfBin) && fs.existsSync(libDir)) {
    process.env.QPDF_BIN      = qpdfBin;
    process.env.LD_LIBRARY_PATH = libDir + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');
    const test = spawnSync(qpdfBin, ['--version'], { encoding: 'utf8', env: process.env });
    if (test.status === 0) {
      console.log('[setup] qpdf ready:', test.stdout.trim());
      return;
    }
  }

  fs.mkdirSync(baseDir, { recursive: true });
  fs.mkdirSync(libDir,  { recursive: true });

  const url    = 'https://github.com/qpdf/qpdf/releases/download/v11.9.1/qpdf-11.9.1-bin-linux-x86_64.zip';
  const tmpZip = '/tmp/qpdf.zip';
  const tmpDir = '/tmp/qpdf_ex';

  try {
    console.log('[setup] Downloading qpdf...');
    execSync(`rm -rf ${tmpDir} && mkdir -p ${tmpDir}`, { stdio: 'pipe' });
    execSync(`curl -fsSL --max-time 60 -L -o ${tmpZip} "${url}"`, { stdio: 'pipe', timeout: 65000 });
    execSync(`unzip -o ${tmpZip} -d ${tmpDir}`, { stdio: 'pipe' });

    // zip structure: bin/qpdf and lib/*.so*
    const srcBin = path.join(tmpDir, 'bin', 'qpdf');
    const srcLib = path.join(tmpDir, 'lib');

    if (!fs.existsSync(srcBin)) throw new Error('qpdf binary not found at ' + srcBin);

    // Copy binary
    fs.copyFileSync(srcBin, qpdfBin);
    execSync(`chmod +x ${qpdfBin}`);

    // Copy all libs
    fs.readdirSync(srcLib).forEach(f => {
      fs.copyFileSync(path.join(srcLib, f), path.join(libDir, f));
    });
    console.log('[setup] Copied libs:', fs.readdirSync(libDir).join(', '));

    // Set env and test
    process.env.QPDF_BIN      = qpdfBin;
    process.env.LD_LIBRARY_PATH = libDir + (process.env.LD_LIBRARY_PATH ? ':' + process.env.LD_LIBRARY_PATH : '');

    const test = spawnSync(qpdfBin, ['--version'], { encoding: 'utf8', env: process.env });
    if (test.status === 0) {
      console.log('[setup] qpdf OK:', test.stdout.trim());
    } else {
      console.warn('[setup] qpdf test failed:', test.stderr);
    }
  } catch (e) {
    console.warn('[setup] Failed:', e.message);
  }
}

trySetup();
