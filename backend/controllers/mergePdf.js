const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');
const { mergeToPdf } = require('../utils/pdfMerger');

module.exports = async (req, res) => {
  const files = req.files || [];
  if (files.length < 2) return error(res, 'Please upload at least 2 files to merge');

  const outputDir = path.join(__dirname, '../outputs');

  try {
    const merged = await mergeToPdf(files, outputDir);
    const pdfBytes = await merged.save();
    const outName = `${uuidv4()}.pdf`;
    fs.writeFileSync(outputPath(outName), pdfBytes);

    success(res, {
      message: `${files.length} files merged successfully into PDF`,
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=PDF Tools`,
    });
  } catch (err) {
    console.error('MergePdf Error:', err);
    files.forEach(f => deleteFile(f.path));
    error(res, `Merge failed: ${err.message}`, 500);
  }
};

