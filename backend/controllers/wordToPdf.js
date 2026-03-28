const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { success, error, downloadUrl } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');
const { convertToPdf, isSofficeAvailable } = require('../utils/libreoffice');

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No Word file uploaded');
  if (!isSofficeAvailable()) { deleteFile(req.file.path); return error(res, 'LibreOffice is not available on this server. Please run locally or upgrade hosting.', 503); }

  const outputDir = path.join(__dirname, '../outputs');
  const inputPath = req.file.path;

  try {
    const convertedPath = await convertToPdf(inputPath, outputDir);
    const outName = `${uuidv4()}.pdf`;
    fs.renameSync(convertedPath, path.join(outputDir, outName));
    deleteFile(inputPath);
    success(res, { message: 'Word converted to PDF', filename: outName, downloadUrl: `${downloadUrl(req, outName)}?name=PDF Tools` });
  } catch (err) {
    deleteFile(inputPath);
    error(res, err.message, 500);
  }
};
