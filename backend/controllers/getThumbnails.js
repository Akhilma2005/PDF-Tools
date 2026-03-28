const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { spawn } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const { success, error, previewUrl, outputPath } = require('../utils/response');

const MAX_PAGES  = 40;
const TIMEOUT_MS = 90000;

// Convert PDF to JPGs using pdftoppm (from poppler-utils)
const pdfToImages = (pdfPath, outDir, dpi = 120) => new Promise((resolve, reject) => {
  const prefix = path.join(outDir, 'page');
  const proc = spawn('pdftoppm', ['-jpeg', '-r', String(dpi), pdfPath, prefix]);
  const timer = setTimeout(() => { proc.kill(); reject(new Error('pdftoppm timed out')); }, 60000);
  let stderr = '';
  proc.stderr.on('data', d => { stderr += d.toString(); });
  proc.on('close', code => {
    clearTimeout(timer);
    if (code !== 0) return reject(new Error(`pdftoppm failed: ${stderr}`));
    resolve();
  });
  proc.on('error', err => { clearTimeout(timer); reject(new Error(`pdftoppm not found: ${err.message}`)); });
});

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No PDF file uploaded');

  const file    = req.file;
  const tempDir = path.join(os.tmpdir(), `thumbs_${uuidv4()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const timeoutHandle = setTimeout(() => {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    if (!res.headersSent) error(res, 'Thumbnail generation timed out.', 504);
  }, TIMEOUT_MS);

  try {
    const bytes = fs.readFileSync(file.path);
    const doc   = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = Math.min(doc.getPageCount(), MAX_PAGES);

    // Convert all pages to JPGs at once
    await pdfToImages(file.path, tempDir);

    // pdftoppm outputs: page-1.jpg, page-2.jpg ... or page-01.jpg etc
    const allFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg')).sort();

    const thumbnails = [];
    for (let i = 0; i < Math.min(allFiles.length, total); i++) {
      const src     = path.join(tempDir, allFiles[i]);
      const outName = `${uuidv4()}.jpg`;
      fs.copyFileSync(src, outputPath(outName));
      thumbnails.push({ index: i, url: previewUrl(req, outName), filename: outName });
    }

    if (!thumbnails.length) throw new Error('No thumbnails generated. Check if pdftoppm is installed.');

    clearTimeout(timeoutHandle);
    success(res, {
      message: 'Thumbnails generated',
      thumbnails,
      originalFile: file.filename,
      originalSize: file.size,
      pageCount: doc.getPageCount(),
      previewCapped: doc.getPageCount() > MAX_PAGES,
    });

  } catch (err) {
    clearTimeout(timeoutHandle);
    if (!res.headersSent) error(res, `Thumbnail generation failed: ${err.message}`, 500);
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }
};
