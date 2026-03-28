const fs   = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

module.exports = async (req, res) => {
  const { pageOrder, filename } = req.body;

  // Resolve file path — either a fresh upload or the stored filename from getThumbnails
  let filePath;
  if (req.file) {
    filePath = req.file.path;
  } else if (filename) {
    filePath = path.join(__dirname, '../uploads', filename);
  } else {
    return error(res, 'No file provided');
  }

  if (!fs.existsSync(filePath)) {
    return error(res, 'Original file not found. Please re-upload the PDF.', 404);
  }

  try {
    const bytes  = fs.readFileSync(filePath);
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total  = srcDoc.getPageCount();

    // pageOrder: 0-based indices in user's chosen order
    const order = pageOrder
      ? (Array.isArray(pageOrder) ? pageOrder : JSON.parse(pageOrder)).map(Number)
      : Array.from({ length: total }, (_, i) => i);

    const valid = order.filter(i => i >= 0 && i < total);
    if (!valid.length) return error(res, 'No valid pages selected');

    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(srcDoc, valid);
    copied.forEach(p => outDoc.addPage(p));

    const pdfBytes = await outDoc.save();
    const outName  = `${uuidv4()}.pdf`;
    fs.writeFileSync(outputPath(outName), pdfBytes);

    // Only delete the uploaded file if it came directly (not from getThumbnails session)
    if (req.file) deleteFile(filePath);

    success(res, {
      message: `PDF created with ${valid.length} page(s)`,
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=PDF Tools`,
    });
  } catch (err) {
    if (req.file) deleteFile(filePath);
    error(res, `Failed: ${err.message}`, 500);
  }
};
