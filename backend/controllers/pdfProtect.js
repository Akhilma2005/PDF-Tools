const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const qpdf = require('node-qpdf2');
const { success, error, downloadUrl, outputPath } = require('../utils/response');
const { deleteFile } = require('../utils/cleanup');

module.exports = async (req, res) => {
  if (!req.file) return error(res, 'No PDF file uploaded');
  const password  = req.body.password || '';
  if (!password)  return error(res, 'A password is required to protect the PDF', 400);

  const inputPath = req.file.path;
  const outName   = `${uuidv4()}.pdf`;
  const outPath   = outputPath(outName);

  try {
    await qpdf.encrypt({
      input:     inputPath,
      output:    outPath,
      password:  password,
      keyLength: 256,
    });
    if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 100) throw new Error('Encryption failed.');
    deleteFile(inputPath);
    success(res, {
      message: 'PDF protected successfully',
      filename: outName,
      downloadUrl: `${downloadUrl(req, outName)}?name=Protected PDF`,
    });
  } catch (err) {
    if (fs.existsSync(outPath)) deleteFile(outPath);
    deleteFile(inputPath);
    error(res, `Protect failed: ${err?.message || 'Unknown error'}`, 500);
  }
};
