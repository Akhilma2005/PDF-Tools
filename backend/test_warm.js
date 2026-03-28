const { spawn, spawnSync } = require('child_process');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { findSoffice } = require('./utils/libreoffice');

const soffice = findSoffice();
const PORT = 2002;
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir  = path.join(__dirname, 'outputs');

async function makePdf(pages) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = pdfDoc.addPage([595, 842]);
    page.drawText(`Page ${i} — ${'Lorem ipsum. '.repeat(30)}`, { x: 50, y: 780, font, size: 11, maxWidth: 495, lineHeight: 15 });
  }
  return Buffer.from(await pdfDoc.save());
}

async function convertViaSocket(inputPath, pages) {
  const uuid = uuidv4();
  const outPath = path.join(outputDir, `${uuid}.docx`);
  const t = Date.now();

  // Use python/macro approach via socket — test if soffice --accept works
  const result = spawnSync(soffice, [
    '--headless',
    `--accept=socket,host=localhost,port=${PORT};urp;StarOffice.ServiceManager`,
    '--norestore', '--nofirststartwizard',
  ], { timeout: 3000, detached: false });

  console.log('accept start status:', result.status, result.error?.message);
}

// Instead test: start warm process once, then convert multiple times
async function testWarmPool() {
  console.log('Starting warm LibreOffice listener...');
  const profileDir = path.join(require('os').tmpdir(), `lo_warm_${uuidv4()}`);
  fs.mkdirSync(profileDir, { recursive: true });

  const warmProc = spawn(soffice, [
    '--headless', '--norestore', '--nofirststartwizard',
    `-env:UserInstallation=file:///${profileDir.replace(/\\/g, '/')}`,
    `--accept=socket,host=localhost,port=${PORT};urp;StarOffice.ServiceManager`,
  ], { stdio: 'ignore' });

  // Wait for LO to start
  await new Promise(r => setTimeout(r, 4000));
  console.log('LO warm process started, PID:', warmProc.pid);

  // Now convert using python bridge
  for (const pages of [1, 5, 20, 50]) {
    const buf = await makePdf(pages);
    const uuid = uuidv4();
    const inPath = path.join(uploadsDir, `${uuid}.pdf`);
    fs.writeFileSync(inPath, buf);

    const t = Date.now();
    // Try converting via the warm instance using --connection
    const r = spawnSync(soffice, [
      '--headless',
      `-env:UserInstallation=file:///${profileDir.replace(/\\/g, '/')}`,
      '--infilter=writer_pdf_import',
      '--convert-to', 'docx:MS Word 2007 XML',
      '--outdir', outputDir,
      inPath,
    ], { timeout: 30000 });

    const outPath = path.join(outputDir, `${uuid}.docx`);
    const elapsed = ((Date.now() - t) / 1000).toFixed(2);
    const ok = fs.existsSync(outPath) && fs.statSync(outPath).size > 100;
    console.log(`pages=${pages} time=${elapsed}s ok=${ok}`);
    fs.unlinkSync(inPath);
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  }

  warmProc.kill();
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch(_) {}
}

testWarmPool().catch(console.error);
