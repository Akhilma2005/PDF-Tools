const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');
const { runLibreOffice, isSofficeAvailable } = require('../utils/libreoffice');

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No Word file uploaded');
  if (!isSofficeAvailable()) { deleteFile(req.file.path); return error(res, 'LibreOffice is not available on this server. Please run locally or upgrade hosting.', 503); }

  const outputDir     = path.join(__dirname, '../outputs');
  const inputPath     = req.file.path;
  const baseName      = path.basename(inputPath, path.extname(inputPath));
  const convertedPath = path.join(outputDir, `${baseName}.pdf`);
  if (fs.existsSync(convertedPath)) fs.unlinkSync(convertedPath);

  try {
    await runLibreOffice(['--convert-to', 'pdf:writer_pdf_Export', '--outdir', outputDir, inputPath]);
    if (!fs.existsSync(convertedPath) || fs.statSync(convertedPath).size < 100) throw new Error('Conversion failed.');
    const outName = `${uuidv4()}.pdf`;
    fs.renameSync(convertedPath, path.join(outputDir, outName));
    deleteFile(inputPath);
    success(res, { message: 'Word converted to PDF', filename: outName, downloadUrl: `${downloadUrl(req, outName)}?name=PDF Tools` });
  } catch (err) {
    if (fs.existsSync(convertedPath)) fs.unlinkSync(convertedPath);
    deleteFile(inputPath);
    error(res, err.message, 500);
  }
};
