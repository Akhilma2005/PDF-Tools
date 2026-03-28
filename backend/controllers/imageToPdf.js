const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');
const { mergeToPdf } = require('../utils/pdfMerger');

module.exports = async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return error(res, 'No files uploaded');

  const outputDir = path.join(__dirname, '../outputs');

  try {
    const merged = await mergeToPdf(files, outputDir);
    const pdfBytes = await merged.save();
    const outName = `${uuidv4()}.pdf`;
    fs.writeFileSync(outputPath(outName), pdfBytes);

    success(res, {
      message: 'Files converted and merged into PDF successfully',
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=PDF Tools`,
    });
  } catch (err) {
    console.error('ImageToPdf Conversion Error:', err);
    files.forEach(f => deleteFile(f.path));
    error(res, `Conversion failed: ${err.message}`, 500);
  }
};


