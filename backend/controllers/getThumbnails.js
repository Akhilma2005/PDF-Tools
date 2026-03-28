const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { success, error, previewUrl, outputPath } = require('../utils/response');

const MAX_PAGES = 40;

async function renderPageToJpeg(pdfDoc, pageNum, scale = 1.5) {
  const { createCanvas } = require('canvas');
  const page     = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas   = createCanvas(viewport.width, viewport.height);
  const ctx      = canvas.getContext('2d');

  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas.toBuffer('image/jpeg', { quality: 0.85 });
}

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No PDF file uploaded');

  try {
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

    const data    = new Uint8Array(fs.readFileSync(req.file.path));
    const pdfDoc  = await pdfjsLib.getDocument({ data, disableFontFace: true }).promise;
    const total   = Math.min(pdfDoc.numPages, MAX_PAGES);

    const thumbnails = [];
    for (let i = 1; i <= total; i++) {
      const jpegBuf = await renderPageToJpeg(pdfDoc, i);
      const outName = `${uuidv4()}.jpg`;
      fs.writeFileSync(outputPath(outName), jpegBuf);
      thumbnails.push({ index: i - 1, url: previewUrl(req, outName), filename: outName });
    }

    if (!thumbnails.length) throw new Error('No thumbnails generated.');

    success(res, {
      message: 'Thumbnails generated',
      thumbnails,
      originalFile: req.file.filename,
      originalSize: req.file.size,
      pageCount: pdfDoc.numPages,
      previewCapped: pdfDoc.numPages > MAX_PAGES,
    });

  } catch (err) {
    if (!res.headersSent) error(res, `Thumbnail generation failed: ${err.message}`, 500);
  }
};
