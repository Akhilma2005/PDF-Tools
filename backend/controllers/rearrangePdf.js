const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

/**
 * Rearranges pages of a PDF based on provided order.
 */
module.exports = async (req, res) => {
  const { rearrangeOrder, filename } = req.body;
  let filePath;

  if (req.file) {
    filePath = req.file.path;
  } else if (filename) {
    filePath = path.join(__dirname, '../uploads', filename);
  } else {
    return error(res, 'No file provided');
  }

  if (!fs.existsSync(filePath)) return error(res, 'File not found');
  if (!rearrangeOrder) return error(res, 'No rearrangement order provided');

  try {
    const bytes = fs.readFileSync(filePath);
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    const order = Array.isArray(rearrangeOrder) ? rearrangeOrder : JSON.parse(rearrangeOrder);
    
    // Validate order indices
    const validOrder = order.filter(idx => idx >= 0 && idx < totalPages);
    if (validOrder.length === 0) throw new Error('Invalid page indices');

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, validOrder);
    copiedPages.forEach(page => newDoc.addPage(page));

    const pdfBytes = await newDoc.save();
    const outName = `${uuidv4()}.pdf`;
    fs.writeFileSync(outputPath(outName), pdfBytes);

    if (req.file) deleteFile(req.file.path);

    success(res, {
      message: 'PDF pages rearranged successfully',
      filename: outName,
      downloadUrl: downloadUrl(req, outName),
      pageCount: validOrder.length
    });

  } catch (err) {
    if (req.file) deleteFile(req.file.path);
    error(res, `Rearrangement failed: ${err.message}`, 500);
  }
};
